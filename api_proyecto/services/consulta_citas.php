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

// Citas de todos los estilistas entre $desde y $hasta (inclusive), ordenadas por fecha y hora.
function obtenerCitasEntre($conn, $desde, $hasta) {
    $sql = "SELECT
                c.idCitas,
                DATE(c.fechaHora) AS fecha,
                UNIX_TIMESTAMP(c.fechaHora) AS fechaHoraTs,
                c.clientes AS idClientes,
                CONCAT(uc.nombres, ' ', uc.apellido) AS cliente,
                c.estilistas AS idEstilistas,
                CONCAT(ue.nombres, ' ', ue.apellido) AS estilista,
                c.estado_cita_idEstado AS idEstado,
                ec.estado_cita AS estado,
                GROUP_CONCAT(s.servicio ORDER BY s.servicio SEPARATOR ', ') AS servicios,
                COALESCE(SUM(cs.cantidad * cs.precioHistorico), 0) AS total,
                EXISTS (SELECT 1 FROM pagos p WHERE p.citas_idCitas = c.idCitas) AS pagada
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
        $row['total'] = (float)$row['total'];
        $row['pagada'] = (bool)$row['pagada'];
        $citas[] = $row;
    }
    return $citas;
}
?>
