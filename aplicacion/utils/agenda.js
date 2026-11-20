import api, { accion } from './api';
import { esRespuestaValida } from './manejoErrores';
import { sumarDias } from './fechas';

// Agenda de disponibilidad de un estilista para reservar (get_disponibilidad).
// El servidor calcula todo (horario del local, duración de los servicios y choques)
// con las mismas reglas que crear_cita; acá solo se pide y se formatea.

const DIAS_CORTOS = ['', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']; // 1 = lunes (DateTime 'N')
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const DIAS_POR_PAGINA = 7;

// [{ idServicios: 3, cantidad: 2 }, ...] → '3:2,...'
export const parametroServicios = (servicios = []) =>
  servicios.map((s) => `${s.idServicios}:${s.cantidad || 1}`).join(',');

export const obtenerDisponibilidad = async (idEstilistas, servicios, desde) => {
  let url = `${accion('get_disponibilidad')}&idEstilistas=${idEstilistas}`;
  const textoServicios = parametroServicios(servicios);
  if (textoServicios) {
    url += `&servicios=${encodeURIComponent(textoServicios)}`;
  }
  if (desde) {
    url += `&desde=${desde}`;
  }
  const response = await api.get(url);
  if (!esRespuestaValida(response.data)) {
    throw new Error('Respuesta inválida del servidor');
  }
  if (!response.data.success) {
    throw new Error(response.data.message || 'No se pudo cargar la agenda.');
  }
  return response.data.data;
};

// '2026-11-20' → { dia: 'VIE', numero: 20, mes: 'nov' }
export const partesDia = (fecha, diaSemana) => {
  const [, mes, dia] = fecha.split('-').map(Number);
  return { dia: DIAS_CORTOS[diaSemana] || '', numero: dia, mes: MESES_CORTOS[mes - 1] };
};

// Rango visible: '20 – 26 nov' o '28 nov – 4 dic'.
export const rangoDias = (dias = []) => {
  if (dias.length === 0) {
    return '';
  }
  const primero = partesDia(dias[0].fecha, dias[0].diaSemana);
  const ultimo = partesDia(dias[dias.length - 1].fecha, dias[dias.length - 1].diaSemana);
  return primero.mes === ultimo.mes
    ? `${primero.numero} – ${ultimo.numero} ${ultimo.mes}`
    : `${primero.numero} ${primero.mes} – ${ultimo.numero} ${ultimo.mes}`;
};

// 90 → '1 h 30 min'
export const formatearDuracion = (minutos) => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) {
    return `${m} min`;
  }
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

// Texto corto bajo cada día del selector.
export const estadoDia = (dia) => {
  if (!dia.abierto) {
    return 'Cerrado';
  }
  if (dia.horarios.length === 0) {
    return 'Sin horarios';
  }
  if (dia.libres === 0) {
    return 'Completo';
  }
  return `${dia.libres} libres`;
};

// Primer día con lugar (para abrir la agenda ahí y no en un día cerrado o lleno).
export const primerDiaConLugar = (dias = []) => (dias.find((d) => d.libres > 0) || dias[0] || null)?.fecha ?? null;

export const paginaSiguiente = (desde) => sumarDias(desde, DIAS_POR_PAGINA);
export const paginaAnterior = (desde, hoy) => {
  const anterior = sumarDias(desde, -DIAS_POR_PAGINA);
  return anterior < hoy ? hoy : anterior;
};
