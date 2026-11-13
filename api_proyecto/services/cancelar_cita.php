<?php
// El cliente cancela una cita propia que esté activa y con la anticipación mínima.
// POST index.php?action=cancelar_cita
// Body: { idClientes, idCitas }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/citas_cambios.php';

$input = leerJsonBody();
$idClientes = (int)($input['idClientes'] ?? 0);
$idCitas    = (int)($input['idCitas'] ?? 0);

if ($idClientes <= 0 || $idCitas <= 0) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos de la cita.']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $conn->begin_transaction();
    $enTransaccion = true;

    $cita = obtenerCitaModificablePorCliente($conn, $idClientes, $idCitas);
    if (!$cita) {
        responderCambio($conn, true, ['success' => false, 'message' => motivoNoModificable($conn, $idCitas, $idClientes)]);
    }

    cancelarCitaPorId($conn, $idCitas);
    registrarCambioCita($conn, $idCitas, 'cancelacion', $cita['fechaHora'], null, null, $idClientes);

    responderCambio($conn, true, ['success' => true, 'message' => 'La cita fue cancelada.']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('cancelar_cita: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cancelar la cita']);
}
?>
