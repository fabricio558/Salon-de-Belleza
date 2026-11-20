-- Imágenes de los productos de ejemplo.
--
-- Completa `productos.imagenUrl` (agregada en la migración 003), que en los datos de
-- ejemplo quedó en NULL. La app ya muestra esta imagen en Productos y en Mi Carrito;
-- sin ella usa un ícono genérico.
--
-- NO se ejecuta automáticamente: correrlo en phpMyAdmin (pestaña SQL, base mydb),
-- con juego de caracteres utf-8. Se puede correr más de una vez.
--
-- Fotos de Unsplash bajo la Unsplash License (uso gratuito, también comercial, sin
-- atribución obligatoria). `w=600` las pide a 600 px de ancho, suficiente para la app.
-- Cuando haya fotos propias de los productos, reemplazar estas URLs.
--
-- Se busca por nombre (no por id) para que funcione aunque los ids sean otros.

SET NAMES utf8mb4;

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1744118343793-5b4edb8ef776?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Shampoo Reparador Keratina 500 ml';      -- frascos de shampoo y acondicionador

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1749856727296-481414df24e5?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Acondicionador Hidratante 500 ml';       -- shampoo y acondicionador en un estante

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1732861612244-5704d12e9397?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Máscara de Nutrición Profunda 250 g';    -- pote de máscara capilar

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1554519880-ffe46861d570?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Tintura Permanente Castaño Claro 5.0';   -- cabello castaño con reflejos

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1785456463151-623876d5b7af?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Tintura Permanente Rubio Ceniza 8.1';    -- cabello rubio en el salón

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Shampoo Matizador Violeta 300 ml';       -- cabello con matiz violeta

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1747303969063-3b90bcb3942e?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Aceite de Argán Sérum 60 ml';            -- sérum con gotero

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1632243575963-3143700087ed?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Protector Térmico en Spray 200 ml';      -- botella con atomizador

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Crema para Peinar Rulos Definidos 250 ml'; -- rulos definidos

UPDATE `productos` SET `imagenUrl` = 'https://images.unsplash.com/photo-1521207237524-f18b1e0bea3f?auto=format&fit=crop&w=600&q=80'
  WHERE `nombreProducto` = 'Ampollas Nutrición Intensa x6';          -- frascos y ampollas

-- Verificación: los 10 productos deberían tener imagen.
SELECT `idProductos`, `nombreProducto`, `imagenUrl` IS NOT NULL AS `tieneImagen` FROM `productos`;
