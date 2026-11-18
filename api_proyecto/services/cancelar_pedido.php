<?php
// El cliente cancela un pedido propio que todavía esté pendiente (no retirado).
// Las unidades reservadas vuelven al stock.
// POST index.php?action=cancelar_pedido
// Body: { idClientes, idPedido }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/pedidos.php';
require_once __DIR__ . '/pagos_pedidos.php';

$input = leerJsonBody();
$idClientes = (int)($input['idClientes'] ?? 0);
$idPedido   = (int)($input['idPedido'] ?? 0);

if ($idClientes <= 0 || $idPedido <= 0) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos del pedido.']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    // Si ya venció, que quede como vencido (no como cancelado por el cliente).
    vencerPedidos($conn, $idClientes);

    $conn->begin_transaction();
    $enTransaccion = true;

    $stmt = $conn->prepare("SELECT estado, pagos_idPagos FROM pedidos WHERE idPedido = ? AND clientes_idUsuarios = ? FOR UPDATE");
    $stmt->bind_param("ii", $idPedido, $idClientes);
    $stmt->execute();
    $pedido = $stmt->get_result()->fetch_assoc();

    if (!$pedido) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El pedido no existe.']);
        exit;
    }
    if ($pedido['estado'] !== 'pendiente') {
        $conn->rollback();
        $motivo = $pedido['estado'] === 'entregado' ? 'ya fue entregado' : 'ya está cancelado';
        echo json_encode(['success' => false, 'message' => "No se puede cancelar: el pedido {$motivo}."]);
        exit;
    }
    // Pagado online (o con el pago en proceso): el reintegro es manual, así que lo gestiona el salón.
    if ($pedido['pagos_idPagos'] !== null || pedidoTienePagoMpEnProceso($conn, $idPedido)) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El pedido ya está pagado (o el pago está en proceso). Para cancelarlo comunicate con el salón.']);
        exit;
    }

    devolverStockPedido($conn, $idPedido);
    marcarPedidoCancelado($conn, $idPedido, 'cliente', $idClientes);

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Tu pedido fue cancelado.']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('cancelar_pedido: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cancelar el pedido']);
}
?>
