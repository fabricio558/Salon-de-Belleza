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

$sql = "SELECT 
            c.idCitas,
            c.clientes AS idClientes,
            TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
            UNIX_TIMESTAMP(c.horaInicio) AS horaInicioTs,
            UNIX_TIMESTAMP(c.horaFin) AS horaFinTs,
            c.estado_cita_idEstado AS estado,
            u.nombres,
            u.apellido,
            GROUP_CONCAT(s.servicio SEPARATOR ', ') AS servicios,
            GROUP_CONCAT(s.idServicios) AS ids_servicios,
            SUM(s.precio) AS precioTotal  -- <-- NUEVO: Suma el precio de todos los servicios de la cita
        FROM citas c
        INNER JOIN clientes cl ON c.clientes = cl.idClientes
        INNER JOIN usuarios u ON cl.idClientes = u.idUsuarios
        LEFT JOIN citas_servicios cs ON c.idCitas = cs.citas_idCitas
        LEFT JOIN services s ON cs.servicios_idServicios = s.idServicios
        WHERE c.estilistas = ? 
        AND DATE(c.fechaHora) = CURDATE()
        GROUP BY c.idCitas
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