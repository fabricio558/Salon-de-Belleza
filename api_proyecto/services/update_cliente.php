<?php
// El cliente actualiza sus datos y notas. La contraseña se cambia con update_contrasena.
// POST index.php?action=update_cliente
// Body: { nombres, apellido, correo, fechaNacimiento?, notaAlergias?, notaPreferencias? }
// El cliente sale de la sesión (header X-Session-Token), no del body.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$nombres          = trim($input['nombres'] ?? '');
$apellido         = trim($input['apellido'] ?? '');
$correo           = strtolower(trim($input['correo'] ?? ''));
$fechaNacimiento  = trim($input['fechaNacimiento'] ?? '');
$notaAlergias     = trim($input['notaAlergias'] ?? '');
$notaPreferencias = trim($input['notaPreferencias'] ?? '');

if ($nombres === '' || $apellido === '' || $correo === '') {
    echo json_encode(['success' => false, 'message' => 'Nombre, apellido y correo son obligatorios.']);
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
$fechaNacimiento = $fechaNacimiento === '' ? null : $fechaNacimiento;

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH]);
    $idClientes = $sesion['idUsuarios'];

    $stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE LOWER(correo) = ? AND idUsuarios <> ?");
    $stmt->bind_param("si", $correo, $idClientes);
    $stmt->execute();
    if ($stmt->get_result()->fetch_row()) {
        echo json_encode(['success' => false, 'message' => 'Ese correo ya lo usa otra cuenta.']);
        exit;
    }

    $conn->begin_transaction();
    $enTransaccion = true;

    $stmtU = $conn->prepare("UPDATE usuarios SET nombres = ?, apellido = ?, correo = ?, fechaNacimiento = ? WHERE idUsuarios = ?");
    $stmtU->bind_param("ssssi", $nombres, $apellido, $correo, $fechaNacimiento, $idClientes);
    $stmtU->execute();

    $stmtC = $conn->prepare("UPDATE clientes SET notaAlergias = ?, notaPreferencias = ? WHERE idClientes = ?");
    $stmtC->bind_param("ssi", $notaAlergias, $notaPreferencias, $idClientes);
    $stmtC->execute();

    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('update_cliente: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al actualizar el perfil']);
}
?>
