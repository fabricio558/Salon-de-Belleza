<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php'; 
global $conn;

$id_estilista = $_GET['id_estilistas'] ?? null;

if (!$id_estilista) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID del estilista']);
    exit;
}

$sql = "SELECT 
            c.idCitas,
            c.clientes AS idClientes,
            DATE_FORMAT(c.fechaHora, '%d/%m/%Y') AS fecha,
            TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
            u.nombres,
            u.apellido
        FROM citas c
        INNER JOIN clientes cl ON c.clientes = cl.idClientes
        INNER JOIN usuarios u ON cl.idClientes = u.idUsuarios
        WHERE c.estilistas = ?
        ORDER BY c.fechaHora ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_estilista);
$stmt->execute();
$result = $stmt->get_result();

$citas = [];
while ($row = $result->fetch_assoc()) {
    $citas[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $citas
]);
?>