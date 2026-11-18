<?php
// Pedidos de productos: lógica compartida por crear_pedido, get_pedidos_cliente y
// cancelar_pedido (y más adelante los endpoints del recepcionista).
// No es un endpoint: no la registres en router.php. Tablas: migración 004.
//
// Reglas:
// - El stock se descuenta al confirmar (reserva) y vuelve si el pedido se cancela o vence.
// - El precio sale siempre de `productos` (nunca de lo que manda la app).
// - Un pedido pendiente vence a los DIAS_VENCIMIENTO_PEDIDO días. No hay tareas
//   programadas: vencerPedidos() se llama al principio de cada endpoint de pedidos.

require_once __DIR__ . '/comun.php';

const DIAS_VENCIMIENTO_PEDIDO = 7;
const PRODUCTO_ACTIVO_PEDIDO = 1;
const MAX_PRODUCTOS_DISTINTOS_PEDIDO = 30;

// Devuelve al stock las unidades de un pedido. Llamar dentro de una transacción,
// con el pedido ya bloqueado. Bloquea los productos en orden de id (evita deadlocks).
function devolverStockPedido($conn, $idPedido) {
    $stmt = $conn->prepare("SELECT productos_idProductos AS id, cantidad FROM pedidos_productos
                            WHERE pedidos_idPedido = ? ORDER BY productos_idProductos");
    $stmt->bind_param("i", $idPedido);
    $stmt->execute();
    $detalle = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $bloquear = $conn->prepare("SELECT 1 FROM productos WHERE idProductos = ? FOR UPDATE");
    $devolver = $conn->prepare("UPDATE productos SET stock = stock + ? WHERE idProductos = ?");
    foreach ($detalle as $linea) {
        $id = (int)$linea['id'];
        $cantidad = (int)$linea['cantidad'];
        $bloquear->bind_param("i", $id);
        $bloquear->execute();
        $bloquear->get_result();
        $devolver->bind_param("ii", $cantidad, $id);
        $devolver->execute();
    }
}

// Cierra un pedido como cancelado. $canceladoPor: 'cliente' | 'salon' | 'vencimiento'.
// $idUsuarioCierre es NULL cuando vence solo.
function marcarPedidoCancelado($conn, $idPedido, $canceladoPor, $idUsuarioCierre) {
    $stmt = $conn->prepare("UPDATE pedidos SET estado = 'cancelado', canceladoPor = ?,
                                   fechaCierre = NOW(), usuarios_idCierre = ?
                            WHERE idPedido = ?");
    $stmt->bind_param("sii", $canceladoPor, $idUsuarioCierre, $idPedido);
    $stmt->execute();
}

// Marca como vencidos los pedidos pendientes cuyo plazo pasó y devuelve su stock.
// Usa su propia transacción: llamarla ANTES de abrir otra.
// Si se pasa $idClientes, solo revisa los pedidos de ese cliente.
// Los pedidos pagados (o con un pago de Mercado Pago en proceso) no vencen: el cliente
// ya pagó y el salón se los guarda hasta que los retire.
function vencerPedidos($conn, $idClientes = null) {
    $noPagado = "pagos_idPagos IS NULL
                 AND NOT EXISTS (SELECT 1 FROM pagos_mp pm WHERE pm.pedidos_idPedido = pedidos.idPedido
                                 AND pm.estado IN ('pending', 'in_process', 'authorized'))";
    $conn->begin_transaction();
    try {
        if ($idClientes === null) {
            $stmt = $conn->prepare("SELECT idPedido FROM pedidos
                                    WHERE estado = 'pendiente' AND venceEl < NOW() AND $noPagado
                                    ORDER BY idPedido FOR UPDATE");
        } else {
            $stmt = $conn->prepare("SELECT idPedido FROM pedidos
                                    WHERE estado = 'pendiente' AND venceEl < NOW() AND clientes_idUsuarios = ?
                                      AND $noPagado
                                    ORDER BY idPedido FOR UPDATE");
            $stmt->bind_param("i", $idClientes);
        }
        $stmt->execute();
        $vencidos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        foreach ($vencidos as $pedido) {
            $id = (int)$pedido['idPedido'];
            devolverStockPedido($conn, $id);
            marcarPedidoCancelado($conn, $id, 'vencimiento', null);
        }
        $conn->commit();
    } catch (mysqli_sql_exception $e) {
        $conn->rollback();
        throw $e;
    }
}

// true si el usuario es un cliente activo con fila en `clientes` (FK de pedidos).
function esClienteActivo($conn, $idClientes) {
    $stmt = $conn->prepare("SELECT 1 FROM usuarios u INNER JOIN clientes c ON c.idClientes = u.idUsuarios
                            WHERE u.idUsuarios = ? AND u.idRol = 1 AND u.estado = 1");
    $stmt->bind_param("i", $idClientes);
    $stmt->execute();
    return (bool)$stmt->get_result()->fetch_row();
}
?>
