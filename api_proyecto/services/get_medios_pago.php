<?php
// Medios de pago activos, para el cobro en el mostrador.
// GET index.php?action=get_medios_pago
// Requiere sesión de recepcionista.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/pagos_citas.php';

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    requerirSesion($conn, [ROL_RECEPCIONISTA_AUTH]);

    $result = $conn->query("SELECT idMedios_pago, medioPago FROM medios_pago WHERE estado = 1 ORDER BY idMedios_pago");
    $medios = [];
    while ($row = $result->fetch_assoc()) {
        $medios[] = [
            'idMedios_pago' => (int)$row['idMedios_pago'],
            'medioPago'     => $row['medioPago'],
            'esMercadoPago' => $row['medioPago'] === MEDIO_PAGO_MERCADOPAGO,
        ];
    }

    echo json_encode(['success' => true, 'data' => $medios]);
} catch (mysqli_sql_exception $e) {
    error_log('get_medios_pago: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar los medios de pago']);
}
?>
