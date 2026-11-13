-- Pedidos de productos (etapa 4). El cliente confirma el pedido en la app y lo
-- retira y paga en el salón; el recepcionista lo cobra y lo marca como entregado.
--
-- Reglas que implementa el backend:
-- - El stock se descuenta al confirmar (reserva) y vuelve si el pedido se cancela o vence.
-- - El precio de cada producto se toma de `productos` al confirmar (precioUnitario).
-- - El cliente puede cancelar mientras el pedido esté pendiente.
-- - Un pedido pendiente vence a los 7 días (`venceEl`); como no hay tareas programadas,
--   los endpoints de pedidos marcan los vencidos cada vez que se consultan.
-- - Al entregar se registra el cobro en `pagos` + `pagos_productos` (tablas existentes)
--   y el pedido queda vinculado a ese pago.
--
-- NO se ejecuta automáticamente: revisarlo y correrlo en phpMyAdmin (base mydb).

CREATE TABLE `pedidos` (
  `idPedido` int(11) NOT NULL AUTO_INCREMENT,
  `clientes_idUsuarios` int(11) NOT NULL,
  `fechaHora` datetime NOT NULL DEFAULT current_timestamp(),   -- cuándo lo confirmó el cliente
  `venceEl` datetime NOT NULL,                                  -- fechaHora + 7 días
  `estado` enum('pendiente','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `canceladoPor` enum('cliente','salon','vencimiento') DEFAULT NULL,  -- solo si estado = cancelado
  `montoTotal` decimal(10,2) NOT NULL,
  `fechaCierre` datetime DEFAULT NULL,                          -- cuándo se entregó o canceló
  `usuarios_idCierre` int(11) DEFAULT NULL,                     -- quién lo entregó o canceló (NULL si venció)
  `pagos_idPagos` int(11) DEFAULT NULL,                         -- el cobro, al entregarlo
  PRIMARY KEY (`idPedido`),
  KEY `fk_pedidos_clientes_idx` (`clientes_idUsuarios`),
  KEY `idx_pedidos_estado_vence` (`estado`, `venceEl`),
  KEY `fk_pedidos_cierre_idx` (`usuarios_idCierre`),
  KEY `fk_pedidos_pagos_idx` (`pagos_idPagos`),
  CONSTRAINT `fk_pedidos_clientes` FOREIGN KEY (`clientes_idUsuarios`) REFERENCES `clientes` (`idClientes`),
  CONSTRAINT `fk_pedidos_cierre` FOREIGN KEY (`usuarios_idCierre`) REFERENCES `usuarios` (`idUsuarios`),
  CONSTRAINT `fk_pedidos_pagos` FOREIGN KEY (`pagos_idPagos`) REFERENCES `pagos` (`idPagos`),
  CONSTRAINT `chk_pedidos_monto` CHECK (`montoTotal` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE `pedidos_productos` (
  `pedidos_idPedido` int(11) NOT NULL,
  `productos_idProductos` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precioUnitario` decimal(10,2) NOT NULL,                      -- precio al confirmar el pedido
  PRIMARY KEY (`pedidos_idPedido`, `productos_idProductos`),
  KEY `fk_pedidos_productos_productos_idx` (`productos_idProductos`),
  CONSTRAINT `fk_pedidos_productos_pedidos` FOREIGN KEY (`pedidos_idPedido`) REFERENCES `pedidos` (`idPedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_pedidos_productos_productos` FOREIGN KEY (`productos_idProductos`) REFERENCES `productos` (`idProductos`),
  CONSTRAINT `chk_pedidos_productos_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_pedidos_productos_precio` CHECK (`precioUnitario` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Medios de pago que acepta el salón (para cobrar pedidos y citas). La tabla está vacía.
SET NAMES utf8;
INSERT INTO `medios_pago` (`medioPago`, `estado`) VALUES
  ('Efectivo', 1),
  ('Transferencia', 1),
  ('QR / billetera virtual', 1);
