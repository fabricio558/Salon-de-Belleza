<?php
// Cambio de contraseña verificando la actual en el servidor, para no tener que
// mandarle la contraseña guardada a la app. Sirve para cualquier rol.
// POST index.php?action=update_contrasena
// Body: { idUsuarios, contrasenaActual, nuevaContrasena }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$id               = (int)($input['idUsuarios'] ?? 0);
$contrasenaActual = $input['contrasenaActual'] ?? '';
$nuevaContrasena  = $input['nuevaContrasena'] ?? '';

if ($id <= 0 || $contrasenaActual === '' || $nuevaContrasena === '') {
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

    $stmt = $conn->prepare("SELECT contrasena FROM usuarios WHERE idUsuarios = ? AND estado = 1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();

    // TODO: texto plano como el resto del sistema (ver "Deuda técnica conocida" en CLAUDE.md).
    if (!$usuario || !hash_equals((string)$usuario['contrasena'], $contrasenaActual)) {
        echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta.']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE usuarios SET contrasena = ? WHERE idUsuarios = ?");
    $stmt->bind_param("si", $nuevaContrasena, $id);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
} catch (mysqli_sql_exception $e) {
    error_log('update_contrasena: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cambiar la contraseña']);
}
?>
