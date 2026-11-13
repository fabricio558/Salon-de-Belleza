<?php
// Citas de un día (por defecto hoy) de todos los estilistas. Lo usa el recepcionista.
// GET index.php?action=get_citas_dia[&fecha=AAAA-MM-DD]
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/consulta_citas.php';

$fecha = null;
if (isset($_GET['fecha'])) {
    $fecha = validarFecha($_GET['fecha']);
    if ($fecha === null) {
        echo json_encode(['success' => false, 'message' => 'Fecha inválida. Usá el formato AAAA-MM-DD.']);
        exit;
    }
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if ($fecha === null) {
        $fecha = fechaHoy($conn);
    }

    $citas = obtenerCitasEntre($conn, $fecha, $fecha);

    echo json_encode(['success' => true, 'fecha' => $fecha, 'data' => $citas]);
} catch (mysqli_sql_exception $e) {
    error_log('get_citas_dia: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar las citas del día']);
}
?>
