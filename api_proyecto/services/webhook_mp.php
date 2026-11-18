<?php
// Webhook de Mercado Pago (notificaciones de pagos). Lo llama MP, no la app: no usa sesión.
// POST index.php?action=webhook_mp&data.id=<id>&type=payment
//
// 1. Guarda la notificación en mp_notificaciones.
// 2. Valida la firma x-signature con la clave secreta del webhook. Si no es válida: 401.
// 3. Solo procesa type=payment. Nunca confía en el body: consulta el pago en /v1/payments/<id>
//    y aplica ese estado (aplicarEstadoPago, idempotente).
// Responde 200 rápido. Si falla la base o la API de MP responde 500, para que MP reintente.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/mercadopago.php';

$cuerpo = file_get_contents('php://input');
$json = json_decode($cuerpo, true);
$json = is_array($json) ? $json : [];

// PHP convierte el parámetro "data.id" de la query en "data_id".
$dataId = (string)($_GET['data_id'] ?? ($json['data']['id'] ?? ''));
$tipo = (string)($_GET['type'] ?? ($json['type'] ?? ($_GET['topic'] ?? '')));
$xSignature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
$xRequestId = $_SERVER['HTTP_X_REQUEST_ID'] ?? '';

$idNotificacion = null;

function cerrarNotificacion($conn, $idNotificacion, $procesada, $error = null) {
    if ($idNotificacion === null) {
        return;
    }
    $error = $error !== null ? substr($error, 0, 255) : null;
    $proc = $procesada ? 1 : 0;
    $stmt = $conn->prepare("UPDATE mp_notificaciones SET procesada = ?, error = ? WHERE idNotificacion = ?");
    $stmt->bind_param("isi", $proc, $error, $idNotificacion);
    $stmt->execute();
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $config = mpConfig();
    $firmaValida = mpFirmaValida($xSignature, $xRequestId, $dataId, $config['webhook_secret']);

    $firma = $firmaValida ? 1 : 0;
    $tipoLog = substr($tipo, 0, 50);
    $dataLog = substr($dataId, 0, 64);
    $requestLog = substr($xRequestId, 0, 100);
    $cuerpoLog = substr($cuerpo, 0, 60000);
    $stmt = $conn->prepare("INSERT INTO mp_notificaciones (tipo, dataId, requestId, firmaValida, cuerpo) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssis", $tipoLog, $dataLog, $requestLog, $firma, $cuerpoLog);
    $stmt->execute();
    $idNotificacion = (int)$conn->insert_id;

    if (!$firmaValida) {
        cerrarNotificacion($conn, $idNotificacion, false, 'firma inválida');
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Firma inválida']);
        exit;
    }

    if ($tipo !== 'payment' || $dataId === '') {
        cerrarNotificacion($conn, $idNotificacion, true, 'ignorada (tipo ' . $tipo . ')');
        echo json_encode(['success' => true]);
        exit;
    }

    $pago = mpObtenerPago($dataId);
    if ($pago === null) {
        // Por ejemplo, la notificación de prueba del panel ("Simular") con un id que no existe.
        cerrarNotificacion($conn, $idNotificacion, true, 'el pago no existe en MP');
        echo json_encode(['success' => true]);
        exit;
    }

    $estado = aplicarEstadoPago($conn, $pago);
    cerrarNotificacion($conn, $idNotificacion, true, $estado === null ? 'external_reference desconocida' : null);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    error_log('webhook_mp: ' . $e->getMessage());
    if (isset($conn) && $idNotificacion !== null) {
        try {
            cerrarNotificacion($conn, $idNotificacion, false, $e->getMessage());
        } catch (Throwable $ignorado) {
        }
    }
    http_response_code(500);
    echo json_encode(['success' => false]);
}
?>
