<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

$sql = "SELECT u.idUsuarios, u.nombres, u.apellido, u.nombreUsuario, u.fechaNacimiento, u.correo, u.contrasena, e.porcentajeComision, e.horaEntrada, e.horaSalida 
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
?>