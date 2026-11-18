<?php
// El cliente confirma un pedido de productos para retirar en el salón (lo paga en la app
// con Mercado Pago o en el local: ver crear_preferencia_pedido y elegir_pago_local).
// POST index.php?action=crear_pedido
// Body: { idClientes, items: [{ idProductos, cantidad }] }
// La app manda solo ids y cantidades: precio, estado y stock se toman de la base,
// dentro de una transacción que bloquea los productos (FOR UPDATE).
// Si algún producto no alcanza, no se guarda nada y se responde `faltantes`.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/pedidos.php';

$input = leerJsonBody();
$idClientes = (int)($input['idClientes'] ?? 0);
$items      = $input['items'] ?? null;

if ($idClientes <= 0 || !is_array($items) || count($items) === 0) {
    echo json_encode(['success' => false, 'message' => 'El pedido está vacío.']);
    exit;
}

// Normalizar: cantidades enteras > 0 y un solo renglón por producto.
$cantidades = [];
foreach ($items as $item) {
    $id = (int)($item['idProductos'] ?? 0);
    $cantidad = $item['cantidad'] ?? 0;
    if ($id <= 0 || !is_int($cantidad) || $cantidad <= 0) {
        echo json_encode(['success' => false, 'message' => 'Hay productos o cantidades inválidos en el pedido.']);
        exit;
    }
    $cantidades[$id] = ($cantidades[$id] ?? 0) + $cantidad;
}
if (count($cantidades) > MAX_PRODUCTOS_DISTINTOS_PEDIDO) {
    echo json_encode(['success' => false, 'message' => 'El pedido tiene demasiados productos distintos.']);
    exit;
}
ksort($cantidades); // bloquear siempre en orden de id evita deadlocks entre pedidos simultáneos

$enTransaccion = false;
try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    if (!esClienteActivo($conn, $idClientes)) {
        echo json_encode(['success' => false, 'message' => 'Solo un cliente activo puede hacer pedidos.']);
        exit;
    }

    // Liberar antes el stock reservado por pedidos vencidos (de cualquier cliente).
    vencerPedidos($conn);

    $conn->begin_transaction();
    $enTransaccion = true;

    $stmt = $conn->prepare("SELECT idProductos, nombreProducto, precioVenta, stock, estado
                            FROM productos WHERE idProductos = ? FOR UPDATE");
    $lineas = [];
    $faltantes = [];
    foreach ($cantidades as $id => $cantidad) {
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $producto = $stmt->get_result()->fetch_assoc();

        if (!$producto || (int)$producto['estado'] !== PRODUCTO_ACTIVO_PEDIDO) {
            $faltantes[] = ['idProductos' => $id, 'nombreProducto' => $producto['nombreProducto'] ?? null,
                            'pedido' => $cantidad, 'disponible' => 0];
            continue;
        }
        if ((int)$producto['stock'] < $cantidad) {
            $faltantes[] = ['idProductos' => $id, 'nombreProducto' => $producto['nombreProducto'],
                            'pedido' => $cantidad, 'disponible' => (int)$producto['stock']];
            continue;
        }
        $lineas[] = ['id' => $id, 'cantidad' => $cantidad, 'precio' => (float)$producto['precioVenta']];
    }

    if (!empty($faltantes)) {
        $conn->rollback();
        $enTransaccion = false;
        $detalle = array_map(function ($f) {
            $nombre = $f['nombreProducto'] ?? 'Un producto';
            return $f['disponible'] > 0
                ? "{$nombre}: pediste {$f['pedido']} y quedan {$f['disponible']}."
                : "{$nombre}: ya no está disponible.";
        }, $faltantes);
        echo json_encode([
            'success' => false,
            'message' => "No hay stock suficiente:\n" . implode("\n", $detalle),
            'faltantes' => $faltantes,
        ]);
        exit;
    }

    $total = 0;
    foreach ($lineas as $linea) {
        $total += $linea['cantidad'] * $linea['precio'];
    }

    $stmt = $conn->prepare("INSERT INTO pedidos (clientes_idUsuarios, fechaHora, venceEl, estado, montoTotal)
                            VALUES (?, NOW(), NOW() + INTERVAL ? DAY, 'pendiente', ?)");
    $dias = DIAS_VENCIMIENTO_PEDIDO;
    $stmt->bind_param("iid", $idClientes, $dias, $total);
    $stmt->execute();
    $idPedido = $conn->insert_id;

    $detalle = $conn->prepare("INSERT INTO pedidos_productos (pedidos_idPedido, productos_idProductos, cantidad, precioUnitario)
                               VALUES (?, ?, ?, ?)");
    $descontar = $conn->prepare("UPDATE productos SET stock = stock - ? WHERE idProductos = ?");
    foreach ($lineas as $linea) {
        $detalle->bind_param("iiid", $idPedido, $linea['id'], $linea['cantidad'], $linea['precio']);
        $detalle->execute();
        $descontar->bind_param("ii", $linea['cantidad'], $linea['id']);
        $descontar->execute();
    }

    $conn->commit();
    $enTransaccion = false;

    $stmt = $conn->prepare("SELECT DATE(venceEl) AS fechaVence, TIME_FORMAT(venceEl, '%H:%i') AS horaVence
                            FROM pedidos WHERE idPedido = ?");
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    $vence = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        'success' => true,
        'message' => 'Tu pedido fue confirmado. Pagalo en la app o en el local, y retiralo en el salón.',
        'idPedido' => $idPedido,
        'montoTotal' => $total,
        'fechaVence' => $vence['fechaVence'],
        'horaVence' => $vence['horaVence'],
    ]);
} catch (mysqli_sql_exception $e) {
    if ($enTransaccion) {
        $conn->rollback();
    }
    error_log('crear_pedido: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al confirmar el pedido']);
}
?>
