<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php'; 
global $conn;

$id_clientes = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id_clientes <= 0) {
    echo json_encode([
        'success' => false, 
        'message' => 'ID de cliente inválido o no proporcionado'
    ]);
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
?>