// Utilidades para fechas 'AAAA-MM-DD' como las devuelve el servidor.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const pad = (n) => n.toString().padStart(2, '0');

// Se usa el mediodía para que un cambio de horario no mueva la fecha de día.
const aDate = (fechaIso) => {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return new Date(anio, mes - 1, dia, 12);
};

const aIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// '2026-11-12' → 'jueves 12 de noviembre'
export const formatearFecha = (fechaIso) => {
  if (!fechaIso) {
    return '';
  }
  const fecha = aDate(fechaIso);
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
};

// '2026-11-09' → '9 nov'
export const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) {
    return '';
  }
  const fecha = aDate(fechaIso);
  return `${fecha.getDate()} ${MESES[fecha.getMonth()].substring(0, 3)}`;
};

// IMPORTANTE: para MOSTRAR fechas y horas de citas usar los campos `fecha`
// ('AAAA-MM-DD') y `hora` ('HH:MM') que formatea el servidor en hora del salón.
// No convertir `fechaHoraTs` con new Date(): usa la zona horaria del dispositivo
// (un emulador en GMT muestra +3 h).

// 'AAAA-MM-DD' + 'HH:MM' → Date con esa fecha y hora "de reloj" en el dispositivo
// (para inicializar el selector de fecha y hora).
export const dateDesdeFechaHora = (fechaIso, hora) => {
  const fecha = aDate(fechaIso);
  const [h, m] = hora.split(':').map(Number);
  fecha.setHours(h, m, 0, 0);
  return fecha;
};

// Date (fecha y hora "de reloj" elegidas en el selector) → 'AAAA-MM-DD'.
export const isoDesdeDate = (date) => aIso(date);

// Date → 'HH:MM'.
export const horaDesdeDate = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// sumarDias('2026-11-12', 7) → '2026-11-19'
export const sumarDias = (fechaIso, dias) => {
  const fecha = aDate(fechaIso);
  fecha.setDate(fecha.getDate() + dias);
  return aIso(fecha);
};
