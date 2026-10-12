<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$sql = "SELECT u.idUsuarios AS idEstilistas, u.nombres, u.apellido 
        FROM usuarios u 
        INNER JOIN estilistas e ON u.idUsuarios = e.idEstilistas
        WHERE u.idRol = 2
        ORDER BY u.nombres ASC";
$result = $conn->query($sql);

$estilistas = [];
while ($row = $result->fetch_assoc()) {
    $estilistas[] = $row;
}

echo json_encode(['success' => true, 'data' => $estilistas]);
?>