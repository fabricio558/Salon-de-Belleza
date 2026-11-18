<?php
// Citas y pedidos del cliente de la sesión que todavía tienen algo para pagar, con el medio
// que eligió para pagar en el local (medioPagoLocal, migración 007) si eligió alguno.
// GET index.php?action=get_pagos_pendientes
// Requiere sesión de cliente.
//
// - citas: no canceladas, con saldo (total de servicios - pagos).
// - pedidos: pendientes de retiro y sin pagar (antes marca los vencidos).
// - mediosLocal: los medios que puede elegir para pagar en el local (Efectivo, Transferencia).
// Fechas para mostrar formateadas por MySQL (ver CLAUDE.md).
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/pagos_citas.php';
require_once __DIR__ . '/pedidos.php';

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH]);
    $idClientes = $sesion['idUsuarios'];

    vencerPedidos($conn, $idClientes);

    $cancelada = ESTADO_CITA_CANCELADA;
    $stmt = $conn->prepare("SELECT c.idCitas,
                                   DATE(c.fechaHora) AS fecha, TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
                                   UNIX_TIMESTAMP(c.fechaHora) AS fechaHoraTs,
                                   CONCAT(ue.nombres, ' ', ue.apellido) AS estilista,
                                   ec.estado_cita AS estado,
                                   (SELECT GROUP_CONCAT(s.servicio ORDER BY s.servicio SEPARATOR ', ')
                                    FROM citas_servicios cs INNER JOIN services s ON s.idServicios = cs.servicios_idServicios
                                    WHERE cs.citas_idCitas = c.idCitas) AS servicios,
                                   (SELECT COALESCE(SUM(cs.cantidad * cs.precioHistorico), 0)
                                    FROM citas_servicios cs WHERE cs.citas_idCitas = c.idCitas) AS total,
                                   (SELECT COALESCE(SUM(p.montoTotal), 0) FROM pagos p WHERE p.citas_idCitas = c.idCitas) AS pagado,
                                   (SELECT pm.estado FROM pagos_mp pm WHERE pm.citas_idCitas = c.idCitas
                                    ORDER BY pm.idPagoMp DESC LIMIT 1) AS estadoPagoMp,
                                   c.medioPagoLocal AS idMedioPagoLocal,
                                   mpl.medioPago AS medioPagoLocal
                            FROM citas c
                            INNER JOIN usuarios ue ON ue.idUsuarios = c.estilistas
                            INNER JOIN estado_cita ec ON ec.idEstado = c.estado_cita_idEstado
                            LEFT JOIN medios_pago mpl ON mpl.idMedios_pago = c.medioPagoLocal
                            WHERE c.clientes = ? AND c.estado_cita_idEstado <> ?
                            HAVING total > pagado
                            ORDER BY c.fechaHora ASC");
    $stmt->bind_param("ii", $idClientes, $cancelada);
    $stmt->execute();
    $citas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($citas as &$cita) {
        $cita['idCitas'] = (int)$cita['idCitas'];
        $cita['fechaHoraTs'] = (int)$cita['fechaHoraTs'];
        $cita['total'] = round((float)$cita['total'], 2);
        $cita['pagado'] = round((float)$cita['pagado'], 2);
        $cita['saldo'] = max(0, round($cita['total'] - $cita['pagado'], 2));
        $cita['idMedioPagoLocal'] = $cita['idMedioPagoLocal'] !== null ? (int)$cita['idMedioPagoLocal'] : null;
    }
    unset($cita);

    $stmt = $conn->prepare("SELECT p.idPedido,
                                   DATE(p.fechaHora) AS fecha, TIME_FORMAT(p.fechaHora, '%H:%i') AS hora,
                                   DATE(p.venceEl) AS fechaVence, TIME_FORMAT(p.venceEl, '%H:%i') AS horaVence,
                                   p.montoTotal AS total,
                                   (SELECT pm.estado FROM pagos_mp pm WHERE pm.pedidos_idPedido = p.idPedido
                                    ORDER BY pm.idPagoMp DESC LIMIT 1) AS estadoPagoMp,
                                   p.medioPagoLocal AS idMedioPagoLocal,
                                   mpl.medioPago AS medioPagoLocal
                            FROM pedidos p
                            LEFT JOIN medios_pago mpl ON mpl.idMedios_pago = p.medioPagoLocal
                            WHERE p.clientes_idUsuarios = ? AND p.estado = 'pendiente' AND p.pagos_idPagos IS NULL
                            ORDER BY p.fechaHora ASC, p.idPedido ASC");
    $stmt->bind_param("i", $idClientes);
    $stmt->execute();
    $pedidos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($pedidos as &$pedido) {
        $pedido['idPedido'] = (int)$pedido['idPedido'];
        $pedido['total'] = round((float)$pedido['total'], 2);
        $pedido['pagado'] = 0;
        $pedido['saldo'] = $pedido['total'];
        $pedido['idMedioPagoLocal'] = $pedido['idMedioPagoLocal'] !== null ? (int)$pedido['idMedioPagoLocal'] : null;
    }
    unset($pedido);

    echo json_encode([
        'success' => true,
        'data' => [
            'mediosLocal' => mediosPagoLocal($conn),
            'citas'       => $citas,
            'pedidos'     => $pedidos,
        ],
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('get_pagos_pendientes: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar los pagos pendientes']);
}
?>
