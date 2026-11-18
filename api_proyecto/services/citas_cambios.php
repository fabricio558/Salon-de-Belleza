<?php
// Cancelación y reprogramación de citas: lógica compartida por los endpoints del
// cliente (cancelar_cita, reprogramar_cita) y del salón (cancelar_cita_salon,
// reprogramar_cita_salon). No es un endpoint: no la registres en router.php.
// Cada cambio queda en la tabla citas_cambios (migración 002).

require_once __DIR__ . '/horarios.php';
require_once __DIR__ . '/comun.php';

const ROL_ESTILISTA = 2;
const ROL_RECEPCIONISTA_CITAS = 3;
const MENSAJE_MIN_CARACTERES = 5;
const MENSAJE_MAX_CARACTERES = 255;

// Valida el mensaje que el salón le deja al cliente. Devuelve el error o null.
function validarMensajeCliente($mensaje) {
    $largo = mb_strlen($mensaje);
    if ($largo < MENSAJE_MIN_CARACTERES) {
        return 'Escribile al cliente un mensaje explicando el motivo (al menos ' . MENSAJE_MIN_CARACTERES . ' caracteres).';
    }
    if ($largo > MENSAJE_MAX_CARACTERES) {
        return 'El mensaje puede tener hasta ' . MENSAJE_MAX_CARACTERES . ' caracteres.';
    }
    return null;
}

// Para el personal del salón: bloquea la cita (FOR UPDATE, dentro de una transacción) y
// verifica que el solicitante pueda modificarla. El recepcionista puede modificar
// cualquier cita; el estilista, solo las suyas.
// Devuelve ['cita' => fila] o ['error' => mensaje, 'codigo' => HTTP].
// OJO: el id del solicitante lo manda la app (ver permisos.php), no es autenticación real.
function obtenerCitaParaPersonal($conn, $idSolicitante, $idCitas) {
    $stmt = $conn->prepare("SELECT idRol FROM usuarios WHERE idUsuarios = ? AND estado = 1 AND idRol IN (?, ?)");
    $rolEstilista = ROL_ESTILISTA;
    $rolRecepcionista = ROL_RECEPCIONISTA_CITAS;
    $stmt->bind_param("iii", $idSolicitante, $rolEstilista, $rolRecepcionista);
    $stmt->execute();
    $solicitante = $stmt->get_result()->fetch_assoc();
    if (!$solicitante) {
        return ['error' => 'Solo un estilista o un recepcionista puede modificar citas desde acá.', 'codigo' => 403];
    }

    $stmt = $conn->prepare("SELECT idCitas, estilistas, clientes, fechaHora, estado_cita_idEstado AS estado
                            FROM citas WHERE idCitas = ? FOR UPDATE");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    $cita = $stmt->get_result()->fetch_assoc();
    if (!$cita) {
        return ['error' => 'La cita no existe.', 'codigo' => 200];
    }
    if ((int)$solicitante['idRol'] === ROL_ESTILISTA && (int)$cita['estilistas'] !== (int)$idSolicitante) {
        return ['error' => 'Solo podés modificar tus propias citas.', 'codigo' => 403];
    }
    if ((int)$cita['estado'] !== ESTADO_ACTIVA) {
        return ['error' => 'Solo se pueden modificar citas activas (no las que están en curso, finalizadas o canceladas).', 'codigo' => 200];
    }
    return ['cita' => $cita];
}

// Para el cliente: bloquea y devuelve la cita si es suya, está activa y falta al menos
// ANTICIPACION_CAMBIO_MINUTOS. null si no se puede modificar (ver motivoNoModificable).
function obtenerCitaModificablePorCliente($conn, $idClientes, $idCitas) {
    $stmt = $conn->prepare("SELECT idCitas, estilistas, fechaHora FROM citas
                            WHERE idCitas = ? AND clientes = ? AND estado_cita_idEstado = ?
                              AND fechaHora >= NOW() + INTERVAL ? MINUTE
                            FOR UPDATE");
    $activa = ESTADO_ACTIVA;
    $anticipacion = ANTICIPACION_CAMBIO_MINUTOS;
    $stmt->bind_param("iiii", $idCitas, $idClientes, $activa, $anticipacion);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc() ?: null;
}

// Mueve la cita a $fechaHora si el estilista tiene ese horario libre. Debe llamarse
// dentro de una transacción, con la cita ya bloqueada. Devuelve el error o null.
function moverCita($conn, $idCitas, $idEstilista, $fechaHora) {
    bloquearAgendaEstilista($conn, $idEstilista);

    $choque = buscarSuperposicion($conn, $idEstilista, $fechaHora, duracionDeCita($conn, $idCitas), $idCitas);
    if ($choque) {
        return mensajeSuperposicion($choque);
    }

    $stmt = $conn->prepare("UPDATE citas SET fechaHora = ? WHERE idCitas = ?");
    $stmt->bind_param("si", $fechaHora, $idCitas);
    $stmt->execute();
    return null;
}

function cancelarCitaPorId($conn, $idCitas) {
    $stmt = $conn->prepare("UPDATE citas SET estado_cita_idEstado = ? WHERE idCitas = ?");
    $cancelada = ESTADO_CANCELADA;
    $stmt->bind_param("ii", $cancelada, $idCitas);
    $stmt->execute();
}

// $tipo: 'cancelacion' | 'reprogramacion'. $fechaHoraNueva y $mensaje pueden ser null.
function registrarCambioCita($conn, $idCitas, $tipo, $fechaHoraAnterior, $fechaHoraNueva, $mensaje, $idAutor) {
    $stmt = $conn->prepare("INSERT INTO citas_cambios
                                (citas_idCitas, tipo, fechaHoraAnterior, fechaHoraNueva, mensaje, usuarios_idUsuarios)
                            VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssi", $idCitas, $tipo, $fechaHoraAnterior, $fechaHoraNueva, $mensaje, $idAutor);
    $stmt->execute();
}

// Valida formato, horario del local y que sea futura (según MySQL). Devuelve el error o null.
function validarNuevaFechaHora($conn, $fechaHora) {
    $nueva = DateTime::createFromFormat('Y-m-d H:i:s', $fechaHora);
    if (!$nueva || $nueva->format('Y-m-d H:i:s') !== $fechaHora) {
        return 'Fecha y hora inválidas.';
    }
    $mensajeHorario = validarHorarioLocal($nueva);
    if ($mensajeHorario !== null) {
        return $mensajeHorario;
    }
    $stmt = $conn->prepare("SELECT ? > NOW() AS futura");
    $stmt->bind_param("s", $fechaHora);
    $stmt->execute();
    if (!(int)$stmt->get_result()->fetch_assoc()['futura']) {
        return 'Elegí una fecha y hora futura.';
    }
    return null;
}

// Termina la transacción según el resultado y responde.
function responderCambio($conn, $enTransaccion, array $respuesta, $codigo = 200) {
    if ($enTransaccion) {
        $respuesta['success'] ? $conn->commit() : $conn->rollback();
    }
    http_response_code($codigo);
    echo json_encode($respuesta);
    exit;
}
?>
