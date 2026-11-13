<?php
// El estilista (solo sus citas) o el recepcionista (cualquiera) reprograma una cita activa
// a otro horario libre del mismo estilista y le deja al cliente un mensaje con el motivo.
// Sin anticipación mínima (a diferencia del cliente).
// POST index.php?action=reprogramar_cita_salon
// Body: { idSolicitante, idCitas, fechaHora: 'AAAA-MM-DD HH:MM:SS', mensaje }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/citas_cambios.php';

$input = leerJsonBody();
$idSolicitante = (int)($input['idSolicitante'] ?? 0);
$idCitas       = (int)($input['idCitas'] ?? 0);
$fechaHora     = trim($input['fechaHora'] ?? '');
$mensaje       = trim($input['mensaje'] ?? '');

if ($idSolicitante <= 0 || $idCitas <= 0 || $fechaHora === '') {
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

    $errorFecha = validarNuevaFechaHora($conn, $fechaHora);
    if ($errorFecha !== null) {
        responderCambio($conn, false, ['success' => false, 'message' => $errorFecha]);
    }

    $conn->begin_transaction();
    $enTransaccion = true;

    $resultado = obtenerCitaParaPersonal($conn, $idSolicitante, $idCitas);
    if (isset($resultado['error'])) {
        responderCambio($conn, true, ['success' => false, 'message' => $resultado['error']], $resultado['codigo']);
    }
    $cita = $resultado['cita'];

    if ($cita['fechaHora'] === $fechaHora) {
        responderCambio($conn, true, ['success' => false, 'message' => 'La cita ya está en esa fecha y hora.']);
    }

    $errorMover = moverCita($conn, $idCitas, (int)$cita['estilistas'], $fechaHora);
    if ($errorMover !== null) {
        responderCambio($conn, true, ['success' => false, 'message' => $errorMover]);
    }

    registrarCambioCita($conn, $idCitas, 'reprogramacion', $cita['fechaHora'], $fechaHora, $mensaje, $idSolicitante);

    responderCambio($conn, true, ['success' => true, 'message' => 'La cita fue reprogramada y el cliente va a ver tu mensaje en "Mis Citas".']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('reprogramar_cita_salon: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al reprogramar la cita']);
}
?>
