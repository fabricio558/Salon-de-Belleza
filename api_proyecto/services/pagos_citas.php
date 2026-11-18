<?php
// Cobro de citas: totales, saldo y registro en `pagos`. No es un endpoint: no la registres en router.php.
// Lo usan crear_preferencia_cita, webhook_mp, get_estado_pago_cita, registrar_cobro_cita, las
// cancelaciones (para avisar si la cita ya estaba pagada), elegir_pago_local y get_pagos_pendientes.
//
// El total de una cita es SUM(citas_servicios.cantidad * precioHistorico); lo pagado es
// SUM(pagos.montoTotal) de la cita. El estado de la cita (estado_cita) no cambia por pagar.

const ESTADO_CITA_CANCELADA = 2;
const MEDIO_PAGO_MERCADOPAGO = 'Mercado Pago';
// Medios que el cliente puede elegir para pagar en el local (citas.medioPagoLocal y
// pedidos.medioPagoLocal, migración 007). Nombres exactos de `medios_pago`.
const MEDIOS_PAGO_LOCAL = ['Efectivo', 'Transferencia'];

// Medios de MEDIOS_PAGO_LOCAL que están activos: [{ idMedios_pago, medioPago }].
function mediosPagoLocal($conn) {
    $result = $conn->query("SELECT idMedios_pago, medioPago FROM medios_pago WHERE estado = 1 ORDER BY idMedios_pago");
    $medios = [];
    while ($row = $result->fetch_assoc()) {
        if (in_array($row['medioPago'], MEDIOS_PAGO_LOCAL, true)) {
            $medios[] = ['idMedios_pago' => (int)$row['idMedios_pago'], 'medioPago' => $row['medioPago']];
        }
    }
    return $medios;
}

// Datos de la cita con total, pagado y saldo. Con $bloquear = true bloquea la fila de la
// cita (FOR UPDATE, dentro de una transacción) para que dos cobros simultáneos no pasen
// los dos el control del saldo. Devuelve null si la cita no existe.
function totalesCita($conn, $idCitas, $bloquear = false) {
    $sql = "SELECT idCitas, clientes, estilistas, estado_cita_idEstado AS idEstado
            FROM citas WHERE idCitas = ?" . ($bloquear ? " FOR UPDATE" : "");
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    $cita = $stmt->get_result()->fetch_assoc();
    if (!$cita) {
        return null;
    }

    $stmt = $conn->prepare("SELECT COALESCE(SUM(cantidad * precioHistorico), 0) AS total
                            FROM citas_servicios WHERE citas_idCitas = ?");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    $total = round((float)$stmt->get_result()->fetch_assoc()['total'], 2);

    $pagado = montoPagadoCita($conn, $idCitas);

    return [
        'idCitas'     => (int)$cita['idCitas'],
        'idClientes'  => (int)$cita['clientes'],
        'idEstilistas'=> (int)$cita['estilistas'],
        'idEstado'    => (int)$cita['idEstado'],
        'total'       => $total,
        'pagado'      => $pagado,
        'saldo'       => max(0, round($total - $pagado, 2)),
    ];
}

function montoPagadoCita($conn, $idCitas) {
    $stmt = $conn->prepare("SELECT COALESCE(SUM(montoTotal), 0) AS pagado FROM pagos WHERE citas_idCitas = ?");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    return round((float)$stmt->get_result()->fetch_assoc()['pagado'], 2);
}

// Líneas de la cita para mostrar o para armar los ítems de Mercado Pago.
function serviciosCita($conn, $idCitas) {
    $stmt = $conn->prepare("SELECT cs.servicios_idServicios AS idServicios, s.servicio, cs.cantidad, cs.precioHistorico
                            FROM citas_servicios cs
                            INNER JOIN services s ON s.idServicios = cs.servicios_idServicios
                            WHERE cs.citas_idCitas = ?
                            ORDER BY s.servicio");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    $result = $stmt->get_result();
    $lineas = [];
    while ($row = $result->fetch_assoc()) {
        $lineas[] = [
            'idServicios'     => (int)$row['idServicios'],
            'servicio'        => $row['servicio'],
            'cantidad'        => (int)$row['cantidad'],
            'precioHistorico' => round((float)$row['precioHistorico'], 2),
        ];
    }
    return $lineas;
}

// id del medio de pago activo con ese nombre, o null.
function idMedioPagoPorNombre($conn, $nombre) {
    $stmt = $conn->prepare("SELECT idMedios_pago FROM medios_pago WHERE medioPago = ? AND estado = 1");
    $stmt->bind_param("s", $nombre);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    return $fila ? (int)$fila['idMedios_pago'] : null;
}

// Registra un cobro de la cita en `pagos`. Si es el primer cobro de la cita, copia sus
// servicios a `pagos_servicios` (el detalle de lo cobrado); los cobros de saldo posteriores
// (por ejemplo, después de agregar un servicio) quedan sin detalle.
// Usar dentro de una transacción, con la cita bloqueada por totalesCita(..., true).
function registrarPagoCita($conn, $cita, $monto, $idMedioPago) {
    $esPrimerPago = $cita['pagado'] <= 0;

    $stmt = $conn->prepare("INSERT INTO pagos (fechaHora, montoTotal, clientes_idUsuarios, citas_idCitas, medios_pago_idMedios_pago)
                            VALUES (NOW(), ?, ?, ?, ?)");
    $stmt->bind_param("diii", $monto, $cita['idClientes'], $cita['idCitas'], $idMedioPago);
    $stmt->execute();
    $idPagos = (int)$conn->insert_id;

    if ($esPrimerPago) {
        $stmt = $conn->prepare("INSERT INTO pagos_servicios (cantidad, precioHistorico, pagos_idPagos, servicios_idServicios)
                                SELECT cantidad, precioHistorico, ?, servicios_idServicios
                                FROM citas_servicios WHERE citas_idCitas = ?");
        $stmt->bind_param("ii", $idPagos, $cita['idCitas']);
        $stmt->execute();
    }
    return $idPagos;
}

// Último intento de cobro con Mercado Pago de la cita (o null).
function ultimoPagoMpCita($conn, $idCitas) {
    $stmt = $conn->prepare("SELECT idPagoMp, externalReference, mpPaymentId, estado, statusDetail, monto,
                                   DATE(fechaCreacion) AS fecha, TIME_FORMAT(fechaCreacion, '%H:%i') AS hora,
                                   (venceEl > NOW()) AS vigente
                            FROM pagos_mp WHERE citas_idCitas = ?
                            ORDER BY idPagoMp DESC LIMIT 1");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    if (!$fila) {
        return null;
    }
    $fila['idPagoMp'] = (int)$fila['idPagoMp'];
    $fila['monto'] = (float)$fila['monto'];
    $fila['vigente'] = (bool)$fila['vigente'];
    return $fila;
}

// Mensaje extra para las cancelaciones de citas con pagos.
function avisoCancelacionPagada($conn, $idCitas) {
    $pagado = montoPagadoCita($conn, $idCitas);
    if ($pagado <= 0) {
        return '';
    }
    return ' La cita tenía pagos por $' . number_format($pagado, 2, ',', '.') .
           ': el salón se va a comunicar para gestionar el reintegro.';
}
?>
