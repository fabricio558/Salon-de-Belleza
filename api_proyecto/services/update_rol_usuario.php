<?php
// Cambia el rol de un usuario (cliente, estilista o recepcionista). Solo para recepcionistas.
// POST index.php?action=update_rol_usuario
// Body: { idSolicitante, idUsuario, idRol }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/permisos.php';

const ROL_GERENTE = 4;

// Roles que puede asignar el recepcionista → tabla de subtipo y su columna id.
const TABLA_SUBTIPO = [
    1 => ['tabla' => 'clientes', 'columna' => 'idClientes'],
    2 => ['tabla' => 'estilistas', 'columna' => 'idEstilistas'],
    3 => ['tabla' => 'recepcionista', 'columna' => 'idUsuarios'],
];

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$idSolicitante = (int)($input['idSolicitante'] ?? 0);
$idUsuario     = (int)($input['idUsuario'] ?? 0);
$idRol         = (int)($input['idRol'] ?? 0);

if ($idUsuario <= 0 || !isset(TABLA_SUBTIPO[$idRol])) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos: el rol tiene que ser cliente, estilista o recepcionista.']);
    exit;
}
if ($idUsuario === $idSolicitante) {
    echo json_encode(['success' => false, 'message' => 'No podés cambiar tu propio rol.']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if (!esRecepcionista($conn, $idSolicitante)) {
        responderSinPermiso();
    }

    $stmt = $conn->prepare("SELECT idRol FROM usuarios WHERE idUsuarios = ?");
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();

    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'El usuario no existe.']);
        exit;
    }
    if ((int)$usuario['idRol'] === ROL_GERENTE) {
        echo json_encode(['success' => false, 'message' => 'El rol de un gerente no se puede modificar desde acá.']);
        exit;
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("UPDATE usuarios SET idRol = ? WHERE idUsuarios = ?");
    $stmt->bind_param("ii", $idRol, $idUsuario);
    $stmt->execute();

    // Crear la fila de subtipo del rol nuevo si no existe (FK de citas, comisiones, etc.).
    // Las filas de roles anteriores se conservan porque las citas viejas las referencian.
    // Tabla y columna salen de la constante TABLA_SUBTIPO, no del input.
    $subtipo = TABLA_SUBTIPO[$idRol];
    $sql = "INSERT INTO {$subtipo['tabla']} ({$subtipo['columna']}) VALUES (?)
            ON DUPLICATE KEY UPDATE {$subtipo['columna']} = {$subtipo['columna']}";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();

    $conn->commit();

    $stmt = $conn->prepare("SELECT nombreRol FROM roles WHERE idRol = ?");
    $stmt->bind_param("i", $idRol);
    $stmt->execute();
    $nombreRol = $stmt->get_result()->fetch_assoc()['nombreRol'];

    echo json_encode([
        'success' => true,
        'message' => "Rol actualizado a {$nombreRol}. El cambio se aplica la próxima vez que el usuario inicie sesión.",
        'idRol' => $idRol,
        'nombreRol' => $nombreRol,
    ]);
} catch (mysqli_sql_exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    error_log('update_rol_usuario: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al actualizar el rol']);
}
?>
