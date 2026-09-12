<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$data = json_decode(file_get_contents('php://input'), true);
$idCitas = $data['idCitas'] ?? null;

if (!$idCitas) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID de la cita']);
    exit;
}

$sql = "UPDATE citas 
        SET horaFin = NOW(), estado_cita_idEstado = 3 
        WHERE idCitas = ? AND horaInicio IS NOT NULL AND horaFin IS NULL";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idCitas);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    $result = $conn->query("SELECT UNIX_TIMESTAMP(horaFin) AS horaFinTs, TIMESTAMPDIFF(SECOND, horaInicio, horaFin) AS duracionSegundos FROM citas WHERE idCitas = " . intval($idCitas));
    $row = $result->fetch_assoc();

    echo json_encode([
        'success' => true,
        'message' => 'Servicio finalizado',
        'horaFinTs' => (int)$row['horaFinTs'],
        'duracionSegundos' => (int)$row['duracionSegundos']
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'El servicio no está iniciado o ya fue finalizado']);
}
?>