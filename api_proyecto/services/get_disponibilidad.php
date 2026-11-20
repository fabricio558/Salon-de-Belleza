<?php
// Agenda de un estilista para reservar: 7 días desde `desde` (nunca antes de hoy),
// con los rangos ya reservados y los horarios de inicio posibles cada 30 minutos.
// Lo usa CrearCita (cliente y recepcionista) para guiar la elección del horario.
// GET index.php?action=get_disponibilidad&idEstilistas=<id>[&desde=AAAA-MM-DD][&servicios=<id>:<cant>,...]
// Requiere sesión (cliente o recepcionista).
//
// Usa las mismas reglas que crear_cita: horario del local (turnosLocal), duración de
// los servicios (duracionDeServicios) y solo bloquean las citas activas o en curso.
// No expone datos de otros clientes: solo horas de inicio y fin.
//
// Respuesta: { success, data: { hoy, desde, duracion, intervalo, dias: [{
//   fecha, diaSemana (1 = lunes ... 7 = domingo), abierto,
//   ocupados: [{ desde: 'HH:MM', hasta: 'HH:MM' }],
//   horarios: [{ hora: 'HH:MM', estado: 'libre' | 'reservado' | 'corto' }],
//   libres }] } }
// estado: reservado = el horario cae dentro de una cita; corto = está libre pero los
// servicios elegidos no terminan antes de la cita siguiente. Los horarios que ya
// pasaron no se devuelven.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

const DIAS_AGENDA = 7;
const INTERVALO_AGENDA_MINUTOS = 30;
const MAX_DIAS_ADELANTE = 180;

