-- Productos para la tienda de la app (etapa 1).
-- La tabla `productos` de mydb no tiene descripción ni imagen, y sus columnas
-- clave admiten NULL. Como hoy está vacía, se pueden endurecer sin riesgo.
--
-- NO se ejecuta automáticamente: revisarlo y correrlo en phpMyAdmin (pestaña SQL,
-- base mydb) ANTES de importar api_proyecto/sql/productos_ejemplo.sql.

ALTER TABLE `productos`
  -- Nombre más largo (45 queda corto para "Shampoo Reparador Keratina 500 ml").
  MODIFY `nombreProducto` varchar(100) NOT NULL,
  -- Nuevas: texto para el cliente e imagen (URL, igual que services.imagenUrl).
  ADD COLUMN `descripcion` varchar(255) DEFAULT NULL AFTER `marca`,
  ADD COLUMN `imagenUrl` text DEFAULT NULL AFTER `descripcion`,
  -- El backend valida el stock del pedido: no puede ser NULL ni negativo.
  MODIFY `stock` int(11) NOT NULL DEFAULT 0,
  ADD CONSTRAINT `chk_productos_stock` CHECK (`stock` >= 0),
  -- El precio lo toma siempre el backend de acá: tiene que existir y ser positivo.
  MODIFY `precioVenta` decimal(10,2) NOT NULL,
  ADD CONSTRAINT `chk_productos_precio` CHECK (`precioVenta` > 0),
  -- 1 = activo (se muestra en la app), 0 = inactivo. Mismo criterio que proveedores/medios_pago.
  MODIFY `estado` tinyint(1) NOT NULL DEFAULT 1;
