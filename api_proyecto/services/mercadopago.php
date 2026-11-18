<?php
// Integración con Mercado Pago (Checkout Pro) por API REST con curl, sin SDK.
// No es un endpoint: no la registres en router.php.
//
// Credenciales: C:\xampp\salon_config\mercadopago.php (FUERA de htdocs, así Apache nunca lo
// sirve y no entra al repo). Copiá api_proyecto/config/mercadopago.example.php y completalo.
// El Access Token nunca va en la app.

require_once __DIR__ . '/pagos_citas.php';
require_once __DIR__ . '/pagos_pedidos.php';

const MP_API = 'https://api.mercadopago.com';
const MP_ESTADOS = ['pending', 'in_process', 'authorized', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'];
const MP_TOLERANCIA_FIRMA_SEGUNDOS = 600;

function mpRutaConfig() {
    // services → api_proyecto → salonBelleza → htdocs → xampp
    return dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'salon_config' . DIRECTORY_SEPARATOR . 'mercadopago.php';
}

// Devuelve la configuración o lanza RuntimeException si falta algo.
function mpConfig() {
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $ruta = mpRutaConfig();
    if (!is_file($ruta)) {
        throw new RuntimeException("Falta el archivo de configuración de Mercado Pago ($ruta).");
    }
    $leida = require $ruta;
    foreach (['access_token', 'webhook_secret', 'public_base_url'] as $clave) {
        if (!is_array($leida) || empty($leida[$clave])) {
            throw new RuntimeException("Falta '$clave' en la configuración de Mercado Pago.");
        }
    }
    $leida['public_base_url'] = rtrim($leida['public_base_url'], '/');
    $config = $leida;
    return $config;
}

// Llama a la API de MP. Devuelve ['status' => HTTP, 'body' => array|null].
// Lanza RuntimeException si no se pudo conectar.
function mpRequest($metodo, $ruta, $body = null, $claveIdempotencia = null) {
    $config = mpConfig();
    $headers = [
        'Authorization: Bearer ' . $config['access_token'],
        'Content-Type: application/json',
        'Accept: application/json',
    ];
    if ($claveIdempotencia !== null) {
        $headers[] = 'X-Idempotency-Key: ' . $claveIdempotencia;
    }

    $ch = curl_init(MP_API . $ruta);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $metodo,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 10,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    $respuesta = curl_exec($ch);
    if ($respuesta === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('No se pudo conectar con Mercado Pago: ' . $error);
    }
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'body' => json_decode($respuesta, true)];
}

// Crea la preferencia de Checkout Pro. Devuelve el body de la respuesta (id, init_point, ...).
function mpCrearPreferencia($preferencia, $claveIdempotencia) {
    $r = mpRequest('POST', '/checkout/preferences', $preferencia, $claveIdempotencia);
    if ($r['status'] < 200 || $r['status'] >= 300 || empty($r['body']['id'])) {
        $detalle = $r['body']['message'] ?? ('HTTP ' . $r['status']);
        throw new RuntimeException('Mercado Pago rechazó la preferencia: ' . $detalle);
    }
    return $r['body'];
}

// Pago por id. Devuelve el array del pago, o null si MP responde 404 (por ejemplo, una
// notificación simulada con un id inventado).
function mpObtenerPago($idPago) {
    $r = mpRequest('GET', '/v1/payments/' . rawurlencode((string)$idPago));
    if ($r['status'] === 404) {
        return null;
    }
    if ($r['status'] !== 200 || !is_array($r['body'])) {
        throw new RuntimeException('No se pudo consultar el pago ' . $idPago . ' (HTTP ' . $r['status'] . ').');
    }
    return $r['body'];
}

// El pago más reciente con ese external_reference (respaldo si se perdió el webhook), o null.
function mpBuscarPagoPorReferencia($externalReference) {
    $query = http_build_query([
        'external_reference' => $externalReference,
        'sort' => 'date_created',
        'criteria' => 'desc',
        'limit' => 1,
    ]);
    $r = mpRequest('GET', '/v1/payments/search?' . $query);
    if ($r['status'] !== 200) {
        throw new RuntimeException('No se pudo buscar el pago (HTTP ' . $r['status'] . ').');
    }
    return $r['body']['results'][0] ?? null;
}

