<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';
global $conn;

$data = json_decode(file_get_contents('php://input'), true);

$idCliente    = $data['idClientes'] ?? null;
$idEstilista  = $data['idEstilistas'] ?? null;
$fechaHora    = $data['fechaHora'] ?? null; 
$servicios    = $data['servicios'] ?? []; 

if (!$idCliente || !$idEstilista || !$fechaHora || empty($servicios)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios']);
    exit;
}

$dateTime = new DateTime($fechaHora);
$diaSemana = (int)$dateTime->format('N'); 
$totalMinutos = (int)$dateTime->format('G') * 60 + (int)$dateTime->format('i');

$valido = false;
$mensajeError = '';

if ($diaSemana >= 1 && $diaSemana <= 5) {
    $t1_ini = 8 * 60;
    $t1_fin = 12 * 60;
    $t2_ini = 13 * 60 + 30;
    $t2_fin = 20 * 60;

    if (($totalMinutos >= $t1_ini && $totalMinutos <= $t1_fin) || ($totalMinutos >= $t2_ini && $totalMinutos <= $t2_fin)) {
        $valido = true;
    } else {
        $mensajeError = 'Horario fuera del rango permitido de lunes a viernes (08:00 a 12:00 y 13:30 a 20:00).';
    }
} elseif ($diaSemana == 6) {
    $s_ini = 9 * 60;
    $s_fin = 17 * 60;

    if ($totalMinutos >= $s_ini && $totalMinutos <= $s_fin) {
        $valido = true;
    } else {
        $mensajeError = 'Horario fuera del rango permitido para los sábados (09:00 a 17:00).';
    }
} else {
    $mensajeError = 'El local permanece cerrado los domingos.';
}

if (!$valido) {
    echo json_encode(['success' => false, 'message' => $mensajeError]);
    exit;
}

$conn->begin_transaction();

try {
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