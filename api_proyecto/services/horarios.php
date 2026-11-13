<?php
// Reglas de horario de las citas. No es un endpoint: no la registres en router.php.
// Lo usan crear_cita.php y reprogramar_cita.php. La misma regla está en
// aplicacion/utils/horarios.js para validar antes de enviar.

// Anticipación mínima para cancelar o reprogramar una cita.
const ANTICIPACION_CAMBIO_MINUTOS = 120;

// estado_cita.idEstado
const ESTADO_ACTIVA = 1;
const ESTADO_CANCELADA = 2;
const ESTADO_EN_CURSO = 4;

// Duración que se asume para una cita sin servicios cargados.
const DURACION_POR_DEFECTO_MINUTOS = 60;

// ---------------------------------------------------------------------------
// Superposición de citas del mismo estilista.
// Una cita ocupa [fechaHora, fechaHora + duración), con
// duración = SUM(cantidad * services.duracionMinutos) (migración 001).
// Solo bloquean las citas activas o en curso (no las canceladas ni finalizadas).
// Uso: dentro de una transacción, primero bloquearAgendaEstilista() y después
// buscarSuperposicion(), para que dos reservas simultáneas no pasen las dos.
// ---------------------------------------------------------------------------

// Bloquea la fila del estilista hasta el commit. false si el estilista no existe.
function bloquearAgendaEstilista($conn, $idEstilista) {
    $stmt = $conn->prepare("SELECT 1 FROM estilistas WHERE idEstilistas = ? FOR UPDATE");
    $stmt->bind_param("i", $idEstilista);
    $stmt->execute();
    return (bool)$stmt->get_result()->fetch_row();
}

// Duración en minutos de una lista de servicios [{ idServicios, cantidad }].
// null si algún servicio no existe o la cantidad es inválida.
function duracionDeServicios($conn, array $servicios) {
    if (empty($servicios)) {
        return DURACION_POR_DEFECTO_MINUTOS;
    }
    $stmt = $conn->prepare("SELECT duracionMinutos FROM services WHERE idServicios = ?");
    $total = 0;
    foreach ($servicios as $servicio) {
        $idServicio = (int)($servicio['idServicios'] ?? 0);
        $cantidad = (int)($servicio['cantidad'] ?? 0);
        if ($cantidad <= 0) {
            return null;
        }
        $stmt->bind_param("i", $idServicio);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        if (!$fila) {
            return null;
        }
        $total += $cantidad * (int)$fila['duracionMinutos'];
    }
    return $total;
}

// Duración en minutos de una cita existente, según sus servicios.
function duracionDeCita($conn, $idCitas) {
    $stmt = $conn->prepare("SELECT SUM(cs.cantidad * s.duracionMinutos) AS duracion
                            FROM citas_servicios cs
                            INNER JOIN services s ON s.idServicios = cs.servicios_idServicios
                            WHERE cs.citas_idCitas = ?");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    $duracion = $stmt->get_result()->fetch_assoc()['duracion'];
    return $duracion !== null ? (int)$duracion : DURACION_POR_DEFECTO_MINUTOS;
}

// Busca otra cita del estilista que se superponga con [$fechaHora, $fechaHora + $duracion).
// $excluirIdCitas: la propia cita al reprogramar (0 al crear).
// Devuelve ['desde' => 'HH:MM', 'hasta' => 'HH:MM'] de la primera que choca, o null.
function buscarSuperposicion($conn, $idEstilista, $fechaHora, $duracion, $excluirIdCitas = 0) {
    $sql = "SELECT DATE_FORMAT(c.fechaHora, '%H:%i') AS desde,
                   DATE_FORMAT(c.fechaHora + INTERVAL COALESCE(d.duracion, ?) MINUTE, '%H:%i') AS hasta
            FROM citas c
            LEFT JOIN (
                SELECT cs.citas_idCitas, SUM(cs.cantidad * s.duracionMinutos) AS duracion
                FROM citas_servicios cs
                INNER JOIN services s ON s.idServicios = cs.servicios_idServicios
                GROUP BY cs.citas_idCitas
            ) d ON d.citas_idCitas = c.idCitas
            WHERE c.estilistas = ?
              AND c.idCitas <> ?
              AND c.estado_cita_idEstado IN (?, ?)
              AND c.fechaHora < CAST(? AS DATETIME) + INTERVAL ? MINUTE
              AND c.fechaHora + INTERVAL COALESCE(d.duracion, ?) MINUTE > CAST(? AS DATETIME)
            ORDER BY c.fechaHora
            LIMIT 1";
    $porDefecto = DURACION_POR_DEFECTO_MINUTOS;
    $activa = ESTADO_ACTIVA;
    $enCurso = ESTADO_EN_CURSO;
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iiiiisiis", $porDefecto, $idEstilista, $excluirIdCitas, $activa, $enCurso,
                      $fechaHora, $duracion, $porDefecto, $fechaHora);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc() ?: null;
}

function mensajeSuperposicion(array $choque) {
    return "El estilista ya tiene una cita reservada de {$choque['desde']} a {$choque['hasta']} en ese horario. Elegí otro horario.";
}

// Explica por qué no se pudo cancelar o reprogramar una cita del cliente
// (se llama cuando el UPDATE condicionado no afectó ninguna fila).
function motivoNoModificable($conn, $idCitas, $idClientes) {
    $stmt = $conn->prepare("SELECT estado_cita_idEstado AS estado FROM citas WHERE idCitas = ? AND clientes = ?");
    $stmt->bind_param("ii", $idCitas, $idClientes);
    $stmt->execute();
    $cita = $stmt->get_result()->fetch_assoc();

    if (!$cita) {
        return 'La cita no existe.';
    }
    if ((int)$cita['estado'] !== ESTADO_ACTIVA) {
        return 'Solo se pueden modificar citas activas.';
    }
    $horas = ANTICIPACION_CAMBIO_MINUTOS / 60;
    return "Las citas se pueden modificar hasta {$horas} horas antes. Comunicate con el salón.";
}

// Devuelve null si la fecha y hora cae dentro del horario del local, o el mensaje de error.
// Lunes a viernes 08:00-12:00 y 13:30-20:00; sábados 09:00-17:00; domingos cerrado.
function validarHorarioLocal(DateTime $fechaHora) {
    $diaSemana = (int)$fechaHora->format('N');
    $totalMinutos = (int)$fechaHora->format('G') * 60 + (int)$fechaHora->format('i');

    if ($diaSemana >= 1 && $diaSemana <= 5) {
        $enTurno1 = $totalMinutos >= 8 * 60 && $totalMinutos <= 12 * 60;
        $enTurno2 = $totalMinutos >= 13 * 60 + 30 && $totalMinutos <= 20 * 60;
        if (!$enTurno1 && !$enTurno2) {
            return 'Horario fuera del rango permitido de lunes a viernes (08:00 a 12:00 y 13:30 a 20:00).';
        }
        return null;
    }
    if ($diaSemana == 6) {
        if ($totalMinutos < 9 * 60 || $totalMinutos > 17 * 60) {
            return 'Horario fuera del rango permitido para los sábados (09:00 a 17:00).';
        }
        return null;
    }
    return 'El local permanece cerrado los domingos.';
}
?>
