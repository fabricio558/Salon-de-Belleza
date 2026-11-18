<?php
// Datos del perfil de un estilista (sin la contraseña).
// GET index.php?action=get_estilista&id=<idEstilistas>
// Requiere sesión: el estilista solo puede ver su perfil; el recepcionista, cualquiera.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn, [ROL_ESTILISTA_AUTH, ROL_RECEPCIONISTA_AUTH]);
    if ($sesion['idRol'] === ROL_ESTILISTA_AUTH && $sesion['idUsuarios'] !== $id) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Solo podés ver tu propio perfil.']);
        exit;
    }

    $sql = "SELECT u.idUsuarios, u.nombres, u.apellido, u.nombreUsuario, u.fechaNacimiento, u.correo,
                   e.porcentajeComision, e.horaEntrada, e.horaSalida
            FROM usuarios u
            INNER JOIN estilistas e ON u.idUsuarios = e.idEstilistas
            WHERE u.idUsuarios = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($row = $resultado->fetch_assoc()) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Estilista no encontrado']);
    }
} catch (mysqli_sql_exception $e) {
    error_log('get_estilista: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar el perfil']);
}
?>
