<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *"); 
ini_set('display_errors', 0);

require_once __DIR__ . '/../db.php'; 

global $conn;

$idEstilistas = $_GET['id_estilistas'] ?? '';

if (empty($idEstilistas)) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID del estilista.']);
    exit;
}

$sql = "SELECT 
            c.idCitas,
            c.clientes AS idClientes,
            DATE(c.fechaHora) AS fecha,
            TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
            ec.estado_cita AS estado, 
            u.nombres,
            u.apellido,
            GROUP_CONCAT(s.servicio SEPARATOR ', ') AS servicios
        FROM citas c
        INNER JOIN clientes cl ON c.clientes = cl.idClientes
        INNER JOIN usuarios u ON cl.idClientes = u.idUsuarios
        LEFT JOIN estado_cita ec ON c.estado_cita_idEstado = ec.idEstado
        LEFT JOIN citas_servicios cs ON cs.citas_idCitas = c.idCitas
        LEFT JOIN services s ON s.idServicios = cs.servicios_idServicios
        WHERE c.estilistas = ? 
        AND YEARWEEK(c.fechaHora, 1) = YEARWEEK(CURDATE(), 1)
        GROUP BY c.idCitas, c.clientes, c.fechaHora, ec.estado_cita, u.nombres, u.apellido
        ORDER BY c.fechaHora ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idEstilistas);
$stmt->execute();
$result = $stmt->get_result();

$citasSemana = [];
while ($row = $result->fetch_assoc()) {
    $citasSemana[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $citasSemana
]);
?>