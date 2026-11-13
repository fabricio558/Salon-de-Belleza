<?php
// El estilista (solo sus citas) o el recepcionista (cualquiera) cancela una cita activa
// y le deja al cliente un mensaje con el motivo.
// POST index.php?action=cancelar_cita_salon
// Body: { idSolicitante, idCitas, mensaje }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/citas_cambios.php';

$input = leerJsonBody();
$idSolicitante = (int)($input['idSolicitante'] ?? 0);
$idCitas       = (int)($input['idCitas'] ?? 0);
$mensaje       = trim($input['mensaje'] ?? '');

if ($idSolicitante <= 0 || $idCitas <= 0) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos de la cita.']);
    exit;
}
$errorMensaje = validarMensajeCliente($mensaje);
if ($errorMensaje !== null) {
    echo json_encode(['success' => false, 'message' => $errorMensaje]);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $conn->begin_transaction();
    $enTransaccion = true;

    $resultado = obtenerCitaParaPersonal($conn, $idSolicitante, $idCitas);
    if (isset($resultado['error'])) {
        responderCambio($conn, true, ['success' => false, 'message' => $resultado['error']], $resultado['codigo']);
    }

    cancelarCitaPorId($conn, $idCitas);
    registrarCambioCita($conn, $idCitas, 'cancelacion', $resultado['cita']['fechaHora'], null, $mensaje, $idSolicitante);

    responderCambio($conn, true, ['success' => true, 'message' => 'La cita fue cancelada y el cliente va a ver tu mensaje en "Mis Citas".']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('cancelar_cita_salon: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cancelar la cita']);
}
?>