try {
    require_once __DIR__ . '/../db.php';
    require_once __DIR__ . '/auth.php';
    require_once __DIR__ . '/horarios.php';
    require_once __DIR__ . '/consulta_citas.php';
    global $conn;

    requerirSesion($conn, [ROL_CLIENTE_AUTH, ROL_RECEPCIONISTA_AUTH]);

    $idEstilista = isset($_GET['idEstilistas']) ? (int)$_GET['idEstilistas'] : 0;
    if ($idEstilista <= 0) {
        echo json_encode(['success' => false, 'message' => 'Falta el estilista.']);
        exit;
    }

    // Mismo control que crear_cita: un ex estilista conserva su fila en `estilistas`.
    $stmt = $conn->prepare("SELECT 1 FROM usuarios u INNER JOIN estilistas e ON e.idEstilistas = u.idUsuarios
                            WHERE u.idUsuarios = ? AND u.idRol = 2 AND u.estado = 1");
    $stmt->bind_param("i", $idEstilista);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_row()) {
        echo json_encode(['success' => false, 'message' => 'El estilista elegido no está disponible.']);
        exit;
    }

    // servicios=3:1,5:2 → duración de la cita que se quiere reservar.
    $servicios = [];
    $textoServicios = trim((string)($_GET['servicios'] ?? ''));
    if ($textoServicios !== '') {
        foreach (explode(',', $textoServicios) as $parte) {
            $datos = explode(':', $parte);
            $servicios[] = ['idServicios' => (int)$datos[0], 'cantidad' => (int)($datos[1] ?? 1)];
        }
    }
    $duracion = duracionDeServicios($conn, $servicios);
    if ($duracion === null) {
        echo json_encode(['success' => false, 'message' => 'Alguno de los servicios elegidos no existe.']);
        exit;
    }
    $duracion = max(1, $duracion);

    // "Ahora" según MySQL: el PHP de XAMPP está en Europe/Berlin.
    $ahora = $conn->query("SELECT CURDATE() AS hoy, HOUR(NOW()) * 60 + MINUTE(NOW()) AS minutos")->fetch_assoc();
    $hoy = $ahora['hoy'];
    $minutosAhora = (int)$ahora['minutos'];

    $desde = $hoy;
    if (isset($_GET['desde']) && $_GET['desde'] !== '') {
        $pedido = validarFecha($_GET['desde']);
        if ($pedido === null) {
            echo json_encode(['success' => false, 'message' => 'Fecha inválida. Usá el formato AAAA-MM-DD.']);
            exit;
        }
        // Aritmética de fechas sin hora: no depende de la zona horaria de PHP.
        $limite = (new DateTime($hoy))->modify('+' . MAX_DIAS_ADELANTE . ' days')->format('Y-m-d');
        $desde = max($hoy, min($pedido, $limite));
    }
    $hasta = (new DateTime($desde))->modify('+' . (DIAS_AGENDA - 1) . ' days')->format('Y-m-d');

    // Citas que bloquean la agenda, con su duración (60 min si no tienen servicios).
    $sql = "SELECT DATE(c.fechaHora) AS fecha,
                   HOUR(c.fechaHora) * 60 + MINUTE(c.fechaHora) AS inicio,
                   COALESCE(d.duracion, ?) AS duracion,
                   TIME_FORMAT(c.fechaHora, '%H:%i') AS desde,
                   TIME_FORMAT(c.fechaHora + INTERVAL COALESCE(d.duracion, ?) MINUTE, '%H:%i') AS hasta
            FROM citas c
            LEFT JOIN (
                SELECT cs.citas_idCitas, SUM(cs.cantidad * s.duracionMinutos) AS duracion
                FROM citas_servicios cs
                INNER JOIN services s ON s.idServicios = cs.servicios_idServicios
                GROUP BY cs.citas_idCitas
            ) d ON d.citas_idCitas = c.idCitas
            WHERE c.estilistas = ?
              AND c.estado_cita_idEstado IN (?, ?)
              AND c.fechaHora >= CAST(? AS DATE)
              AND c.fechaHora < CAST(? AS DATE) + INTERVAL 1 DAY
            ORDER BY c.fechaHora";
    $porDefecto = DURACION_POR_DEFECTO_MINUTOS;
    $activa = ESTADO_ACTIVA;
    $enCurso = ESTADO_EN_CURSO;
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iiiiiss", $porDefecto, $porDefecto, $idEstilista, $activa, $enCurso, $desde, $hasta);
    $stmt->execute();
    $resultado = $stmt->get_result();

    $citasPorDia = [];
    while ($fila = $resultado->fetch_assoc()) {
        $citasPorDia[$fila['fecha']][] = [
            'inicio' => (int)$fila['inicio'],
            'fin' => (int)$fila['inicio'] + (int)$fila['duracion'],
            'desde' => $fila['desde'],
            'hasta' => $fila['hasta'],
        ];
    }

    $dias = [];
    $dia = new DateTime($desde);
    for ($i = 0; $i < DIAS_AGENDA; $i++, $dia->modify('+1 day')) {
        $fecha = $dia->format('Y-m-d');
        $diaSemana = (int)$dia->format('N');
        $turnos = turnosLocal($diaSemana);
        $citas = $citasPorDia[$fecha] ?? [];

        $horarios = [];
        $libres = 0;
        foreach ($turnos as [$inicioTurno, $finTurno]) {
            for ($m = $inicioTurno; $m <= $finTurno; $m += INTERVALO_AGENDA_MINUTOS) {
                // crear_cita exige una fecha futura: hoy solo cuentan los horarios que no pasaron.
                if ($fecha === $hoy && $m <= $minutosAhora) {
                    continue;
                }
                $estado = 'libre';
                foreach ($citas as $cita) {
                    if ($m >= $cita['inicio'] && $m < $cita['fin']) {
                        $estado = 'reservado';
                        break;
                    }
                    if ($m < $cita['fin'] && $m + $duracion > $cita['inicio']) {
                        $estado = 'corto';
                    }
                }
                if ($estado === 'libre') {
                    $libres++;
                }
                $horarios[] = ['hora' => sprintf('%02d:%02d', intdiv($m, 60), $m % 60), 'estado' => $estado];
            }
        }

        $dias[] = [
            'fecha' => $fecha,
            'diaSemana' => $diaSemana,
            'abierto' => !empty($turnos),
            'ocupados' => array_map(fn($c) => ['desde' => $c['desde'], 'hasta' => $c['hasta']], $citas),
            'horarios' => $horarios,
            'libres' => $libres,
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'hoy' => $hoy,
            'desde' => $desde,
            'duracion' => $duracion,
            'intervalo' => INTERVALO_AGENDA_MINUTOS,
            'dias' => $dias,
        ],
    ]);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar la agenda']);
}
