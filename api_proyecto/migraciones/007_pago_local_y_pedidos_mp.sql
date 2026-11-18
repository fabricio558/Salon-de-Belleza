-- Elección de cómo pagar (etapa 7):
-- - El cliente elige, para cada cita o pedido con saldo, si paga en la app (Mercado Pago)
--   o en el local. Si elige el local, indica con qué medio: Efectivo o Transferencia.
--   Se guarda en `medioPagoLocal` (NULL = no eligió pagar en el local). Es solo un aviso
--   para el salón: el cobro real lo sigue registrando el recepcionista en `pagos`.
-- - Los pedidos de productos también se pueden pagar con Mercado Pago (como las citas):
--   `pagos_mp` pasa a referenciar una cita O un pedido (exactamente uno de los dos).
--   Al aprobarse, se registra `pagos` + `pagos_productos` y se completa pedidos.pagos_idPagos;
--   el pedido sigue "pendiente" (de retiro) hasta que lo entreguen.
-- - Un pedido pagado (o con un pago de MP en proceso) no vence ni lo puede cancelar el cliente.
--
-- Requiere las migraciones 004 y 006.
-- NO se ejecuta automáticamente: revisarla y correrla en phpMyAdmin (base mydb).

SET NAMES utf8;

ALTER TABLE `citas`
  ADD COLUMN `medioPagoLocal` int(11) DEFAULT NULL,
  ADD KEY `fk_citas_medio_pago_local_idx` (`medioPagoLocal`),
  ADD CONSTRAINT `fk_citas_medio_pago_local` FOREIGN KEY (`medioPagoLocal`) REFERENCES `medios_pago` (`idMedios_pago`);

ALTER TABLE `pedidos`
  ADD COLUMN `medioPagoLocal` int(11) DEFAULT NULL,
  ADD KEY `fk_pedidos_medio_pago_local_idx` (`medioPagoLocal`),
  ADD CONSTRAINT `fk_pedidos_medio_pago_local` FOREIGN KEY (`medioPagoLocal`) REFERENCES `medios_pago` (`idMedios_pago`);

ALTER TABLE `pagos_mp`
  MODIFY `citas_idCitas` int(11) DEFAULT NULL,
  ADD COLUMN `pedidos_idPedido` int(11) DEFAULT NULL AFTER `citas_idCitas`,
  ADD KEY `fk_pagos_mp_pedidos_idx` (`pedidos_idPedido`),
  ADD CONSTRAINT `fk_pagos_mp_pedidos` FOREIGN KEY (`pedidos_idPedido`) REFERENCES `pedidos` (`idPedido`),
  ADD CONSTRAINT `chk_pagos_mp_destino` CHECK ((`citas_idCitas` IS NULL) <> (`pedidos_idPedido` IS NULL));
