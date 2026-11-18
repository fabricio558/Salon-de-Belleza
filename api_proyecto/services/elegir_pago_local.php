<?php
// El cliente elige pagar una cita o un pedido en el local, y con qué medio (Efectivo o
// Transferencia). Es un aviso para el salón: no registra ningún cobro.
// POST index.php?action=elegir_pago_local
// Body: { tipo: 'cita'|'pedido', id, idMedios_pago }   (idMedios_pago null = quitar la elección)
// Requiere sesión de cliente: solo sus citas (no canceladas) y pedidos (pendientes), con saldo.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/pagos_citas.php';
require_once __DIR__ . '/pagos_pedidos.php';
require_once __DIR__ . '/pedidos.php';

$input = leerJsonBody();
$tipo = $input['tipo'] ?? '';
$id = (int)($input['id'] ?? 0);
$idMedio = isset($input['idMedios_pago']) ? (int)$input['idMedios_pago'] : null;

if (!in_array($tipo, ['cita', 'pedido'], true) || $id <= 0 || ($idMedio !== null && $idMedio <= 0)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos para elegir el medio de pago.']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH]);

    $medio = null;
    if ($idMedio !== null) {
        foreach (mediosPagoLocal($conn) as $m) {
            if ($m['idMedios_pago'] === $idMedio) {
                $medio = $m;
            }
        }
        if ($medio === null) {
            echo json_encode(['success' => false, 'message' => 'En el local se puede pagar con ' . implode(' o ', MEDIOS_PAGO_LOCAL) . '.']);
            exit;
        }
    }

    if ($tipo === 'pedido') {
        vencerPedidos($conn, $sesion['idUsuarios']);
    }

    $conn->begin_transaction();
    $enTransaccion = true;

    if ($tipo === 'cita') {
        $item = totalesCita($conn, $id, true);
        $noExiste = !$item || $item['idClientes'] !== $sesion['idUsuarios'];
        $motivo = !$noExiste && $item['idEstado'] === ESTADO_CITA_CANCELADA ? 'La cita está cancelada.' : null;
        $enProceso = "SELECT 1 FROM pagos_mp WHERE citas_idCitas = ? AND estado IN ('pending', 'in_process', 'authorized')";
        $actualizar = "UPDATE citas SET medioPagoLocal = ? WHERE idCitas = ?";
        $nombre = 'la cita';
    } else {
        $item = totalesPedido($conn, $id, true);
        $noExiste = !$item || $item['idClientes'] !== $sesion['idUsuarios'];
        $motivo = !$noExiste && $item['estado'] !== 'pendiente'
            ? ($item['estado'] === 'entregado' ? 'El pedido ya fue entregado.' : 'El pedido está cancelado.')
            : null;
        $enProceso = "SELECT 1 FROM pagos_mp WHERE pedidos_idPedido = ? AND estado IN ('pending', 'in_process', 'authorized')";
        $actualizar = "UPDATE pedidos SET medioPagoLocal = ? WHERE idPedido = ?";
        $nombre = 'el pedido';
    }

    if ($noExiste) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $tipo === 'cita' ? 'La cita no existe.' : 'El pedido no existe.']);
        exit;
    }
    if ($motivo !== null) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $motivo]);
        exit;
    }
    if ($idMedio !== null && $item['saldo'] <= 0) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'No hay nada para pagar en ' . $nombre . '.']);
        exit;
    }
    if ($idMedio !== null) {
        $stmt = $conn->prepare($enProceso);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        if ($stmt->get_result()->fetch_row()) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Tenés un pago de ' . $nombre . ' en proceso con Mercado Pago. Esperá a que se confirme.']);
            exit;
        }
    }

    $stmt = $conn->prepare($actualizar);
    $stmt->bind_param("ii", $idMedio, $id);
    $stmt->execute();

    $conn->commit();
    $enTransaccion = false;

    echo json_encode([
        'success' => true,
        'message' => $medio !== null
            ? 'Listo: vas a pagar ' . $nombre . ' en el local con ' . $medio['medioPago'] . '.'
            : 'Listo: ya no figura para pagar en el local.',
        'data' => $medio,
    ]);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('elegir_pago_local: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al guardar el medio de pago']);
}
?>
