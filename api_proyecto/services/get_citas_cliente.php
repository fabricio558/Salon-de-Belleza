<?php
// Historial de citas de un cliente (próximas y pasadas), con lo necesario para
// saber si todavía puede cancelarlas o reprogramarlas.
// GET index.php?action=get_citas_cliente&idClientes=<id>
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/horarios.php';

$idClientes = isset($_GET['idClientes']) ? (int)$_GET['idClientes'] : 0;

if ($idClientes <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID del cliente.']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    // puedeModificar: activa (1) y faltan al menos ANTICIPACION_CAMBIO_MINUTOS.
    // proxima: activa o en curso y todavía no pasó (o está en curso).
    $sql = "SELECT
                c.idCitas,
                DATE(c.fechaHora) AS fecha,
                TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
                UNIX_TIMESTAMP(c.fechaHora) AS fechaHoraTs,
                c.estilistas AS idEstilistas,
                CONCAT(ue.nombres, ' ', ue.apellido) AS estilista,
                c.estado_cita_idEstado AS idEstado,
                ec.estado_cita AS estado,
                GROUP_CONCAT(s.servicio ORDER BY s.servicio SEPARATOR ', ') AS servicios,
                COALESCE(SUM(cs.cantidad * cs.precioHistorico), 0) AS total,
                EXISTS (SELECT 1 FROM pagos p WHERE p.citas_idCitas = c.idCitas) AS pagada,
                (c.estado_cita_idEstado = 1
                    AND c.fechaHora >= NOW() + INTERVAL ? MINUTE) AS puedeModificar,
                (c.estado_cita_idEstado = 4
                    OR (c.estado_cita_idEstado = 1 AND c.fechaHora >= NOW())) AS proxima,
                m.tipo AS tipoCambio,
                m.mensaje AS mensajeSalon,
                m.autor AS autorCambio,
                m.rolAutor AS rolAutorCambio,
                DATE(m.fechaHoraAnterior) AS fechaAnterior,
                TIME_FORMAT(m.fechaHoraAnterior, '%H:%i') AS horaAnterior
            FROM citas c
            INNER JOIN usuarios ue ON ue.idUsuarios = c.estilistas
            INNER JOIN estado_cita ec ON ec.idEstado = c.estado_cita_idEstado
            -- Último cambio con mensaje (los que hace el salón; los del cliente no llevan mensaje).
            LEFT JOIN (
                SELECT cc.citas_idCitas, cc.tipo, cc.mensaje, cc.fechaHoraAnterior,
                       CONCAT(ua.nombres, ' ', ua.apellido) AS autor, r.nombreRol AS rolAutor
                FROM citas_cambios cc
                INNER JOIN usuarios ua ON ua.idUsuarios = cc.usuarios_idUsuarios
                INNER JOIN roles r ON r.idRol = ua.idRol
                WHERE cc.idCambio = (SELECT MAX(x.idCambio) FROM citas_cambios x
                                     WHERE x.citas_idCitas = cc.citas_idCitas AND x.mensaje IS NOT NULL)
            ) m ON m.citas_idCitas = c.idCitas
            LEFT JOIN citas_servicios cs ON cs.citas_idCitas = c.idCitas
            LEFT JOIN services s ON s.idServicios = cs.servicios_idServicios
            WHERE c.clientes = ?
            GROUP BY c.idCitas
            ORDER BY c.fechaHora DESC";

    $anticipacion = ANTICIPACION_CAMBIO_MINUTOS;
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $anticipacion, $idClientes);
    $stmt->execute();
    $result = $stmt->get_result();

    $citas = [];
    while ($row = $result->fetch_assoc()) {
        $row['idCitas'] = (int)$row['idCitas'];
        $row['fechaHoraTs'] = (int)$row['fechaHoraTs'];
        $row['idEstilistas'] = (int)$row['idEstilistas'];
        $row['idEstado'] = (int)$row['idEstado'];
        $row['total'] = (float)$row['total'];
        $row['pagada'] = (bool)$row['pagada'];
        $row['puedeModificar'] = (bool)$row['puedeModificar'];
        $row['proxima'] = (bool)$row['proxima'];
        $citas[] = $row;
    }

    echo json_encode([
        'success' => true,
        'anticipacionMinutos' => ANTICIPACION_CAMBIO_MINUTOS,
        'data' => $citas,
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('get_citas_cliente: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar tus citas']);
}
?>
