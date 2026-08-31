<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *"); 
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../db.php'; 

global $conn;

$idEstilistas = $_GET['id_estilistas'] ?? '';

if (empty($idEstilistas)) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID del estilista.']);
    exit;
}

// Consultamos solo las citas de HOY para el estilista especificado get_citas_hoy.php
// Usamos CURDATE() para que MySQL filtre por la fecha actual del servidor
$sql = "SELECT 
            c.idCitas,
            c.clientes AS idClientes,
            TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
            u.nombres,
            u.apellido
        FROM citas c
        INNER JOIN clientes cl ON c.clientes = cl.idClientes
        INNER JOIN usuarios u ON cl.idClientes = u.idUsuarios
        WHERE c.estilistas = ? 
        AND DATE(c.fechaHora) = CURDATE()
        ORDER BY c.fechaHora ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idEstilistas);
$stmt->execute();
$result = $stmt->get_result();

$citasHoy = [];
while ($row = $result->fetch_assoc()) {
    $citasHoy[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $citasHoy
]);
?>