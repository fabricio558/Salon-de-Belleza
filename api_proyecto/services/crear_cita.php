<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$data = json_decode(file_get_contents('php://input'), true);

$idCliente    = $data['idClientes'] ?? null;
$idEstilista  = $data['idEstilistas'] ?? null;
$fechaHora    = $data['fechaHora'] ?? null; // formato 'YYYY-MM-DD HH:MM:SS'
$servicios    = $data['servicios'] ?? []; // [{idServicios, cantidad, precio}]

if (!$idCliente || !$idEstilista || !$fechaHora || empty($servicios)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios']);
    exit;
}

$conn->begin_transaction();

try {
    // 1 = estado_cita "Activo" (ajustar según tu tabla estado_cita si tiene valores)
    $sqlCita = "INSERT INTO citas (fechaHora, estado_cita_idEstado, clientes, estilistas) VALUES (?, 1, ?, ?)";
    $stmtCita = $conn->prepare($sqlCita);
    $stmtCita->bind_param("sii", $fechaHora, $idCliente, $idEstilista);
    $stmtCita->execute();

    $idCitaNueva = $conn->insert_id;

    $sqlDetalle = "INSERT INTO citas_servicios (citas_idCitas, servicios_idServicios, cantidad, precioHistorico) VALUES (?, ?, ?, ?)";
    $stmtDetalle = $conn->prepare($sqlDetalle);

    foreach ($servicios as $servicio) {
        $idServicio = $servicio['idServicios'];
        $cantidad   = $servicio['cantidad'];
        $precio     = $servicio['precio'];
        $stmtDetalle->bind_param("iiid", $idCitaNueva, $idServicio, $cantidad, $precio);
        $stmtDetalle->execute();
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Cita creada con éxito', 'idCitas' => $idCitaNueva]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error al crear la cita: ' . $e->getMessage()]);
}
?>