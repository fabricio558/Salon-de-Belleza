<?php
// Cambio de contraseña verificando la actual en el servidor, para no tener que
// mandarle la contraseña guardada a la app. Sirve para cualquier rol.
// El usuario sale de la sesión (header X-Session-Token), no del body.
// POST index.php?action=update_contrasena
// Body: { contrasenaActual, nuevaContrasena }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$contrasenaActual = $input['contrasenaActual'] ?? '';
$nuevaContrasena  = $input['nuevaContrasena'] ?? '';

if ($contrasenaActual === '' || $nuevaContrasena === '') {
    echo json_encode(['success' => false, 'message' => 'Por favor completá ambos campos de contraseña.']);
    exit;
}
if (mb_strlen($nuevaContrasena) < 6) {
    echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres.']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn);
    $id = $sesion['idUsuarios'];

    $stmt = $conn->prepare("SELECT contrasena FROM usuarios WHERE idUsuarios = ? AND estado = 1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();

    if (!$usuario || !verificarContrasena($conn, $id, $usuario['contrasena'], $contrasenaActual)) {
        echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta.']);
        exit;
    }

    guardarContrasena($conn, $id, $nuevaContrasena);

    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
} catch (mysqli_sql_exception $e) {
    error_log('update_contrasena: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cambiar la contraseña']);
}
?>
