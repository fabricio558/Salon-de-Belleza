<?php
// Reemplaza los servicios de una cita (lo usa el estilista en su agenda).
// POST index.php?action=update_servicios_cita
// Body: { idCitas, servicios: [idServicios, ...] }
// El precio de cada servicio se toma de `services`. Si la cita ya tiene pagos, el total
// nuevo no puede quedar por debajo de lo pagado; si sube, el saldo se cobra en el mostrador.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/pagos_citas.php';

$data = json_decode(file_get_contents('php://input'), true);
$idCitas = (int)($data['idCitas'] ?? 0);
$servicios = $data['servicios'] ?? null;

if ($idCitas <= 0 || !is_array($servicios)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (idCitas o servicios)']);
    exit;
}

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $conn->begin_transaction();
    $enTransaccion = true;

    $cita = totalesCita($conn, $idCitas, true);
    if (!$cita) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'La cita no existe.']);
        exit;
    }

    $stmtDel = $conn->prepare("DELETE FROM citas_servicios WHERE citas_idCitas = ?");
    $stmtDel->bind_param("i", $idCitas);
    $stmtDel->execute();

    if (count($servicios) > 0) {
        $stmtIns = $conn->prepare("INSERT INTO citas_servicios (citas_idCitas, servicios_idServicios, cantidad, precioHistorico)
                                   SELECT ?, idServicios, 1, precio FROM services WHERE idServicios = ?");
        foreach ($servicios as $idServicio) {
            $idServicio = (int)$idServicio;
            $stmtIns->bind_param("ii", $idCitas, $idServicio);
            $stmtIns->execute();
        }
    }

    $nueva = totalesCita($conn, $idCitas);
    if ($nueva['pagado'] > 0 && $nueva['total'] + 0.005 < $nueva['pagado']) {
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'message' => 'La cita ya tiene pagos por $' . number_format($nueva['pagado'], 2, ',', '.') .
                         ' y el total nuevo quedaría por debajo. Consultá con recepción.',
        ]);
        exit;
    }

    $conn->commit();
    $enTransaccion = false;
    echo json_encode(['success' => true, 'message' => 'Servicios de la cita actualizados correctamente']);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('update_servicios_cita: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al actualizar los servicios']);
}
?>
