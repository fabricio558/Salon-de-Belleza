<?php
// Cobro de pedidos de productos: totales y registro en `pagos`. No es un endpoint: no la
// registres en router.php. Lo usan crear_preferencia_pedido, get_estado_pago_pedido,
// webhook_mp (vía aplicarEstadoPago) y elegir_pago_local. Tablas: migraciones 004 y 007.
//
// Un pedido se paga de una sola vez: está pagado si pedidos.pagos_idPagos no es NULL.
// El total es SUM(pedidos_productos.cantidad * precioUnitario) (precio al confirmar).

// Datos del pedido con total, pagado y saldo. Con $bloquear = true bloquea la fila
// (FOR UPDATE, dentro de una transacción). Devuelve null si el pedido no existe.
function totalesPedido($conn, $idPedido, $bloquear = false) {
    $sql = "SELECT idPedido, clientes_idUsuarios, estado, pagos_idPagos,
                   TIMESTAMPDIFF(MINUTE, NOW(), venceEl) AS minutosParaVencer
            FROM pedidos WHERE idPedido = ?" . ($bloquear ? " FOR UPDATE" : "");
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    $pedido = $stmt->get_result()->fetch_assoc();
    if (!$pedido) {
        return null;
    }

    $stmt = $conn->prepare("SELECT COALESCE(SUM(cantidad * precioUnitario), 0) AS total
                            FROM pedidos_productos WHERE pedidos_idPedido = ?");
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    $total = round((float)$stmt->get_result()->fetch_assoc()['total'], 2);
    $pagado = $pedido['pagos_idPagos'] !== null;

    return [
        'idPedido'          => (int)$pedido['idPedido'],
        'idClientes'        => (int)$pedido['clientes_idUsuarios'],
        'estado'            => $pedido['estado'],
        'idPagos'           => $pagado ? (int)$pedido['pagos_idPagos'] : null,
        'minutosParaVencer' => (int)$pedido['minutosParaVencer'],
        'total'             => $total,
        'pagado'            => $pagado ? $total : 0.0,
        'saldo'             => $pagado ? 0.0 : $total,
    ];
}

// Líneas del pedido para armar los ítems de Mercado Pago.
function productosPedido($conn, $idPedido) {
    $stmt = $conn->prepare("SELECT pp.productos_idProductos AS idProductos, pr.nombreProducto,
                                   pp.cantidad, pp.precioUnitario
                            FROM pedidos_productos pp
                            INNER JOIN productos pr ON pr.idProductos = pp.productos_idProductos
                            WHERE pp.pedidos_idPedido = ?
                            ORDER BY pr.nombreProducto");
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    $result = $stmt->get_result();
    $lineas = [];
    while ($row = $result->fetch_assoc()) {
        $lineas[] = [
            'idProductos'    => (int)$row['idProductos'],
            'nombreProducto' => $row['nombreProducto'],
            'cantidad'       => (int)$row['cantidad'],
            'precioUnitario' => round((float)$row['precioUnitario'], 2),
        ];
    }
    return $lineas;
}

// Registra el cobro del pedido en `pagos` + `pagos_productos` y lo vincula al pedido.
// Usar dentro de una transacción, con el pedido bloqueado por totalesPedido(..., true).
function registrarPagoPedido($conn, $pedido, $monto, $idMedioPago) {
    $stmt = $conn->prepare("INSERT INTO pagos (fechaHora, montoTotal, clientes_idUsuarios, citas_idCitas, medios_pago_idMedios_pago)
                            VALUES (NOW(), ?, ?, NULL, ?)");
    $stmt->bind_param("dii", $monto, $pedido['idClientes'], $idMedioPago);
    $stmt->execute();
    $idPagos = (int)$conn->insert_id;

    $stmt = $conn->prepare("INSERT INTO pagos_productos (pagos_idPagos, productos_idProductos, cantidad, precioHistorico)
                            SELECT ?, productos_idProductos, cantidad, precioUnitario
                            FROM pedidos_productos WHERE pedidos_idPedido = ?");
    $stmt->bind_param("ii", $idPagos, $pedido['idPedido']);
    $stmt->execute();

    $stmt = $conn->prepare("UPDATE pedidos SET pagos_idPagos = ? WHERE idPedido = ?");
    $stmt->bind_param("ii", $idPagos, $pedido['idPedido']);
    $stmt->execute();
    return $idPagos;
}

// true si el pedido tiene un pago de Mercado Pago que todavía se puede acreditar.
function pedidoTienePagoMpEnProceso($conn, $idPedido) {
    $stmt = $conn->prepare("SELECT 1 FROM pagos_mp WHERE pedidos_idPedido = ?
                            AND estado IN ('pending', 'in_process', 'authorized')");
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    return (bool)$stmt->get_result()->fetch_row();
}

// Último intento de cobro con Mercado Pago del pedido (o null).
function ultimoPagoMpPedido($conn, $idPedido) {
    $stmt = $conn->prepare("SELECT idPagoMp, externalReference, mpPaymentId, estado, statusDetail, monto,
                                   DATE(fechaCreacion) AS fecha, TIME_FORMAT(fechaCreacion, '%H:%i') AS hora,
                                   (venceEl > NOW()) AS vigente
                            FROM pagos_mp WHERE pedidos_idPedido = ?
                            ORDER BY idPagoMp DESC LIMIT 1");
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    if (!$fila) {
        return null;
    }
    $fila['idPagoMp'] = (int)$fila['idPagoMp'];
    $fila['monto'] = (float)$fila['monto'];
    $fila['vigente'] = (bool)$fila['vigente'];
    return $fila;
}
?>
