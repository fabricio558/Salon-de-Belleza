<?php
// Estado del cobro de una cita: total, pagado, saldo y el último intento con Mercado Pago.
// GET index.php?action=get_estado_pago_cita&idCitas=<id>
// Requiere sesión: el cliente solo sus citas; el estilista las suyas; el recepcionista cualquiera.
//
// Respaldo del webhook: si el último intento con MP sigue sin resolverse, consulta a MP
// (por external_reference) y aplica el estado. Así la app ve el resultado aunque ngrok
// haya estado apagado cuando MP mandó la notificación.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/mercadopago.php';

$idCitas = isset($_GET['idCitas']) ? (int)$_GET['idCitas'] : 0;
if ($idCitas <= 0) {
    echo json_encode(['success' => false, 'message' => 'Falta la cita.']);
    exit;
}

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sesion = requerirSesion($conn);

    $cita = totalesCita($conn, $idCitas);
    if (!$cita) {
        echo json_encode(['success' => false, 'message' => 'La cita no existe.']);
        exit;
    }
    $esDuenio = ($sesion['idRol'] === ROL_CLIENTE_AUTH && $cita['idClientes'] === $sesion['idUsuarios'])
             || ($sesion['idRol'] === ROL_ESTILISTA_AUTH && $cita['idEstilistas'] === $sesion['idUsuarios'])
             || $sesion['idRol'] === ROL_RECEPCIONISTA_AUTH;
    if (!$esDuenio) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No podés ver el pago de esta cita.']);
        exit;
    }

    $ultimo = ultimoPagoMpCita($conn, $idCitas);
    if ($ultimo && in_array($ultimo['estado'], ['creada', 'pending', 'in_process', 'authorized'], true)
        && $ultimo['externalReference'] !== null) {
        try {
            $pago = mpBuscarPagoPorReferencia($ultimo['externalReference']);
            if ($pago !== null) {
                aplicarEstadoPago($conn, $pago);
                $cita = totalesCita($conn, $idCitas);
                $ultimo = ultimoPagoMpCita($conn, $idCitas);
            }
        } catch (RuntimeException $e) {
            // Sin conexión con MP: se informa lo que hay en la base.
            error_log('get_estado_pago_cita: ' . $e->getMessage());
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'idCitas' => $cita['idCitas'],
            'total'   => $cita['total'],
            'pagado'  => $cita['pagado'],
            'saldo'   => $cita['saldo'],
            'pagada'  => $cita['total'] > 0 && $cita['saldo'] <= 0,
            'ultimoPagoMp' => $ultimo ? [
                'idPagoMp'     => $ultimo['idPagoMp'],
                'estado'       => $ultimo['estado'],
                'statusDetail' => $ultimo['statusDetail'],
                'monto'        => $ultimo['monto'],
                'fecha'        => $ultimo['fecha'],
                'hora'         => $ultimo['hora'],
            ] : null,
        ],
    ]);
} catch (mysqli_sql_exception $e) {
    error_log('get_estado_pago_cita: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al consultar el pago']);
}
?>
