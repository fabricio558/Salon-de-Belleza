<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$data = json_decode(file_get_contents('php://input'), true);
$idCitas = $data['idCitas'] ?? null;
$servicios = $data['servicios'] ?? null;

if (!$idCitas || !is_array($servicios)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (idCitas o servicios)']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Eliminar servicios anteriores asociados a la cita
    $stmtDel = $conn->prepare("DELETE FROM citas_servicios WHERE citas_idCitas = ?");
    $stmtDel->bind_param("i", $idCitas);
    $stmtDel->execute();
    $stmtDel->close();

    // 2. Insertar los nuevos servicios seleccionados con su precio histórico actual
    if (count($servicios) > 0) {
        $stmtIns = $conn->prepare("INSERT INTO citas_servicios (citas_idCitas, servicios_idServicios, cantidad, precioHistorico) 
                                   VALUES (?, ?, 1, (SELECT precio FROM services WHERE idServicios = ?))");
        
        foreach ($servicios as $idServicio) {
            $stmtIns->bind_param("iii", $idCitas, $idServicio, $idServicio);
            $stmtIns->execute();
        }
        $stmtIns->close();
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Servicios de la cita actualizados correctamente']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error al actualizar los servicios: ' . $e->getMessage()]);
}
?>