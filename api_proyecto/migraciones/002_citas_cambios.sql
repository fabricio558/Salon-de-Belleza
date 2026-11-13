-- Historial de cancelaciones y reprogramaciones de citas, con el mensaje que el
-- estilista o el recepcionista le deja al cliente explicando el motivo.
-- También se registran los cambios que hace el propio cliente (sin mensaje).
-- Aplicar sobre mydb:  mysql -u root mydb < api_proyecto/migraciones/002_citas_cambios.sql

CREATE TABLE `citas_cambios` (
  `idCambio` int(11) NOT NULL AUTO_INCREMENT,
  `citas_idCitas` int(11) NOT NULL,
  `tipo` enum('cancelacion','reprogramacion') NOT NULL,
  `fechaHoraAnterior` datetime NOT NULL,
  `fechaHoraNueva` datetime DEFAULT NULL,            -- solo en reprogramaciones
  `mensaje` varchar(255) DEFAULT NULL,               -- obligatorio si lo hace el salón
  `usuarios_idUsuarios` int(11) NOT NULL,            -- quién hizo el cambio
  `fechaRegistro` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`idCambio`),
  KEY `fk_citas_cambios_citas_idx` (`citas_idCitas`),
  KEY `fk_citas_cambios_usuarios_idx` (`usuarios_idUsuarios`),
  CONSTRAINT `fk_citas_cambios_citas` FOREIGN KEY (`citas_idCitas`) REFERENCES `citas` (`idCitas`) ON DELETE CASCADE,
  CONSTRAINT `fk_citas_cambios_usuarios` FOREIGN KEY (`usuarios_idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
