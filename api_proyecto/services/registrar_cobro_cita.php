<?php
// El recepcionista cobra en el mostrador el saldo de una cita (efectivo, transferencia, QR...).
// Para cobrar con Mercado Pago se usa crear_preferencia_cita (genera el link de pago).
// POST index.php?action=registrar_cobro_cita
// Body: { idCitas, idMedios_pago }
// Requiere sesión de recepcionista. Siempre cobra el saldo completo, calculado en el servidor.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/pagos_citas.php';
require_once __DIR__ . '/comun.php';

$input = leerJsonBody();
$idCitas = (int)($input['idCitas'] ?? 0);
$idMedio = (int)($input['idMedios_pago'] ?? 0);

if ($idCitas <= 0 || $idMedio <= 0) {
    echo json_encode(['success' => false, 'message' => 'Elegí la cita y el medio de pago.']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    requerirSesion($conn, [ROL_RECEPCIONISTA_AUTH]);

    $stmt = $conn->prepare("SELECT medioPago FROM medios_pago WHERE idMedios_pago = ? AND estado = 1");
    $stmt->bind_param("i", $idMedio);
    $stmt->execute();
    $medio = $stmt->get_result()->fetch_assoc();
    if (!$medio) {
        echo json_encode(['success' => false, 'message' => 'El medio de pago no existe o no está activo.']);
        exit;
    }
    if ($medio['medioPago'] === MEDIO_PAGO_MERCADOPAGO) {
        echo json_encode(['success' => false, 'message' => 'Para cobrar con Mercado Pago generá el link de pago.']);
        exit;
    }

    $conn->begin_transaction();
    $enTransaccion = true;

    $cita = totalesCita($conn, $idCitas, true);
    if (!$cita) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'La cita no existe.']);
        exit;
    }
    if ($cita['idEstado'] === ESTADO_CITA_CANCELADA) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'La cita está cancelada.']);
        exit;
    }
    if ($cita['saldo'] <= 0) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $cita['total'] > 0 ? 'La cita ya está pagada.' : 'La cita no tiene servicios para cobrar.']);
        exit;
    }

    $idPagos = registrarPagoCita($conn, $cita, $cita['saldo'], $idMedio);
    $conn->commit();
    $enTransaccion = false;

    echo json_encode([
        'success' => true,
        'message' => 'Cobro registrado: $' . number_format($cita['saldo'], 2, ',', '.') . ' (' . $medio['medioPago'] . ').',
        'data' => ['idPagos' => $idPagos, 'monto' => $cita['saldo']],
    ]);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('registrar_cobro_cita: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al registrar el cobro']);
}
?>
