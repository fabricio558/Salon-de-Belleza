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
-- - imagenUrl: fotos de Unsplash (Unsplash License, uso libre). Reemplazarlas por
--   fotos propias cuando las haya. Si los productos ya están cargados, usar
--   productos_imagenes.sql para completar solo las imágenes.
-- - "Ampollas Nutrición Intensa" tiene stock 0 a propósito: sirve para probar que
--   get_productos solo devuelve productos con stock > 0.

SET NAMES utf8;

INSERT INTO `productos`
  (`nombreProducto`, `marca`, `descripcion`, `imagenUrl`, `stock`, `porcentajeGanancia`, `precioVenta`, `estado`)
VALUES
  ('Shampoo Reparador Keratina 500 ml', 'Mandala Pro',
   'Limpia sin resecar y repara el cabello dañado por alisados y decoloraciones.',
   'https://images.unsplash.com/photo-1744118343793-5b4edb8ef776?auto=format&fit=crop&w=600&q=80', 25, 45.00, 9500.00, 1),
  ('Acondicionador Hidratante 500 ml', 'Mandala Pro',
   'Desenreda y aporta suavidad y brillo. Ideal para uso diario.',
   'https://images.unsplash.com/photo-1749856727296-481414df24e5?auto=format&fit=crop&w=600&q=80', 20, 45.00, 9200.00, 1),
  ('Máscara de Nutrición Profunda 250 g', 'Mandala Pro',
   'Tratamiento intensivo semanal para cabellos secos o quebradizos.',
   'https://images.unsplash.com/photo-1732861612244-5704d12e9397?auto=format&fit=crop&w=600&q=80', 15, 50.00, 13500.00, 1),
  ('Tintura Permanente Castaño Claro 5.0', 'Color Studio',
   'Coloración en crema con cobertura total de canas. Incluye oxidante.',
   'https://images.unsplash.com/photo-1554519880-ffe46861d570?auto=format&fit=crop&w=600&q=80', 30, 40.00, 7800.00, 1),
  ('Tintura Permanente Rubio Ceniza 8.1', 'Color Studio',
   'Rubio frío de larga duración, con protección del color.',
   'https://images.unsplash.com/photo-1785456463151-623876d5b7af?auto=format&fit=crop&w=600&q=80', 18, 40.00, 7800.00, 1),
  ('Shampoo Matizador Violeta 300 ml', 'Color Studio',
   'Neutraliza tonos amarillos en cabellos rubios, platinados o con canas.',
   'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=600&q=80', 12, 50.00, 10400.00, 1),
  ('Aceite de Argán Sérum 60 ml', 'Bella Natura',
   'Sella puntas abiertas y controla el frizz sin dejar el cabello graso.',
   'https://images.unsplash.com/photo-1747303969063-3b90bcb3942e?auto=format&fit=crop&w=600&q=80', 22, 55.00, 11800.00, 1),
  ('Protector Térmico en Spray 200 ml', 'Bella Natura',
   'Protege del calor de planchita y secador hasta 230 °C.',
   'https://images.unsplash.com/photo-1632243575963-3143700087ed?auto=format&fit=crop&w=600&q=80', 16, 50.00, 8900.00, 1),
  ('Crema para Peinar Rulos Definidos 250 ml', 'Bella Natura',
   'Define y da forma a los rulos con efecto anti-frizz.',
   'https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=crop&w=600&q=80', 10, 45.00, 8600.00, 1),
  ('Ampollas Nutrición Intensa x6', 'Mandala Pro',
   'Tratamiento de choque de 6 aplicaciones para recuperar el cabello.',
   'https://images.unsplash.com/photo-1521207237524-f18b1e0bea3f?auto=format&fit=crop&w=600&q=80', 0, 50.00, 15900.00, 1);
