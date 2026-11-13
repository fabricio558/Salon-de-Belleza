<?php
// Datos del perfil del recepcionista (sin la contraseña).
// GET index.php?action=get_perfil_recepcionista&id=<idUsuarios>
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/permisos.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if (!esRecepcionista($conn, $id)) {
        responderSinPermiso('Este perfil es solo para recepcionistas.');
    }

    // LEFT JOIN: la fila en `recepcionista` puede no existir todavía.
    $sql = "SELECT u.idUsuarios, u.nombres, u.apellido, u.correo, u.fechaNacimiento, r.fechaContratacion
            FROM usuarios u
            LEFT JOIN recepcionista r ON r.idUsuarios = u.idUsuarios
            WHERE u.idUsuarios = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $perfil = $stmt->get_result()->fetch_assoc();

    echo json_encode(['success' => true, 'data' => $perfil]);
} catch (mysqli_sql_exception $e) {
    error_log('get_perfil_recepcionista: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar el perfil']);
}
?>
