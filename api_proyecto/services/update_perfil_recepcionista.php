<?php
// Actualiza los datos personales del recepcionista. No toca la contraseña
// (eso lo hace update_contrasena) ni el rol.
// POST index.php?action=update_perfil_recepcionista
// Body: { idUsuarios, nombres, apellido, correo, fechaNacimiento? (AAAA-MM-DD) }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/permisos.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$id              = (int)($input['idUsuarios'] ?? 0);
$nombres         = trim($input['nombres'] ?? '');
$apellido        = trim($input['apellido'] ?? '');
$correo          = strtolower(trim($input['correo'] ?? ''));
$fechaNacimiento = trim($input['fechaNacimiento'] ?? '');

if ($nombres === '' || $apellido === '' || $correo === '') {
    echo json_encode(['success' => false, 'message' => 'Los campos de nombre, apellido y correo son obligatorios.']);
    exit;
}
if (mb_strlen($nombres) > 45 || mb_strlen($apellido) > 45 || mb_strlen($correo) > 45) {
    echo json_encode(['success' => false, 'message' => 'Nombre, apellido y correo pueden tener hasta 45 caracteres.']);
    exit;
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'El correo no es válido.']);
    exit;
}
if ($fechaNacimiento === '') {
    $fechaNacimiento = null;
} else {
    $dt = DateTime::createFromFormat('Y-m-d', $fechaNacimiento);
    if (!$dt || $dt->format('Y-m-d') !== $fechaNacimiento) {
        echo json_encode(['success' => false, 'message' => 'Fecha de nacimiento inválida. Usá el formato AAAA-MM-DD.']);
        exit;
    }
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if (!esRecepcionista($conn, $id)) {
        responderSinPermiso('Este perfil es solo para recepcionistas.');
    }

    $stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE correo = ? AND idUsuarios <> ?");
    $stmt->bind_param("si", $correo, $id);
    $stmt->execute();
    if ($stmt->get_result()->fetch_row()) {
        echo json_encode(['success' => false, 'message' => 'Ese correo ya lo usa otra cuenta.']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE usuarios SET nombres = ?, apellido = ?, correo = ?, fechaNacimiento = ? WHERE idUsuarios = ?");
    $stmt->bind_param("ssssi", $nombres, $apellido, $correo, $fechaNacimiento, $id);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Tus datos han sido actualizados correctamente.']);
} catch (mysqli_sql_exception $e) {
    error_log('update_perfil_recepcionista: ' . $e->getMessage());
    if ($e->getCode() === 1062) {
        echo json_encode(['success' => false, 'message' => 'Ese correo ya lo usa otra cuenta.']);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al actualizar el perfil']);
}
?>
