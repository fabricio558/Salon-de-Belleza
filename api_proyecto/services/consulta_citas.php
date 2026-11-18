<?php
// Consulta compartida por get_citas_dia y get_citas_semana (vistas del recepcionista).
// No es un endpoint: no la registres en router.php.

// Devuelve la fecha recibida si es AAAA-MM-DD válida, o null si es inválida.
function validarFecha($fecha) {
    $dt = DateTime::createFromFormat('Y-m-d', $fecha);
    return ($dt && $dt->format('Y-m-d') === $fecha) ? $fecha : null;
}

// Fecha de hoy según MySQL. El PHP de XAMPP está en Europe/Berlin y date('Y-m-d')
// da el día siguiente a partir de las 20:00 de Argentina.
function fechaHoy($conn) {
    return $conn->query("SELECT CURDATE() AS hoy")->fetch_assoc()['hoy'];
}

// Convierte total y pagado de una fila de cita y agrega saldo y pagada.
// pagada = tiene servicios y lo pagado cubre el total.
function agregarEstadoPago(&$row) {
    $row['total'] = round((float)$row['total'], 2);
    $row['pagado'] = round((float)$row['pagado'], 2);
    $row['saldo'] = max(0, round($row['total'] - $row['pagado'], 2));
    $row['pagada'] = $row['total'] > 0 && $row['saldo'] <= 0;
}

// Citas de todos los estilistas entre $desde y $hasta (inclusive), ordenadas por fecha y hora.
function obtenerCitasEntre($conn, $desde, $hasta) {
    $sql = "SELECT
                c.idCitas,
                DATE(c.fechaHora) AS fecha,
                TIME_FORMAT(c.fechaHora, '%H:%i') AS hora,
                UNIX_TIMESTAMP(c.fechaHora) AS fechaHoraTs,
                c.clientes AS idClientes,
                CONCAT(uc.nombres, ' ', uc.apellido) AS cliente,
                c.estilistas AS idEstilistas,
                CONCAT(ue.nombres, ' ', ue.apellido) AS estilista,
                c.estado_cita_idEstado AS idEstado,
                ec.estado_cita AS estado,
                GROUP_CONCAT(s.servicio ORDER BY s.servicio SEPARATOR ', ') AS servicios,
                COALESCE(SUM(cs.cantidad * cs.precioHistorico), 0) AS total,
                (SELECT COALESCE(SUM(p.montoTotal), 0) FROM pagos p WHERE p.citas_idCitas = c.idCitas) AS pagado,
                (SELECT pm.estado FROM pagos_mp pm WHERE pm.citas_idCitas = c.idCitas
                 ORDER BY pm.idPagoMp DESC LIMIT 1) AS estadoPagoMp,
                (SELECT ml.medioPago FROM medios_pago ml WHERE ml.idMedios_pago = c.medioPagoLocal) AS medioPagoLocal
            FROM citas c
            INNER JOIN usuarios uc ON uc.idUsuarios = c.clientes
            INNER JOIN usuarios ue ON ue.idUsuarios = c.estilistas
            INNER JOIN estado_cita ec ON ec.idEstado = c.estado_cita_idEstado
            LEFT JOIN citas_servicios cs ON cs.citas_idCitas = c.idCitas
            LEFT JOIN services s ON s.idServicios = cs.servicios_idServicios
            WHERE c.fechaHora >= ? AND c.fechaHora < DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY c.idCitas
            ORDER BY c.fechaHora ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $desde, $hasta);
    $stmt->execute();
    $result = $stmt->get_result();

    $citas = [];
    while ($row = $result->fetch_assoc()) {
        $row['idCitas'] = (int)$row['idCitas'];
        $row['fechaHoraTs'] = (int)$row['fechaHoraTs'];
        $row['idClientes'] = (int)$row['idClientes'];
        $row['idEstilistas'] = (int)$row['idEstilistas'];
        $row['idEstado'] = (int)$row['idEstado'];
        agregarEstadoPago($row);
        $citas[] = $row;
    }
    return $citas;
}
?>
