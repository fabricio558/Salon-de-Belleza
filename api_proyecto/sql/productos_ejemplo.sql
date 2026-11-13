-- Productos de ejemplo para la tienda de la app (etapa 1).
--
-- REQUISITO: aplicar antes api_proyecto/migraciones/003_productos_descripcion_imagen.sql
-- (agrega `descripcion` e `imagenUrl`). Sin esa migración este INSERT falla.
--
-- Importar en phpMyAdmin sobre la base mydb (pestaña Importar o SQL), con
-- juego de caracteres utf-8.
--
-- Notas:
-- - Las marcas son ficticias.
-- - precioVenta es el precio al público (lo que valida el backend).
-- - porcentajeGanancia es informativo (margen sobre el costo del proveedor).
-- - imagenUrl queda NULL: la app muestra una imagen genérica. Cargá URLs reales
--   cuando tengas las fotos de los productos.
-- - "Ampollas Nutrición Intensa" tiene stock 0 a propósito: sirve para probar que
--   get_productos solo devuelve productos con stock > 0.

SET NAMES utf8;

INSERT INTO `productos`
  (`nombreProducto`, `marca`, `descripcion`, `imagenUrl`, `stock`, `porcentajeGanancia`, `precioVenta`, `estado`)
VALUES
  ('Shampoo Reparador Keratina 500 ml', 'Mandala Pro',
   'Limpia sin resecar y repara el cabello dañado por alisados y decoloraciones.', NULL, 25, 45.00, 9500.00, 1),
  ('Acondicionador Hidratante 500 ml', 'Mandala Pro',
   'Desenreda y aporta suavidad y brillo. Ideal para uso diario.', NULL, 20, 45.00, 9200.00, 1),
  ('Máscara de Nutrición Profunda 250 g', 'Mandala Pro',
   'Tratamiento intensivo semanal para cabellos secos o quebradizos.', NULL, 15, 50.00, 13500.00, 1),
  ('Tintura Permanente Castaño Claro 5.0', 'Color Studio',
   'Coloración en crema con cobertura total de canas. Incluye oxidante.', NULL, 30, 40.00, 7800.00, 1),
  ('Tintura Permanente Rubio Ceniza 8.1', 'Color Studio',
   'Rubio frío de larga duración, con protección del color.', NULL, 18, 40.00, 7800.00, 1),
  ('Shampoo Matizador Violeta 300 ml', 'Color Studio',
   'Neutraliza tonos amarillos en cabellos rubios, platinados o con canas.', NULL, 12, 50.00, 10400.00, 1),
  ('Aceite de Argán Sérum 60 ml', 'Bella Natura',
   'Sella puntas abiertas y controla el frizz sin dejar el cabello graso.', NULL, 22, 55.00, 11800.00, 1),
  ('Protector Térmico en Spray 200 ml', 'Bella Natura',
   'Protege del calor de planchita y secador hasta 230 °C.', NULL, 16, 50.00, 8900.00, 1),
  ('Crema para Peinar Rulos Definidos 250 ml', 'Bella Natura',
   'Define y da forma a los rulos con efecto anti-frizz.', NULL, 10, 45.00, 8600.00, 1),
  ('Ampollas Nutrición Intensa x6', 'Mandala Pro',
   'Tratamiento de choque de 6 aplicaciones para recuperar el cabello.', NULL, 0, 50.00, 15900.00, 1);
