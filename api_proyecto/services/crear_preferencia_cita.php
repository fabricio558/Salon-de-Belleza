<?php
// Crea una preferencia de Checkout Pro para cobrar el saldo de una cita.
// POST index.php?action=crear_preferencia_cita
// Body: { idCitas, urlRetorno? }   (urlRetorno: exp://... o salonbelleza://..., para volver a la app)
// Requiere sesión: el cliente solo puede pagar sus citas; el recepcionista, cualquiera
// (genera un link para que el cliente pague desde su celular).
// Ítems y monto salen de la base (citas_servicios), nunca de la app.
// Responde { success, data: { idPagoMp, initPoint, monto } }.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/mercadopago.php';
require_once __DIR__ . '/comun.php';

const HORAS_VENCIMIENTO_PREFERENCIA = 24;

$input = leerJsonBody();
$idCitas = (int)($input['idCitas'] ?? 0);
$urlRetorno = $input['urlRetorno'] ?? '';

if ($idCitas <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta la cita a pagar.']);
    exit;
}
if ($urlRetorno !== '' && !urlRetornoAppValida($urlRetorno)) {
    $urlRetorno = '';
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH, ROL_RECEPCIONISTA_AUTH]);
    $config = mpConfig();

    $conn->begin_transaction();
    $enTransaccion = true;

    $cita = totalesCita($conn, $idCitas, true);
    if (!$cita) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'La cita no existe.']);
        exit;
    }
    if ($sesion['idRol'] === ROL_CLIENTE_AUTH && $cita['idClientes'] !== $sesion['idUsuarios']) {
        $conn->rollback();
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Solo podés pagar tus propias citas.']);
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

    // Un pago que MP todavía está procesando: no generar otro para no cobrar dos veces.
    $stmt = $conn->prepare("SELECT 1 FROM pagos_mp WHERE citas_idCitas = ? AND estado IN ('pending', 'in_process', 'authorized')");
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();
    if ($stmt->get_result()->fetch_row()) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Hay un pago de esta cita que Mercado Pago todavía está procesando. Esperá a que se confirme.']);
        exit;
    }

    // Ítems: el detalle de servicios si todavía no se pagó nada; si no, el saldo en un solo ítem.
    $items = [];
    if ($cita['pagado'] <= 0) {
        foreach (serviciosCita($conn, $idCitas) as $linea) {
            $items[] = [
                'id'          => 'servicio-' . $linea['idServicios'],
                'title'       => $linea['servicio'],
                'quantity'    => $linea['cantidad'],
                'unit_price'  => $linea['precioHistorico'],
                'currency_id' => 'ARS',
            ];
        }
    } else {
        $items[] = [
            'id'          => 'saldo-cita-' . $idCitas,
            'title'       => 'Saldo cita #' . $idCitas,
            'quantity'    => 1,
            'unit_price'  => $cita['saldo'],
            'currency_id' => 'ARS',
        ];
    }

    $origen = $sesion['idRol'] === ROL_CLIENTE_AUTH ? 'cliente' : 'recepcion';
    $cobro = mpIniciarCobro($conn, ['tipo' => 'cita', 'id' => $idCitas], $cita['saldo'], $items, $origen,
                            $sesion['idUsuarios'], $urlRetorno, HORAS_VENCIMIENTO_PREFERENCIA * 60);
    $idPagoMp = $cobro['idPagoMp'];
    $initPoint = $cobro['initPoint'];

    $conn->commit();
    $enTransaccion = false;

    echo json_encode([
        'success' => true,
        'data' => [
            'idPagoMp'  => $idPagoMp,
            'initPoint' => $initPoint,
            'monto'     => $cita['saldo'],
        ],
    ]);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('crear_preferencia_cita: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al preparar el pago']);
} catch (RuntimeException $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('crear_preferencia_cita: ' . $e->getMessage());
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'No se pudo iniciar el pago con Mercado Pago. Intentá de nuevo más tarde.']);
}
?>
