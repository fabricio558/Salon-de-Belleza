<?php
// Citas de la semana (lunes a domingo) que contiene la fecha indicada (por defecto hoy),
// de todos los estilistas. Lo usa el recepcionista.
// GET index.php?action=get_citas_semana[&fecha=AAAA-MM-DD]
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

    // Aritmética de fechas sin hora: no depende de la zona horaria de PHP.
    $lunes = new DateTime($fecha);
    $lunes->modify('-' . ((int)$lunes->format('N') - 1) . ' days');
    $domingo = (clone $lunes)->modify('+6 days');

    $desde = $lunes->format('Y-m-d');
    $hasta = $domingo->format('Y-m-d');
    $citas = obtenerCitasEntre($conn, $desde, $hasta);

    echo json_encode([
        'success' => true,
        'hoy' => fechaHoy($conn),
        'desde' => $desde,
        'hasta' => $hasta,
        'data' => $citas,
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('get_citas_semana: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar las citas de la semana']);
}
?>