// Valida el header x-signature de un webhook ("ts=...,v1=...").
// Plantilla firmada (HMAC-SHA256 con la clave secreta del webhook, en hex):
//   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// Cada par se omite si su valor viene vacío (como hace el SDK oficial).
function mpFirmaValida($xSignature, $xRequestId, $dataId, $secreto) {
    $partes = [];
    foreach (explode(',', (string)$xSignature) as $parte) {
        $kv = explode('=', trim($parte), 2);
        if (count($kv) === 2) {
            $partes[trim($kv[0])] = trim($kv[1]);
        }
    }
    $ts = $partes['ts'] ?? '';
    $v1 = $partes['v1'] ?? '';
    if ($v1 === '' || !ctype_digit($ts)) {
        return false;
    }

    // ts viene en milisegundos o en segundos según la versión; se normaliza a segundos.
    $tsSegundos = strlen($ts) > 10 ? intdiv((int)$ts, 1000) : (int)$ts;
    if (abs(time() - $tsSegundos) > MP_TOLERANCIA_FIRMA_SEGUNDOS) {
        return false;
    }

    // La documentación pide el data.id en minúsculas si es alfanumérico; se prueban las dos formas.
    foreach (array_unique([(string)$dataId, strtolower((string)$dataId)]) as $id) {
        $manifest = '';
        if ($id !== '') {
            $manifest .= 'id:' . $id . ';';
        }
        if ((string)$xRequestId !== '') {
            $manifest .= 'request-id:' . $xRequestId . ';';
        }
        $manifest .= 'ts:' . $ts . ';';
        if (hash_equals(hash_hmac('sha256', $manifest, $secreto), $v1)) {
            return true;
        }
    }
    return false;
}

