-- Sesiones con token (etapa 5). El login emite un token aleatorio y la app lo manda
-- en el header X-Session-Token. Se guarda solo el SHA-256 del token, nunca el token.
--
-- IMPORTANTE: después de aplicar esta migración el login empieza a crear sesiones;
-- sin esta tabla el login falla. Aplicala junto con el código de la etapa 5.
--
-- NO se ejecuta automáticamente: revisarla y correrla en phpMyAdmin (base mydb).

CREATE TABLE `sesiones` (
  `idSesion` int(11) NOT NULL AUTO_INCREMENT,
  `usuarios_idUsuarios` int(11) NOT NULL,
  `tokenHash` char(64) NOT NULL,                       -- hash('sha256', token) en hex
  `creadaEl` datetime NOT NULL DEFAULT current_timestamp(),
  `expiraEl` datetime NOT NULL,
  `revocadaEl` datetime DEFAULT NULL,                  -- al cerrar sesión
  PRIMARY KEY (`idSesion`),
  UNIQUE KEY `uq_sesiones_token` (`tokenHash`),
  KEY `fk_sesiones_usuarios_idx` (`usuarios_idUsuarios`),
  CONSTRAINT `fk_sesiones_usuarios` FOREIGN KEY (`usuarios_idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
