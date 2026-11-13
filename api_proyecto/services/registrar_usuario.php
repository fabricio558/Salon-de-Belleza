<?php
// Alta de un usuario nuevo. Siempre se crea con rol cliente (idRol = 1).
// POST index.php?action=registrar_usuario
// Body: { nombres, apellido, correo, contrasena, fechaNacimiento? (AAAA-MM-DD) }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

const ROL_CLIENTE = 1;
const ESTADO_ACTIVO = 1;

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$nombres         = trim($input['nombres'] ?? '');
$apellido        = trim($input['apellido'] ?? '');
$correo          = strtolower(trim($input['correo'] ?? ''));
$contrasena      = $input['contrasena'] ?? '';
$fechaNacimiento = trim($input['fechaNacimiento'] ?? '');

if ($nombres === '' || $apellido === '' || $correo === '' || $contrasena === '') {
    echo json_encode(['success' => false, 'message' => 'Completá nombre, apellido, correo y contraseña.']);
    exit;
}
// Límites de las columnas varchar(45) de usuarios.
if (mb_strlen($nombres) > 45 || mb_strlen($apellido) > 45 || mb_strlen($correo) > 45) {
    echo json_encode(['success' => false, 'message' => 'Nombre, apellido y correo pueden tener hasta 45 caracteres.']);
    exit;
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'El correo no es válido.']);
    exit;
}
if (mb_strlen($contrasena) < 6) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
    exit;
}
if ($fechaNacimiento === '') {
    $fechaNacimiento = null;
} else {
    $dt = DateTime::createFromFormat('Y-m-d', $fechaNacimiento);
    if (!$dt || $dt->format('Y-m-d') !== $fechaNacimiento) {
        echo json_encode(['success' => false, 'message' => 'Fecha de nacimiento inválida.']);
        exit;
    }
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    if ($stmt->get_result()->fetch_row()) {
        echo json_encode(['success' => false, 'message' => 'Ya existe una cuenta con ese correo.']);
        exit;
    }

    $conn->begin_transaction();

    // TODO: la contraseña se guarda en texto plano como en el resto del sistema
    // (ver "Deuda técnica conocida" en CLAUDE.md).
    $sql = "INSERT INTO usuarios (nombres, apellido, correo, contrasena, fechaNacimiento, fechaCreacion, estado, idRol)
            VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)";
    $stmt = $conn->prepare($sql);
    $estado = ESTADO_ACTIVO;
    $rol = ROL_CLIENTE;
    $stmt->bind_param("sssssii", $nombres, $apellido, $correo, $contrasena, $fechaNacimiento, $estado, $rol);
    $stmt->execute();
    $idUsuario = $conn->insert_id;

    // Fila de subtipo: sin ella el usuario no puede tener citas (FK citas.clientes).
    $stmt = $conn->prepare("INSERT INTO clientes (idClientes) VALUES (?)");
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Cuenta creada con éxito. Ya podés iniciar sesión.',
        'idUsuarios' => $idUsuario,
    ]);
} catch (mysqli_sql_exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    error_log('registrar_usuario: ' . $e->getMessage());
    // 1062 = clave duplicada (dos registros simultáneos con el mismo correo).
    if ($e->getCode() === 1062) {
        echo json_encode(['success' => false, 'message' => 'Ya existe una cuenta con ese correo.']);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al crear la cuenta']);
}
?>
