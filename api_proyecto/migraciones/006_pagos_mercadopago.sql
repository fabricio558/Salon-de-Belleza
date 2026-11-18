-- Pago de citas con Mercado Pago (Checkout Pro) y cobro en el mostrador (etapa 6).
--
-- Reglas que implementa el backend:
-- - Cada intento de cobro con MP es una fila de `pagos_mp` (una preferencia de Checkout Pro).
--   El monto lo calcula el servidor con citas_servicios (cantidad * precioHistorico) menos
--   lo ya pagado; nunca se toma de la app.
-- - El webhook de MP (y get_estado_pago_cita como respaldo) consulta el pago en la API de MP
--   y, si quedó aprobado, crea la fila en `pagos` (medio "Mercado Pago") y sus
--   `pagos_servicios`, una sola vez (idempotente: pagos_mp.pagos_idPagos).
-- - El recepcionista también puede cobrar en el mostrador (efectivo, transferencia, QR):
--   crea `pagos` + `pagos_servicios` directo, sin pasar por `pagos_mp`.
-- - El estado de la cita (estado_cita) no cambia por pagar: "pagada" se calcula
--   comparando SUM(pagos.montoTotal) con el total de la cita.
-- - `mp_notificaciones` guarda cada notificación recibida, para depurar.
--
-- NO se ejecuta automáticamente: revisarla y correrla en phpMyAdmin (base mydb).

SET NAMES utf8;

INSERT INTO `medios_pago` (`medioPago`, `estado`) VALUES ('Mercado Pago', 1);

CREATE TABLE `pagos_mp` (
  `idPagoMp` int(11) NOT NULL AUTO_INCREMENT,
  `citas_idCitas` int(11) NOT NULL,
  `externalReference` varchar(64) DEFAULT NULL,         -- cita-<idCitas>-<idPagoMp>; se completa al insertar
  `preferenceId` varchar(100) DEFAULT NULL,
  `initPoint` varchar(500) DEFAULT NULL,                -- URL del checkout, para reusar la preferencia
  `mpPaymentId` bigint(20) DEFAULT NULL,
  `estado` enum('creada','pending','in_process','authorized','approved','rejected','cancelled','refunded','charged_back') NOT NULL DEFAULT 'creada',
  `statusDetail` varchar(100) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'ARS',
  `origen` enum('cliente','recepcion') NOT NULL,
  `usuarios_idCreador` int(11) NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT current_timestamp(),
  `venceEl` datetime NOT NULL,                          -- vencimiento de la preferencia
  `fechaActualizacion` datetime DEFAULT NULL,
  `fechaAprobacion` datetime DEFAULT NULL,
  `pagos_idPagos` int(11) DEFAULT NULL,                 -- el cobro registrado al aprobarse
  PRIMARY KEY (`idPagoMp`),
  UNIQUE KEY `uq_pagos_mp_external_reference` (`externalReference`),
  UNIQUE KEY `uq_pagos_mp_payment` (`mpPaymentId`),
  KEY `fk_pagos_mp_citas_idx` (`citas_idCitas`),
  KEY `fk_pagos_mp_creador_idx` (`usuarios_idCreador`),
  KEY `fk_pagos_mp_pagos_idx` (`pagos_idPagos`),
  CONSTRAINT `fk_pagos_mp_citas` FOREIGN KEY (`citas_idCitas`) REFERENCES `citas` (`idCitas`),
  CONSTRAINT `fk_pagos_mp_creador` FOREIGN KEY (`usuarios_idCreador`) REFERENCES `usuarios` (`idUsuarios`),
  CONSTRAINT `fk_pagos_mp_pagos` FOREIGN KEY (`pagos_idPagos`) REFERENCES `pagos` (`idPagos`),
  CONSTRAINT `chk_pagos_mp_monto` CHECK (`monto` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE `mp_notificaciones` (
  `idNotificacion` int(11) NOT NULL AUTO_INCREMENT,
  `recibidaEl` datetime NOT NULL DEFAULT current_timestamp(),
  `tipo` varchar(50) DEFAULT NULL,                      -- type / topic (payment, merchant_order, ...)
  `dataId` varchar(64) DEFAULT NULL,
  `requestId` varchar(100) DEFAULT NULL,
  `firmaValida` tinyint(1) NOT NULL DEFAULT 0,
  `procesada` tinyint(1) NOT NULL DEFAULT 0,
  `error` varchar(255) DEFAULT NULL,
  `cuerpo` text DEFAULT NULL,
  PRIMARY KEY (`idNotificacion`),
  KEY `idx_mp_notificaciones_data` (`dataId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
