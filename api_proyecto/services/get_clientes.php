<?php
// Datos de un cliente (sin la contraseña).
// GET index.php?action=get_clientes&id=<idClientes>
// Requiere sesión: el cliente solo puede ver sus datos; estilista y recepcionista, cualquiera.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';

$id_clientes = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id_clientes <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'ID de cliente inválido o no proporcionado'
    ]);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn);
    if ($sesion['idRol'] === ROL_CLIENTE_AUTH && $sesion['idUsuarios'] !== $id_clientes) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Solo podés ver tus propios datos.']);
        exit;
    }

    $sql = "SELECT
                u.idUsuarios,
                u.nombres,
                u.apellido,
                u.correo,
                u.fechaNacimiento,
                c.notaAlergias,
                c.notaPreferencias
            FROM clientes c
            INNER JOIN usuarios u ON c.idClientes = u.idUsuarios
            WHERE c.idClientes = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_clientes);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode([
            'success' => true,
            'data' => $row
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Cliente no encontrado en la base de datos'
        ]);
    }
} catch (mysqli_sql_exception $e) {
    error_log('get_clientes: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar el cliente']);
}
?>
