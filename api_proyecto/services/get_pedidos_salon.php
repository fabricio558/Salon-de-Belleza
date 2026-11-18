<?php
// Pedidos de productos de todos los clientes, para el recepcionista.
// GET index.php?action=get_pedidos_salon&vista=pendientes|historial
// - pendientes: los reservados que todavía no se retiraron (del más viejo al más nuevo).
// - historial: entregados y cancelados (los últimos LIMITE_HISTORIAL_PEDIDOS).
// Requiere sesión de recepcionista. Antes de listar marca los vencidos (y devuelve el stock).
// Pago de cada pedido: `pagado` + `medioPago` (el cobro registrado), `estadoPagoMp` (último
// intento con Mercado Pago) y `medioPagoLocal` (lo que eligió el cliente para pagar en el local).
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/pedidos.php';

const LIMITE_HISTORIAL_PEDIDOS = 50;

$vista = ($_GET['vista'] ?? 'pendientes') === 'historial' ? 'historial' : 'pendientes';

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    requerirSesion($conn, [ROL_RECEPCIONISTA_AUTH]);

    vencerPedidos($conn);

    $sql = "SELECT p.idPedido, p.estado, p.canceladoPor, p.montoTotal,
                   p.clientes_idUsuarios AS idClientes,
                   CONCAT(u.nombres, ' ', u.apellido) AS cliente,
                   u.nombreUsuario, u.correo,
                   DATE(p.fechaHora) AS fecha, TIME_FORMAT(p.fechaHora, '%H:%i') AS hora,
                   DATE(p.venceEl) AS fechaVence, TIME_FORMAT(p.venceEl, '%H:%i') AS horaVence,
                   DATE(p.fechaCierre) AS fechaCierre, TIME_FORMAT(p.fechaCierre, '%H:%i') AS horaCierre,
                   CONCAT(uc.nombres, ' ', uc.apellido) AS cerradoPor,
                   (p.pagos_idPagos IS NOT NULL) AS pagado,
                   mp.medioPago,
                   DATE(pg.fechaHora) AS fechaPago,
                   (SELECT pm.estado FROM pagos_mp pm WHERE pm.pedidos_idPedido = p.idPedido
                    ORDER BY pm.idPagoMp DESC LIMIT 1) AS estadoPagoMp,
                   mpl.medioPago AS medioPagoLocal
            FROM pedidos p
            INNER JOIN usuarios u ON u.idUsuarios = p.clientes_idUsuarios
            LEFT JOIN usuarios uc ON uc.idUsuarios = p.usuarios_idCierre
            LEFT JOIN pagos pg ON pg.idPagos = p.pagos_idPagos
            LEFT JOIN medios_pago mp ON mp.idMedios_pago = pg.medios_pago_idMedios_pago
            LEFT JOIN medios_pago mpl ON mpl.idMedios_pago = p.medioPagoLocal ";
    if ($vista === 'pendientes') {
        $stmt = $conn->prepare($sql . "WHERE p.estado = 'pendiente' ORDER BY p.fechaHora ASC, p.idPedido ASC");
    } else {
        $stmt = $conn->prepare($sql . "WHERE p.estado <> 'pendiente' ORDER BY p.fechaCierre DESC, p.idPedido DESC LIMIT ?");
        $limite = LIMITE_HISTORIAL_PEDIDOS;
        $stmt->bind_param("i", $limite);
    }
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
        $pedido['idClientes'] = (int)$pedido['idClientes'];
        $pedido['montoTotal'] = (float)$pedido['montoTotal'];
        $pedido['pagado'] = (bool)$pedido['pagado'];
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

    echo json_encode(['success' => true, 'vista' => $vista, 'data' => $pedidos]);
} catch (mysqli_sql_exception $e) {
    error_log('get_pedidos_salon: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar los pedidos']);
}
?>
