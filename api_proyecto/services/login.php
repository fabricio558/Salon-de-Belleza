<?php
// Inicio de sesión. Devuelve los datos del usuario y un token de sesión que la app
// manda después en el header X-Session-Token (ver auth.php).
// POST index.php?action=login
// Body: { correo, contrasena }
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$correo = strtolower(trim($input['correo'] ?? ''));
$contrasena = $input['contrasena'] ?? '';

if ($correo === '' || $contrasena === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Por favor complete todos los campos.'
    ]);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $stmt = $conn->prepare("SELECT idUsuarios, nombres, apellido, idRol, contrasena
                            FROM usuarios WHERE LOWER(correo) = ? AND estado = 1");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row || !verificarContrasena($conn, (int)$row['idUsuarios'], $row['contrasena'], $contrasena)) {
        echo json_encode([
            'success' => false,
            'message' => 'Correo o contraseña incorrectos.'
        ]);
        exit;
    }

    $idUsuario = (int)$row['idUsuarios'];
    $idRol = (int)$row['idRol'];
    $token = crearSesion($conn, $idUsuario);

    echo json_encode([
        'success' => true,
        'message' => 'Inicio de Sesión completado con éxito',
        'data' => [
            'idUsuarios'   => $idUsuario,
            // Solo los estilistas tienen idEstilistas (es el mismo número que idUsuarios).
            'idEstilistas' => $idRol === ROL_ESTILISTA_AUTH ? $idUsuario : null,
            'nombres'      => $row['nombres'],
            'apellido'     => $row['apellido'],
            'idRol'        => $idRol,
            'token'        => $token,
        ]
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('login: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al iniciar sesión']);
}
?>
