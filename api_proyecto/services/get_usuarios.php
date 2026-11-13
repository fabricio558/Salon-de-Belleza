<?php
// Lista de todos los usuarios con su rol, para que el recepcionista gestione roles.
// GET index.php?action=get_usuarios&idSolicitante=<idUsuarios del recepcionista>
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/permisos.php';

$idSolicitante = isset($_GET['idSolicitante']) ? (int)$_GET['idSolicitante'] : 0;

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if (!esRecepcionista($conn, $idSolicitante)) {
        responderSinPermiso();
    }

    // Nunca devolver la contraseña.
    $sql = "SELECT u.idUsuarios, u.nombres, u.apellido, u.correo, u.idRol, r.nombreRol, u.estado
            FROM usuarios u
            INNER JOIN roles r ON r.idRol = u.idRol
            ORDER BY u.apellido, u.nombres";
    $result = $conn->query($sql);

    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $row['idUsuarios'] = (int)$row['idUsuarios'];
        $row['idRol'] = (int)$row['idRol'];
        $row['estado'] = (int)$row['estado'];
        $usuarios[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $usuarios]);
} catch (mysqli_sql_exception $e) {
    error_log('get_usuarios: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar los usuarios']);
}
?>
