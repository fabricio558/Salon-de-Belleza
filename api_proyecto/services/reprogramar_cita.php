<?php
// El cliente cambia la fecha y hora de una cita propia que esté activa y con la
// anticipación mínima. Se mantienen el estilista y los servicios. No se permite
// si el nuevo horario se superpone con otra cita del mismo estilista.
// POST index.php?action=reprogramar_cita
// Body: { idClientes, idCitas, fechaHora: 'AAAA-MM-DD HH:MM:SS' }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/citas_cambios.php';

$input = leerJsonBody();
$idClientes = (int)($input['idClientes'] ?? 0);
$idCitas    = (int)($input['idCitas'] ?? 0);
$fechaHora  = trim($input['fechaHora'] ?? '');

if ($idClientes <= 0 || $idCitas <= 0 || $fechaHora === '') {
    echo json_encode(['success' => false, 'message' => 'Faltan datos de la cita.']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $errorFecha = validarNuevaFechaHora($conn, $fechaHora);
    if ($errorFecha !== null) {
        responderCambio($conn, false, ['success' => false, 'message' => $errorFecha]);
    }

    $conn->begin_transaction();
    $enTransaccion = true;

    $cita = obtenerCitaModificablePorCliente($conn, $idClientes, $idCitas);
    if (!$cita) {
        responderCambio($conn, true, ['success' => false, 'message' => motivoNoModificable($conn, $idCitas, $idClientes)]);
    }
    if ($cita['fechaHora'] === $fechaHora) {
        responderCambio($conn, true, ['success' => false, 'message' => 'La cita ya está en esa fecha y hora.']);
    }

    $errorMover = moverCita($conn, $idCitas, (int)$cita['estilistas'], $fechaHora);
    if ($errorMover !== null) {
        responderCambio($conn, true, ['success' => false, 'message' => $errorMover]);
    }

    registrarCambioCita($conn, $idCitas, 'reprogramacion', $cita['fechaHora'], $fechaHora, null, $idClientes);

    responderCambio($conn, true, ['success' => true, 'message' => 'La cita fue reprogramada.']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('reprogramar_cita: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al reprogramar la cita']);
}
?>
