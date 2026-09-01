<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$sql = "SELECT idServicios, servicio, precio FROM services WHERE estado = 1 OR estado IS NULL ORDER BY servicio ASC";
$result = $conn->query($sql);

$servicios = [];
while ($row = $result->fetch_assoc()) {
    $servicios[] = $row;
}

echo json_encode(['success' => true, 'data' => $servicios]);
?>