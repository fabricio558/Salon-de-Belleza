<?php
// Estado del cobro de un pedido: total, pagado, saldo y el último intento con Mercado Pago.
// GET index.php?action=get_estado_pago_pedido&idPedido=<id>
// Requiere sesión: el cliente solo sus pedidos; el recepcionista cualquiera.
//
// Respaldo del webhook (como get_estado_pago_cita): si el último intento con MP sigue sin
// resolverse, consulta a MP por external_reference y aplica el estado.
// Responde el mismo formato que get_estado_pago_cita, con idPedido en lugar de idCitas.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/mercadopago.php';

$idPedido = isset($_GET['idPedido']) ? (int)$_GET['idPedido'] : 0;
if ($idPedido <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta el pedido.']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH, ROL_RECEPCIONISTA_AUTH]);

    $pedido = totalesPedido($conn, $idPedido);
    if (!$pedido || ($sesion['idRol'] === ROL_CLIENTE_AUTH && $pedido['idClientes'] !== $sesion['idUsuarios'])) {
        echo json_encode(['success' => false, 'message' => 'El pedido no existe.']);
        exit;
    }

    $ultimo = ultimoPagoMpPedido($conn, $idPedido);
    if ($ultimo && in_array($ultimo['estado'], ['creada', 'pending', 'in_process', 'authorized'], true)
        && $ultimo['externalReference'] !== null) {
        try {
            $pago = mpBuscarPagoPorReferencia($ultimo['externalReference']);
            if ($pago !== null) {
                aplicarEstadoPago($conn, $pago);
                $pedido = totalesPedido($conn, $idPedido);
                $ultimo = ultimoPagoMpPedido($conn, $idPedido);
            }
        } catch (RuntimeException $e) {
            // Sin conexión con MP: se informa lo que hay en la base.
            error_log('get_estado_pago_pedido: ' . $e->getMessage());
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'idPedido' => $pedido['idPedido'],
            'total'    => $pedido['total'],
            'pagado'   => $pedido['pagado'],
            'saldo'    => $pedido['saldo'],
            'pagada'   => $pedido['idPagos'] !== null,
            'ultimoPagoMp' => $ultimo ? [
                'idPagoMp'     => $ultimo['idPagoMp'],
                'estado'       => $ultimo['estado'],
                'statusDetail' => $ultimo['statusDetail'],
                'monto'        => $ultimo['monto'],
                'fecha'        => $ultimo['fecha'],
                'hora'         => $ultimo['hora'],
            ] : null,
        ],
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('get_estado_pago_pedido: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al consultar el pago']);
}
?>
