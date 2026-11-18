<?php
// Crea una cita. El cliente la crea para sí mismo; el recepcionista, para cualquier cliente.
// POST index.php?action=crear_cita
// Body: { idClientes, idEstilistas, fechaHora, servicios: [{ idServicios, cantidad }] }
// Requiere sesión (X-Session-Token). El precio de cada servicio se toma de la base.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/auth.php';
global $conn;

$sesion = requerirSesion($conn, [ROL_CLIENTE_AUTH, ROL_RECEPCIONISTA_AUTH]);

$data = json_decode(file_get_contents('php://input'), true);

$idCliente    = $data['idClientes'] ?? null;
$idEstilista  = $data['idEstilistas'] ?? null;
$fechaHora    = $data['fechaHora'] ?? null; 
$servicios    = $data['servicios'] ?? []; 

if (!$idCliente || !$idEstilista || !$fechaHora || empty($servicios)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios']);
    exit;
}

if ($sesion['idRol'] === ROL_CLIENTE_AUTH && (int)$idCliente !== $sesion['idUsuarios']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Solo podés reservar citas para vos.']);
    exit;
}

require_once __DIR__ . '/horarios.php';

$mensajeError = validarHorarioLocal(new DateTime($fechaHora));
if ($mensajeError !== null) {
    echo json_encode(['success' => false, 'message' => $mensajeError]);
    exit;
}

// Validaciones con datos de la base. "Ahora" según MySQL: el PHP de XAMPP está en Europe/Berlin.
$stmt = $conn->prepare("SELECT ? > NOW() AS futura");
$stmt->bind_param("s", $fechaHora);
$stmt->execute();
if (!(int)$stmt->get_result()->fetch_assoc()['futura']) {
    echo json_encode(['success' => false, 'message' => 'Elegí una fecha y hora futura.']);
    exit;
}

$stmt = $conn->prepare("SELECT 1 FROM usuarios u INNER JOIN clientes c ON c.idClientes = u.idUsuarios
                        WHERE u.idUsuarios = ? AND u.idRol = 1 AND u.estado = 1");
$idClienteInt = (int)$idCliente;
$stmt->bind_param("i", $idClienteInt);
$stmt->execute();
if (!$stmt->get_result()->fetch_row()) {
    echo json_encode(['success' => false, 'message' => 'El cliente no existe o no está activo.']);
    exit;
}

// Un usuario que dejó de ser estilista conserva su fila en `estilistas`: controlar también el rol.
$stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE idUsuarios = ? AND idRol = 2 AND estado = 1");
$idEstilistaInt = (int)$idEstilista;
$stmt->bind_param("i", $idEstilistaInt);
$stmt->execute();
if (!$stmt->get_result()->fetch_row()) {
    echo json_encode(['success' => false, 'message' => 'El estilista elegido no está disponible.']);
    exit;
}

$conn->begin_transaction();

try {
    // Bloquear la agenda del estilista hasta el commit: así dos reservas
    // simultáneas para el mismo horario no pasan las dos el control.
    if (!bloquearAgendaEstilista($conn, (int)$idEstilista)) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'El estilista elegido no está disponible.']);
        exit;
    }

    $duracion = duracionDeServicios($conn, $servicios);
    if ($duracion === null) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Algún servicio elegido no existe o tiene una cantidad inválida.']);
        exit;
    }

    $choque = buscarSuperposicion($conn, (int)$idEstilista, $fechaHora, $duracion);
    if ($choque) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => mensajeSuperposicion($choque)]);
        exit;
    }

    $sqlCita = "INSERT INTO citas (fechaHora, estado_cita_idEstado, clientes, estilistas) VALUES (?, 1, ?, ?)";
    $stmtCita = $conn->prepare($sqlCita);
    $stmtCita->bind_param("sii", $fechaHora, $idCliente, $idEstilista);
    $stmtCita->execute();

    $idCitaNueva = $conn->insert_id;

    // El precio sale de `services`, nunca de la app: es lo que después se cobra.
    $sqlDetalle = "INSERT INTO citas_servicios (citas_idCitas, servicios_idServicios, cantidad, precioHistorico)
                   SELECT ?, idServicios, ?, precio FROM services WHERE idServicios = ?";
    $stmtDetalle = $conn->prepare($sqlDetalle);

    foreach ($servicios as $servicio) {
        $idServicio = (int)$servicio['idServicios'];
        $cantidad   = (int)$servicio['cantidad'];
        $stmtDetalle->bind_param("iii", $idCitaNueva, $cantidad, $idServicio);
        $stmtDetalle->execute();
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Cita creada con éxito', 'idCitas' => $idCitaNueva]);

} catch (Exception $e) {
    $conn->rollback();
    error_log('crear_cita: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al crear la cita. Intentá de nuevo.']);
}
?>