// Aplica el estado de un pago de MP (lo que devolvió /v1/payments) a `pagos_mp` y, si quedó
// aprobado, registra el cobro en `pagos` una sola vez. Idempotente: se puede llamar varias
// veces con el mismo pago (webhooks repetidos, consultas de respaldo).
// Devuelve el estado guardado, o null si el pago no corresponde a ninguna fila de pagos_mp.
function aplicarEstadoPago($conn, $pago) {
    $referencia = (string)($pago['external_reference'] ?? '');
    $idPagoMpApi = (int)($pago['id'] ?? 0);
    $estado = (string)($pago['status'] ?? '');
    $detalle = substr((string)($pago['status_detail'] ?? ''), 0, 100);
    if ($referencia === '' || $idPagoMpApi <= 0 || !in_array($estado, MP_ESTADOS, true)) {
        return null;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("SELECT idPagoMp, citas_idCitas, pedidos_idPedido, mpPaymentId, estado, monto, moneda, pagos_idPagos
                                FROM pagos_mp WHERE externalReference = ? FOR UPDATE");
        $stmt->bind_param("s", $referencia);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        if (!$fila) {
            $conn->rollback();
            return null;
        }

        // Si la preferencia ya tiene un pago aprobado, se ignoran otros pagos de la misma
        // preferencia (por ejemplo, un rechazo anterior que llega tarde). Sí se aceptan cambios
        // del mismo pago (reintegro, contracargo).
        if ($fila['estado'] === 'approved' && (int)$fila['mpPaymentId'] !== $idPagoMpApi) {
            $conn->commit();
            return $fila['estado'];
        }

        $monto = (float)($pago['transaction_amount'] ?? 0);
        $moneda = (string)($pago['currency_id'] ?? '');
        if ($estado === 'approved' && (abs($monto - (float)$fila['monto']) > 0.01 || $moneda !== $fila['moneda'])) {
            // No debería pasar (el monto lo fija la preferencia). No se registra el cobro.
            error_log("aplicarEstadoPago: el pago $idPagoMpApi no coincide con pagos_mp {$fila['idPagoMp']} ($monto $moneda)");
            $estado = 'pending';
            $detalle = 'monto_no_coincide';
        }

        $idPagoMp = (int)$fila['idPagoMp'];
        $stmt = $conn->prepare("UPDATE pagos_mp
                                SET mpPaymentId = ?, estado = ?, statusDetail = ?, fechaActualizacion = NOW(),
                                    fechaAprobacion = IF(? = 'approved', COALESCE(fechaAprobacion, NOW()), fechaAprobacion)
                                WHERE idPagoMp = ?");
        $stmt->bind_param("isssi", $idPagoMpApi, $estado, $detalle, $estado, $idPagoMp);
        $stmt->execute();

        if ($estado === 'approved' && $fila['pagos_idPagos'] === null) {
            $idMedio = idMedioPagoPorNombre($conn, MEDIO_PAGO_MERCADOPAGO);
            if ($idMedio === null) {
                throw new RuntimeException('Falta el medio de pago "Mercado Pago" (migración 006).');
            }
            if ($fila['pedidos_idPedido'] !== null) {
                $idPagos = registrarCobroMpPedido($conn, (int)$fila['pedidos_idPedido'], (float)$fila['monto'], $idMedio, $idPagoMpApi);
            } else {
                $cita = totalesCita($conn, (int)$fila['citas_idCitas'], true);
                if ($cita === null) {
                    throw new RuntimeException('La cita del pago ' . $idPagoMpApi . ' no existe.');
                }
                if ($cita['saldo'] <= 0) {
                    // Se cobró dos veces (por ejemplo, en el mostrador y online): se registra igual,
                    // porque la plata entró, y queda en el log para reintegrarla.
                    error_log("aplicarEstadoPago: la cita {$cita['idCitas']} ya estaba pagada; revisar reintegro del pago $idPagoMpApi");
                }
                $idPagos = registrarPagoCita($conn, $cita, (float)$fila['monto'], $idMedio);
            }
            $stmt = $conn->prepare("UPDATE pagos_mp SET pagos_idPagos = ? WHERE idPagoMp = ?");
            $stmt->bind_param("ii", $idPagos, $idPagoMp);
            $stmt->execute();
        }

        $conn->commit();
        return $estado;
    } catch (Throwable $e) {
        $conn->rollback();
        throw $e;
    }
}

// Registra el cobro aprobado de un pedido (dentro de la transacción de aplicarEstadoPago).
// Si el pedido ya estaba pagado o no está pendiente, el cobro se registra igual (la plata
// entró) y queda en el log para reintegrarlo a mano.
function registrarCobroMpPedido($conn, $idPedido, $monto, $idMedio, $idPagoMpApi) {
    $pedido = totalesPedido($conn, $idPedido, true);
    if ($pedido === null) {
        throw new RuntimeException('El pedido del pago ' . $idPagoMpApi . ' no existe.');
    }
    if ($pedido['idPagos'] !== null) {
        error_log("aplicarEstadoPago: el pedido $idPedido ya estaba pagado; revisar reintegro del pago $idPagoMpApi");
        $stmt = $conn->prepare("INSERT INTO pagos (fechaHora, montoTotal, clientes_idUsuarios, citas_idCitas, medios_pago_idMedios_pago)
                                VALUES (NOW(), ?, ?, NULL, ?)");
        $stmt->bind_param("dii", $monto, $pedido['idClientes'], $idMedio);
        $stmt->execute();
        return (int)$conn->insert_id;
    }
    if ($pedido['estado'] !== 'pendiente') {
        error_log("aplicarEstadoPago: el pedido $idPedido está {$pedido['estado']}; revisar reintegro del pago $idPagoMpApi");
    }
    return registrarPagoPedido($conn, $pedido, $monto, $idMedio);
}

// Crea un intento de cobro con Mercado Pago (fila de pagos_mp + preferencia de Checkout Pro)
// para una cita o un pedido. Usar dentro de una transacción, con la cita o el pedido bloqueado.
// $destino: ['tipo' => 'cita'|'pedido', 'id' => int]. $items: ítems de MP armados con datos
// de la base. $minutosVigencia: cuánto dura la preferencia.
// Devuelve ['idPagoMp' => int, 'initPoint' => string]. Lanza RuntimeException si MP falla.
function mpIniciarCobro($conn, $destino, $monto, $items, $origen, $idCreador, $urlRetorno, $minutosVigencia) {
    $config = mpConfig();
    $idCitas = $destino['tipo'] === 'cita' ? (int)$destino['id'] : null;
    $idPedido = $destino['tipo'] === 'pedido' ? (int)$destino['id'] : null;
    $minutos = (int)$minutosVigencia;

    $stmt = $conn->prepare("INSERT INTO pagos_mp (citas_idCitas, pedidos_idPedido, monto, origen, usuarios_idCreador, venceEl)
                            VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL ? MINUTE)");
    $stmt->bind_param("iidsii", $idCitas, $idPedido, $monto, $origen, $idCreador, $minutos);
    $stmt->execute();
    $idPagoMp = (int)$conn->insert_id;
    $referencia = $destino['tipo'] . '-' . (int)$destino['id'] . '-' . $idPagoMp;

    // Vencimiento en UTC calculado por MySQL (el PHP de XAMPP está en Europe/Berlin).
    $stmt = $conn->prepare("SELECT DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%s.000+00:00') AS desde,
                                   DATE_FORMAT(UTC_TIMESTAMP() + INTERVAL ? MINUTE, '%Y-%m-%dT%H:%i:%s.000+00:00') AS hasta");
    $stmt->bind_param("i", $minutos);
    $stmt->execute();
    $fechas = $stmt->get_result()->fetch_assoc();

    $base = $config['public_base_url'];
    $retorno = function ($resultado) use ($base, $urlRetorno) {
        $params = ['action' => 'retorno_pago', 'resultado' => $resultado];
        if ($urlRetorno !== '') {
            $params['r'] = $urlRetorno;
        }
        return $base . '/index.php?' . http_build_query($params);
    };

    $preferencia = [
        'items'              => $items,
        'external_reference' => $referencia,
        'notification_url'   => $base . '/index.php?action=webhook_mp&source_news=webhooks',
        'back_urls'          => [
            'success' => $retorno('success'),
            'failure' => $retorno('failure'),
            'pending' => $retorno('pending'),
        ],
        'auto_return'          => 'approved',
        'expires'              => true,
        'expiration_date_from' => $fechas['desde'],
        'expiration_date_to'   => $fechas['hasta'],
        'metadata'             => ['tipo' => $destino['tipo'], 'id' => (int)$destino['id'], 'id_pago_mp' => $idPagoMp],
    ];
    if (!empty($config['statement_descriptor'])) {
        $preferencia['statement_descriptor'] = $config['statement_descriptor'];
    }

    $respuesta = mpCrearPreferencia($preferencia, 'salon-pref-' . $referencia);
    $initPoint = $respuesta['init_point'] ?? '';
    if ($initPoint === '') {
        throw new RuntimeException('Mercado Pago no devolvió init_point.');
    }

    $stmt = $conn->prepare("UPDATE pagos_mp SET externalReference = ?, preferenceId = ?, initPoint = ? WHERE idPagoMp = ?");
    $stmt->bind_param("sssi", $referencia, $respuesta['id'], $initPoint, $idPagoMp);
    $stmt->execute();

    return ['idPagoMp' => $idPagoMp, 'initPoint' => $initPoint];
}

// URL de retorno de la app permitida en las back_urls: Expo Go (exp://, exps://) o el
// scheme propio de un development build (salonbelleza://). Evita un open redirect.
function urlRetornoAppValida($url) {
    return is_string($url) && strlen($url) <= 300 && preg_match('#^(exps?|salonbelleza)://[^\s"\'<>]*$#i', $url) === 1;
}
?>
