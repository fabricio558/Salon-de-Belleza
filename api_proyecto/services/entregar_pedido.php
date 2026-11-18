<?php
// El recepcionista entrega un pedido pendiente. Si todavía no está pagado, lo cobra en el
// mostrador en el mismo paso (pagos + pagos_productos) con el medio que indique.
// POST index.php?action=entregar_pedido
// Body: { idPedido, idMedios_pago? }   (idMedios_pago obligatorio si el pedido no está pagado)
// Requiere sesión de recepcionista. El monto sale de pedidos_productos, nunca de la app.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/pagos_citas.php';
require_once __DIR__ . '/pagos_pedidos.php';
require_once __DIR__ . '/pedidos.php';

$input = leerJsonBody();
$idPedido = (int)($input['idPedido'] ?? 0);
$idMedio = isset($input['idMedios_pago']) ? (int)$input['idMedios_pago'] : 0;

if ($idPedido <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta el pedido.']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_RECEPCIONISTA_AUTH]);

    vencerPedidos($conn);

    $conn->begin_transaction();
    $enTransaccion = true;

    $pedido = totalesPedido($conn, $idPedido, true);
    if (!$pedido) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El pedido no existe.']);
        exit;
    }
    if ($pedido['estado'] !== 'pendiente') {
        $conn->rollback();
        $motivo = $pedido['estado'] === 'entregado' ? 'ya fue entregado' : 'está cancelado';
        echo json_encode(['success' => false, 'message' => "No se puede entregar: el pedido {$motivo}."]);
        exit;
    }

    $cobrado = null;
    if ($pedido['idPagos'] === null) {
        if (pedidoTienePagoMpEnProceso($conn, $idPedido)) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'El cliente tiene un pago con Mercado Pago en proceso. Esperá a que se confirme antes de cobrarlo de nuevo.']);
            exit;
        }
        if ($idMedio <= 0) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'El pedido no está pagado: elegí con qué medio lo cobrás.']);
            exit;
        }
        $stmt = $conn->prepare("SELECT medioPago FROM medios_pago WHERE idMedios_pago = ? AND estado = 1");
        $stmt->bind_param("i", $idMedio);
        $stmt->execute();
        $medio = $stmt->get_result()->fetch_assoc();
        if (!$medio || $medio['medioPago'] === MEDIO_PAGO_MERCADOPAGO) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Elegí un medio de pago del mostrador (efectivo, transferencia o QR).']);
            exit;
        }
        registrarPagoPedido($conn, $pedido, $pedido['saldo'], $idMedio);
        $cobrado = ['monto' => $pedido['saldo'], 'medioPago' => $medio['medioPago']];
    }

    $stmt = $conn->prepare("UPDATE pedidos SET estado = 'entregado', fechaCierre = NOW(), usuarios_idCierre = ?
                            WHERE idPedido = ?");
    $stmt->bind_param("ii", $sesion['idUsuarios'], $idPedido);
    $stmt->execute();

    $conn->commit();
    $enTransaccion = false;

    $mensaje = "Pedido #{$idPedido} entregado.";
    if ($cobrado !== null) {
        $mensaje .= ' Cobro registrado: $' . number_format($cobrado['monto'], 2, ',', '.') . ' (' . $cobrado['medioPago'] . ').';
    }
    echo json_encode(['success' => true, 'message' => $mensaje, 'data' => ['cobrado' => $cobrado]]);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('entregar_pedido: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al entregar el pedido']);
}
?>
