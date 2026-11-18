<?php
// Pedidos de productos de un cliente, con su detalle, del más nuevo al más viejo.
// GET index.php?action=get_pedidos_cliente&idClientes=<id>
// Antes de listar marca como vencidos los pendientes cuyo plazo pasó (y devuelve el stock).
// Pago: `pagado` (pagos_idPagos), `medioPago` del cobro, `estadoPagoMp` (último intento con
// Mercado Pago) y `medioPagoLocal` (lo que eligió para pagar en el local, migración 007).
// Fechas para mostrar: formateadas por MySQL en hora del salón (ver CLAUDE.md).
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/pedidos.php';

$idClientes = isset($_GET['idClientes']) ? (int)$_GET['idClientes'] : 0;

if ($idClientes <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID del cliente.']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    vencerPedidos($conn, $idClientes);

    $stmt = $conn->prepare("SELECT p.idPedido, p.estado, p.canceladoPor, p.montoTotal,
                                   DATE(p.fechaHora) AS fecha, TIME_FORMAT(p.fechaHora, '%H:%i') AS hora,
                                   DATE(p.venceEl) AS fechaVence, TIME_FORMAT(p.venceEl, '%H:%i') AS horaVence,
                                   DATE(p.fechaCierre) AS fechaCierre,
                                   mp.medioPago,
                                   (p.pagos_idPagos IS NOT NULL) AS pagado,
                                   DATE(pg.fechaHora) AS fechaPago,
                                   (SELECT pm.estado FROM pagos_mp pm WHERE pm.pedidos_idPedido = p.idPedido
                                    ORDER BY pm.idPagoMp DESC LIMIT 1) AS estadoPagoMp,
                                   p.medioPagoLocal AS idMedioPagoLocal,
                                   mpl.medioPago AS medioPagoLocal
                            FROM pedidos p
                            LEFT JOIN pagos pg ON pg.idPagos = p.pagos_idPagos
                            LEFT JOIN medios_pago mp ON mp.idMedios_pago = pg.medios_pago_idMedios_pago
                            LEFT JOIN medios_pago mpl ON mpl.idMedios_pago = p.medioPagoLocal
                            WHERE p.clientes_idUsuarios = ?
                            ORDER BY p.fechaHora DESC, p.idPedido DESC");
    $stmt->bind_param("i", $idClientes);
    $stmt->execute();
    $pedidos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $detalle = $conn->prepare("SELECT pp.productos_idProductos AS idProductos, pr.nombreProducto,
                                      pp.cantidad, pp.precioUnitario
                               FROM pedidos_productos pp
                               INNER JOIN productos pr ON pr.idProductos = pp.productos_idProductos
                               WHERE pp.pedidos_idPedido = ?
                               ORDER BY pr.nombreProducto");
    foreach ($pedidos as &$pedido) {
        $id = (int)$pedido['idPedido'];
        $pedido['idPedido'] = $id;
        $pedido['montoTotal'] = (float)$pedido['montoTotal'];
        $pedido['pagado'] = (bool)$pedido['pagado'];
        $pedido['saldo'] = $pedido['pagado'] ? 0 : $pedido['montoTotal'];
        $pedido['idMedioPagoLocal'] = $pedido['idMedioPagoLocal'] !== null ? (int)$pedido['idMedioPagoLocal'] : null;
        $detalle->bind_param("i", $id);
        $detalle->execute();
        $lineas = $detalle->get_result()->fetch_all(MYSQLI_ASSOC);
        foreach ($lineas as &$linea) {
            $linea['idProductos'] = (int)$linea['idProductos'];
            $linea['cantidad'] = (int)$linea['cantidad'];
            $linea['precioUnitario'] = (float)$linea['precioUnitario'];
        }
        unset($linea);
        $pedido['productos'] = $lineas;
    }
    unset($pedido);

    echo json_encode([
        'success' => true,
        'diasVencimiento' => DIAS_VENCIMIENTO_PEDIDO,
        'data' => $pedidos,
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('get_pedidos_cliente: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar tus pedidos']);
}
?>
