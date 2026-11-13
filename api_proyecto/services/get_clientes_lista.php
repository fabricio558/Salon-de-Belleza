<?php
// Clientes activos que pueden tener citas, para que el recepcionista elija a quién
// agendarle una. Solo para recepcionistas. No devuelve contraseñas.
// GET index.php?action=get_clientes_lista&idSolicitante=<idUsuarios del recepcionista>
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/permisos.php';

$idSolicitante = isset($_GET['idSolicitante']) ? (int)$_GET['idSolicitante'] : 0;

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if (!esRecepcionista($conn, $idSolicitante)) {
        responderSinPermiso('Solo un recepcionista puede ver la lista de clientes.');
    }

    // INNER JOIN clientes: sin esa fila el usuario no puede tener citas (FK citas.clientes).
    $sql = "SELECT u.idUsuarios AS idClientes, u.nombres, u.apellido, u.correo
            FROM usuarios u
            INNER JOIN clientes c ON c.idClientes = u.idUsuarios
            WHERE u.idRol = 1 AND u.estado = 1
            ORDER BY u.apellido, u.nombres";
    $result = $conn->query($sql);

    $clientes = [];
    while ($row = $result->fetch_assoc()) {
        $row['idClientes'] = (int)$row['idClientes'];
        $clientes[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $clientes]);
} catch (mysqli_sql_exception $e) {
    error_log('get_clientes_lista: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar los clientes']);
}
?>
