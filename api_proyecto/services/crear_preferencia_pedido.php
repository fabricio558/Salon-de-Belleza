<?php
// Crea una preferencia de Checkout Pro para pagar un pedido de productos desde la app.
// POST index.php?action=crear_preferencia_pedido
// Body: { idPedido, urlRetorno? }   (urlRetorno: exp://... o salonbelleza://, para volver a la app)
// Requiere sesión de cliente: solo puede pagar sus pedidos pendientes y sin pagar.
// Ítems y monto salen de la base (pedidos_productos), nunca de la app.
// La preferencia dura 24 h, o menos si el pedido vence antes.
// Responde { success, data: { idPagoMp, initPoint, monto } }.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/mercadopago.php';
require_once __DIR__ . '/pedidos.php';

const MINUTOS_VENCIMIENTO_PREFERENCIA_PEDIDO = 24 * 60;
// Con menos margen que esto el pedido vencería antes de que MP acredite el pago.
const MINUTOS_MINIMOS_PARA_PAGAR_PEDIDO = 30;

$input = leerJsonBody();
$idPedido = (int)($input['idPedido'] ?? 0);
$urlRetorno = $input['urlRetorno'] ?? '';

if ($idPedido <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta el pedido a pagar.']);
    exit;
}
if ($urlRetorno !== '' && !urlRetornoAppValida($urlRetorno)) {
    $urlRetorno = '';
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH]);
    mpConfig();

    // Que un pedido vencido quede como vencido antes de intentar cobrarlo.
    vencerPedidos($conn, $sesion['idUsuarios']);

    $conn->begin_transaction();
    $enTransaccion = true;

    $pedido = totalesPedido($conn, $idPedido, true);
    if (!$pedido || $pedido['idClientes'] !== $sesion['idUsuarios']) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El pedido no existe.']);
        exit;
    }
    if ($pedido['estado'] !== 'pendiente') {
        $conn->rollback();
        $motivo = $pedido['estado'] === 'entregado' ? 'ya fue entregado' : 'está cancelado';
        echo json_encode(['success' => false, 'message' => "No se puede pagar: el pedido {$motivo}."]);
        exit;
    }
    if ($pedido['saldo'] <= 0) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El pedido ya está pagado.']);
        exit;
    }
    if (pedidoTienePagoMpEnProceso($conn, $idPedido)) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Hay un pago de este pedido que Mercado Pago todavía está procesando. Esperá a que se confirme.']);
        exit;
    }
    if ($pedido['minutosParaVencer'] < MINUTOS_MINIMOS_PARA_PAGAR_PEDIDO) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El pedido está por vencer: pagalo al retirarlo en el salón.']);
        exit;
    }

    $items = [];
    foreach (productosPedido($conn, $idPedido) as $linea) {
        $items[] = [
            'id'          => 'producto-' . $linea['idProductos'],
            'title'       => $linea['nombreProducto'],
            'quantity'    => $linea['cantidad'],
            'unit_price'  => $linea['precioUnitario'],
            'currency_id' => 'ARS',
        ];
    }

    $minutos = min(MINUTOS_VENCIMIENTO_PREFERENCIA_PEDIDO, $pedido['minutosParaVencer']);
    $cobro = mpIniciarCobro($conn, ['tipo' => 'pedido', 'id' => $idPedido], $pedido['saldo'], $items, 'cliente',
                            $sesion['idUsuarios'], $urlRetorno, $minutos);

    $conn->commit();
    $enTransaccion = false;

    echo json_encode([
        'success' => true,
        'data' => [
            'idPagoMp'  => $cobro['idPagoMp'],
            'initPoint' => $cobro['initPoint'],
            'monto'     => $pedido['saldo'],
        ],
    ]);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('crear_preferencia_pedido: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al preparar el pago']);
} catch (RuntimeException $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('crear_preferencia_pedido: ' . $e->getMessage());
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'No se pudo iniciar el pago con Mercado Pago. Intentá de nuevo más tarde.']);
}
?>
