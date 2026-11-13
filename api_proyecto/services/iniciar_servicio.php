<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);
$idCitas = $data['idCitas'] ?? null;

if (!$idCitas) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID de la cita']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sql = "UPDATE citas
            SET horaInicio = NOW(), estado_cita_idEstado = 4
            WHERE idCitas = ? AND horaInicio IS NULL";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $idCitas);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        $stmt = $conn->prepare("SELECT UNIX_TIMESTAMP(horaInicio) AS horaInicioTs FROM citas WHERE idCitas = ?");
        $stmt->bind_param("i", $idCitas);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        echo json_encode([
            'success' => true,
            'message' => 'Servicio iniciado',
            'horaInicioTs' => (int)$row['horaInicioTs']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'La cita no existe o el servicio ya fue iniciado']);
    }
} catch (mysqli_sql_exception $e) {
    error_log('iniciar_servicio: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al iniciar el servicio']);
}
?>
