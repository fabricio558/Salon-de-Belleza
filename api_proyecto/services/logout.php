<?php
// Cierra la sesión: revoca el token que manda la app en X-Session-Token.
// POST index.php?action=logout
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $token = leerTokenSesion();
    if ($token !== '') {
        revocarSesion($conn, $token);
    }
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada.']);
} catch (mysqli_sql_exception $e) {
    error_log('logout: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cerrar la sesión']);
}
?>
