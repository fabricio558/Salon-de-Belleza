-- Duración de cada servicio, para calcular cuánto ocupa una cita y no permitir
-- reservar o reprogramar en un horario superpuesto con otra cita del mismo estilista.
-- Duración de una cita = SUM(citas_servicios.cantidad * services.duracionMinutos).
--
-- Todos los servicios quedan en 60 minutos: cargar los valores reales con UPDATE.
-- Aplicar sobre mydb:  mysql -u root mydb < api_proyecto/migraciones/001_duracion_servicios.sql

ALTER TABLE `services`
  ADD COLUMN `duracionMinutos` int(11) NOT NULL DEFAULT 60
    CHECK (`duracionMinutos` > 0)
  AFTER `precio`;
