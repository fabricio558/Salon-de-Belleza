-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-08-2026 a las 14:05:26
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mydb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `idCitas` int(11) NOT NULL,
  `fechaHora` datetime DEFAULT NULL,
  `estado_cita_idEstado` int(11) NOT NULL,
  `clientes` int(11) NOT NULL,
  `estilistas` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas_servicios`
--

CREATE TABLE `citas_servicios` (
  `citas_idCitas` int(11) NOT NULL,
  `servicios_idServicios` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precioHistorico` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `idUsuarios` int(11) NOT NULL,
  `fechaCreacion` date DEFAULT NULL,
  `notaAlergias` varchar(45) DEFAULT NULL,
  `notaPreferencias` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `codigoarea`
--

CREATE TABLE `codigoarea` (
  `idCodigoArea` int(11) NOT NULL,
  `codigo` varchar(10) DEFAULT NULL,
  `provincia` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comisiones_pagadas`
--

CREATE TABLE `comisiones_pagadas` (
  `idComision` int(11) NOT NULL,
  `montoComision` decimal(10,2) DEFAULT NULL,
  `fechaLiquidacion` date DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `estilistas_idUsuarios` int(11) NOT NULL,
  `pagos_idPagos` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especialidades`
--

CREATE TABLE `especialidades` (
  `idEspecialidades` int(11) NOT NULL,
  `especialidad` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_cita`
--

CREATE TABLE `estado_cita` (
  `idEstado` int(11) NOT NULL,
  `estado_cita` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estilistas`
--

CREATE TABLE `estilistas` (
  `idUsuarios` int(11) NOT NULL,
  `porcentajeComision` decimal(5,2) DEFAULT NULL,
  `horaEntrada` time DEFAULT NULL,
  `horaSalida` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estilistas_especialidades`
--

CREATE TABLE `estilistas_especialidades` (
  `estilistas_idUsuarios` int(11) NOT NULL,
  `especialidades_idEspecialidades` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estilistas_servicios`
--

CREATE TABLE `estilistas_servicios` (
  `idUsuarios` int(11) NOT NULL,
  `idServicios` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gerente`
--

CREATE TABLE `gerente` (
  `idUsuarios` int(11) NOT NULL,
  `fechaCreacion` date DEFAULT NULL,
  `salario` decimal(45,0) DEFAULT NULL,
  `fechaContratacion` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medios_pago`
--

CREATE TABLE `medios_pago` (
  `idMedios_pago` int(11) NOT NULL,
  `medioPago` varchar(45) NOT NULL,
  `estado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimiento_interno`
--

CREATE TABLE `movimiento_interno` (
  `idMovimiento` int(11) NOT NULL,
  `productos_idProductos` int(11) NOT NULL,
  `usuarios_idUsuarios` int(11) NOT NULL,
  `proveedores_idProveedores` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `idPagos` int(11) NOT NULL,
  `fechaHora` datetime DEFAULT NULL,
  `montoTotal` decimal(10,2) DEFAULT NULL,
  `clientes_idUsuarios` int(11) NOT NULL,
  `citas_idCitas` int(11) DEFAULT NULL,
  `medios_pago_idMedios_pago` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_productos`
--

CREATE TABLE `pagos_productos` (
  `pagos_idPagos` int(11) NOT NULL,
  `productos_idProductos` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precioHistorico` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_servicios`
--

CREATE TABLE `pagos_servicios` (
  `idPagos_servicios` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precioHistorico` decimal(10,2) DEFAULT NULL,
  `pagos_idPagos` int(11) NOT NULL,
  `servicios_idServicios` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `idProductos` int(11) NOT NULL,
  `nombreProducto` varchar(45) DEFAULT NULL,
  `marca` varchar(45) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `porcentajeGanancia` decimal(5,2) DEFAULT NULL,
  `precioVenta` decimal(10,2) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `idProveedores` int(11) NOT NULL,
  `nombreComercial` varchar(45) DEFAULT NULL,
  `correoCorporativo` varchar(45) DEFAULT NULL,
  `cuit` varchar(45) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores_productos`
--

CREATE TABLE `proveedores_productos` (
  `proveedores_idProveedores` int(11) NOT NULL,
  `productos_idProductos` int(11) NOT NULL,
  `precioCompraHistorico` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recepcionista`
--

CREATE TABLE `recepcionista` (
  `idUsuarios` int(11) NOT NULL,
  `fechaCreacion` date DEFAULT NULL,
  `salario` decimal(45,0) DEFAULT NULL,
  `fechaContratacion` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `services`
--

CREATE TABLE `services` (
  `idServicios` int(11) NOT NULL,
  `servicio` varchar(45) DEFAULT NULL,
  `precio` decimal(10,0) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `telefonos`
--

CREATE TABLE `telefonos` (
  `idTelefonos` int(11) NOT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `codigoArea_idCodigoArea` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `telefonos_proveedores`
--

CREATE TABLE `telefonos_proveedores` (
  `telefonos_idTelefonos` int(11) NOT NULL,
  `proveedores_idProveedores` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `telefonos_usuarios`
--

CREATE TABLE `telefonos_usuarios` (
  `telefonos_idTelefonos` int(11) NOT NULL,
  `usuarios_idUsuarios` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `idUsuarios` int(11) NOT NULL,
  `nombres` varchar(45) DEFAULT NULL,
  `apellido` varchar(45) DEFAULT NULL,
  `nombreUsuario` varchar(45) DEFAULT NULL,
  `fechaNacimiento` date DEFAULT NULL,
  `correo` varchar(45) DEFAULT NULL,
  `contrasena` varchar(45) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`idCitas`),
  ADD KEY `fk_citas_clientes1_idx` (`clientes`),
  ADD KEY `fk_citas_estilistas1_idx` (`estilistas`),
  ADD KEY `fk_citas_estado_cita1_idx` (`estado_cita_idEstado`);

--
-- Indices de la tabla `citas_servicios`
--
ALTER TABLE `citas_servicios`
  ADD PRIMARY KEY (`citas_idCitas`,`servicios_idServicios`),
  ADD KEY `fk_citas_has_servicios_servicios1_idx` (`servicios_idServicios`),
  ADD KEY `fk_citas_has_servicios_citas1_idx` (`citas_idCitas`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`idUsuarios`);

--
-- Indices de la tabla `codigoarea`
--
ALTER TABLE `codigoarea`
  ADD PRIMARY KEY (`idCodigoArea`);

--
-- Indices de la tabla `comisiones_pagadas`
--
ALTER TABLE `comisiones_pagadas`
  ADD PRIMARY KEY (`idComision`),
  ADD KEY `fk_comisiones_pagadas_estilistas1_idx` (`estilistas_idUsuarios`),
  ADD KEY `fk_comisiones_pagadas_pagos1_idx` (`pagos_idPagos`);

--
-- Indices de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  ADD PRIMARY KEY (`idEspecialidades`);

--
-- Indices de la tabla `estado_cita`
--
ALTER TABLE `estado_cita`
  ADD PRIMARY KEY (`idEstado`);

--
-- Indices de la tabla `estilistas`
--
ALTER TABLE `estilistas`
  ADD PRIMARY KEY (`idUsuarios`);

--
-- Indices de la tabla `estilistas_especialidades`
--
ALTER TABLE `estilistas_especialidades`
  ADD PRIMARY KEY (`estilistas_idUsuarios`,`especialidades_idEspecialidades`),
  ADD KEY `fk_estilistas_has_especialidades_especialidades1_idx` (`especialidades_idEspecialidades`),
  ADD KEY `fk_estilistas_has_especialidades_estilistas1_idx` (`estilistas_idUsuarios`);

--
-- Indices de la tabla `estilistas_servicios`
--
ALTER TABLE `estilistas_servicios`
  ADD PRIMARY KEY (`idUsuarios`,`idServicios`),
  ADD KEY `fk_estilistas_has_servicios_servicios1_idx` (`idServicios`),
  ADD KEY `fk_estilistas_has_servicios_estilistas1_idx` (`idUsuarios`);

--
-- Indices de la tabla `gerente`
--
ALTER TABLE `gerente`
  ADD PRIMARY KEY (`idUsuarios`);

--
-- Indices de la tabla `medios_pago`
--
ALTER TABLE `medios_pago`
  ADD PRIMARY KEY (`idMedios_pago`);

--
-- Indices de la tabla `movimiento_interno`
--
ALTER TABLE `movimiento_interno`
  ADD PRIMARY KEY (`idMovimiento`),
  ADD KEY `fk_movimiento_interno_productos1_idx` (`productos_idProductos`),
  ADD KEY `fk_movimiento_interno_usuarios1_idx` (`usuarios_idUsuarios`),
  ADD KEY `fk_movimiento_interno_proveedores1_idx` (`proveedores_idProveedores`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`idPagos`),
  ADD KEY `fk_pagos_clientes1_idx` (`clientes_idUsuarios`),
  ADD KEY `fk_pagos_citas1_idx` (`citas_idCitas`),
  ADD KEY `fk_pagos_medios_pago1_idx` (`medios_pago_idMedios_pago`);

--
-- Indices de la tabla `pagos_productos`
--
ALTER TABLE `pagos_productos`
  ADD PRIMARY KEY (`pagos_idPagos`,`productos_idProductos`),
  ADD KEY `fk_pagos_has_productos_pagos1_idx` (`pagos_idPagos`),
  ADD KEY `fk_pagos_productos_productos1_idx` (`productos_idProductos`);

--
-- Indices de la tabla `pagos_servicios`
--
ALTER TABLE `pagos_servicios`
  ADD PRIMARY KEY (`idPagos_servicios`),
  ADD KEY `fk_pagos_servicios_pagos1_idx` (`pagos_idPagos`),
  ADD KEY `fk_pagos_servicios_servicios1_idx` (`servicios_idServicios`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`idProductos`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`idProveedores`),
  ADD UNIQUE KEY `cuit_UNIQUE` (`cuit`);

--
-- Indices de la tabla `proveedores_productos`
--
ALTER TABLE `proveedores_productos`
  ADD PRIMARY KEY (`proveedores_idProveedores`,`productos_idProductos`),
  ADD KEY `fk_proveedores_has_productos_productos1_idx` (`productos_idProductos`),
  ADD KEY `fk_proveedores_has_productos_proveedores1_idx` (`proveedores_idProveedores`);

--
-- Indices de la tabla `recepcionista`
--
ALTER TABLE `recepcionista`
  ADD PRIMARY KEY (`idUsuarios`);

--
-- Indices de la tabla `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`idServicios`);

--
-- Indices de la tabla `telefonos`
--
ALTER TABLE `telefonos`
  ADD PRIMARY KEY (`idTelefonos`),
  ADD KEY `fk_telefonos_codigoArea1_idx` (`codigoArea_idCodigoArea`);

--
-- Indices de la tabla `telefonos_proveedores`
--
ALTER TABLE `telefonos_proveedores`
  ADD PRIMARY KEY (`telefonos_idTelefonos`,`proveedores_idProveedores`),
  ADD KEY `fk_telefonos_has_proveedores_proveedores1_idx` (`proveedores_idProveedores`),
  ADD KEY `fk_telefonos_has_proveedores_telefonos1_idx` (`telefonos_idTelefonos`);

--
-- Indices de la tabla `telefonos_usuarios`
--
ALTER TABLE `telefonos_usuarios`
  ADD PRIMARY KEY (`telefonos_idTelefonos`,`usuarios_idUsuarios`),
  ADD KEY `fk_telefonos_has_usuarios_usuarios1_idx` (`usuarios_idUsuarios`),
  ADD KEY `fk_telefonos_has_usuarios_telefonos1_idx` (`telefonos_idTelefonos`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`idUsuarios`),
  ADD UNIQUE KEY `nombreUsuario_UNIQUE` (`nombreUsuario`),
  ADD UNIQUE KEY `correo_UNIQUE` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `idCitas` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `idUsuarios` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `codigoarea`
--
ALTER TABLE `codigoarea`
  MODIFY `idCodigoArea` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comisiones_pagadas`
--
ALTER TABLE `comisiones_pagadas`
  MODIFY `idComision` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  MODIFY `idEspecialidades` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_cita`
--
ALTER TABLE `estado_cita`
  MODIFY `idEstado` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estilistas`
--
ALTER TABLE `estilistas`
  MODIFY `idUsuarios` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gerente`
--
ALTER TABLE `gerente`
  MODIFY `idUsuarios` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `medios_pago`
--
ALTER TABLE `medios_pago`
  MODIFY `idMedios_pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `movimiento_interno`
--
ALTER TABLE `movimiento_interno`
  MODIFY `idMovimiento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `idPagos` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos_servicios`
--
ALTER TABLE `pagos_servicios`
  MODIFY `idPagos_servicios` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `idProductos` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `idProveedores` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recepcionista`
--
ALTER TABLE `recepcionista`
  MODIFY `idUsuarios` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `services`
--
ALTER TABLE `services`
  MODIFY `idServicios` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `telefonos`
--
ALTER TABLE `telefonos`
  MODIFY `idTelefonos` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `idUsuarios` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `fk_citas_clientes1` FOREIGN KEY (`clientes`) REFERENCES `clientes` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_citas_estado_cita1` FOREIGN KEY (`estado_cita_idEstado`) REFERENCES `estado_cita` (`idEstado`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_citas_estilistas1` FOREIGN KEY (`estilistas`) REFERENCES `estilistas` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `citas_servicios`
--
ALTER TABLE `citas_servicios`
  ADD CONSTRAINT `fk_citas_has_servicios_citas1` FOREIGN KEY (`citas_idCitas`) REFERENCES `citas` (`idCitas`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_citas_has_servicios_servicios1` FOREIGN KEY (`servicios_idServicios`) REFERENCES `services` (`idServicios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_clientes_usuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `comisiones_pagadas`
--
ALTER TABLE `comisiones_pagadas`
  ADD CONSTRAINT `fk_comisiones_pagadas_estilistas1` FOREIGN KEY (`estilistas_idUsuarios`) REFERENCES `estilistas` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_comisiones_pagadas_pagos1` FOREIGN KEY (`pagos_idPagos`) REFERENCES `pagos` (`idPagos`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `estilistas`
--
ALTER TABLE `estilistas`
  ADD CONSTRAINT `fk_estilistas_usuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `estilistas_especialidades`
--
ALTER TABLE `estilistas_especialidades`
  ADD CONSTRAINT `fk_estilistas_has_especialidades_especialidades1` FOREIGN KEY (`especialidades_idEspecialidades`) REFERENCES `especialidades` (`idEspecialidades`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_estilistas_has_especialidades_estilistas1` FOREIGN KEY (`estilistas_idUsuarios`) REFERENCES `estilistas` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `estilistas_servicios`
--
ALTER TABLE `estilistas_servicios`
  ADD CONSTRAINT `fk_estilistas_has_servicios_estilistas1` FOREIGN KEY (`idUsuarios`) REFERENCES `estilistas` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_estilistas_has_servicios_servicios1` FOREIGN KEY (`idServicios`) REFERENCES `services` (`idServicios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `gerente`
--
ALTER TABLE `gerente`
  ADD CONSTRAINT `fk_gerente_usuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `movimiento_interno`
--
ALTER TABLE `movimiento_interno`
  ADD CONSTRAINT `fk_movimiento_interno_productos1` FOREIGN KEY (`productos_idProductos`) REFERENCES `productos` (`idProductos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_movimiento_interno_proveedores1` FOREIGN KEY (`proveedores_idProveedores`) REFERENCES `proveedores` (`idProveedores`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_movimiento_interno_usuarios1` FOREIGN KEY (`usuarios_idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `fk_pagos_citas1` FOREIGN KEY (`citas_idCitas`) REFERENCES `citas` (`idCitas`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_pagos_clientes1` FOREIGN KEY (`clientes_idUsuarios`) REFERENCES `clientes` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_pagos_medios_pago1` FOREIGN KEY (`medios_pago_idMedios_pago`) REFERENCES `medios_pago` (`idMedios_pago`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `pagos_productos`
--
ALTER TABLE `pagos_productos`
  ADD CONSTRAINT `fk_pagos_has_productos_pagos1` FOREIGN KEY (`pagos_idPagos`) REFERENCES `pagos` (`idPagos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_pagos_productos_productos1` FOREIGN KEY (`productos_idProductos`) REFERENCES `productos` (`idProductos`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `pagos_servicios`
--
ALTER TABLE `pagos_servicios`
  ADD CONSTRAINT `fk_pagos_servicios_pagos1` FOREIGN KEY (`pagos_idPagos`) REFERENCES `pagos` (`idPagos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_pagos_servicios_servicios1` FOREIGN KEY (`servicios_idServicios`) REFERENCES `services` (`idServicios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `proveedores_productos`
--
ALTER TABLE `proveedores_productos`
  ADD CONSTRAINT `fk_proveedores_has_productos_productos1` FOREIGN KEY (`productos_idProductos`) REFERENCES `productos` (`idProductos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_proveedores_has_productos_proveedores1` FOREIGN KEY (`proveedores_idProveedores`) REFERENCES `proveedores` (`idProveedores`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `recepcionista`
--
ALTER TABLE `recepcionista`
  ADD CONSTRAINT `fk_recepcionista_usuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `telefonos`
--
ALTER TABLE `telefonos`
  ADD CONSTRAINT `fk_telefonos_codigoArea1` FOREIGN KEY (`codigoArea_idCodigoArea`) REFERENCES `codigoarea` (`idCodigoArea`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `telefonos_proveedores`
--
ALTER TABLE `telefonos_proveedores`
  ADD CONSTRAINT `fk_telefonos_has_proveedores_proveedores1` FOREIGN KEY (`proveedores_idProveedores`) REFERENCES `proveedores` (`idProveedores`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_telefonos_has_proveedores_telefonos1` FOREIGN KEY (`telefonos_idTelefonos`) REFERENCES `telefonos` (`idTelefonos`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `telefonos_usuarios`
--
ALTER TABLE `telefonos_usuarios`
  ADD CONSTRAINT `fk_telefonos_has_usuarios_telefonos1` FOREIGN KEY (`telefonos_idTelefonos`) REFERENCES `telefonos` (`idTelefonos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_telefonos_has_usuarios_usuarios1` FOREIGN KEY (`usuarios_idUsuarios`) REFERENCES `usuarios` (`idUsuarios`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
