import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api, { accion } from './api';
import { esRespuestaValida } from './manejoErrores';

// Pago de citas y pedidos: con Mercado Pago (Checkout Pro) o eligiendo pagar en el local.
//
// El checkout se abre en el navegador del sistema (Custom Tabs en Android): Mercado Pago
// no permite WebView. Al terminar, MP redirige a retorno_pago.php (HTTPS, en ngrok), que
// intenta volver a la app con la URL de Linking.createURL (exp://... en Expo Go).
// La vuelta es "best effort": el estado real lo registra el webhook en el servidor, y la
// app siempre lo consulta con get_estado_pago_cita después de cerrar el navegador.

// Estados de Mercado Pago en los que el pago todavía se puede acreditar.
export const ESTADOS_EN_PROCESO = ['pending', 'in_process', 'authorized'];

const validar = (response) => {
  if (!esRespuestaValida(response.data)) {
    throw new Error('Respuesta inválida del servidor');
  }
  if (!response.data.success) {
    throw new Error(response.data.message || 'No se pudo completar la operación.');
  }
  return response.data.data;
};

// { idCitas, total, pagado, saldo, pagada, ultimoPagoMp: { estado, statusDetail, ... } | null }
export const consultarEstadoPago = async (idCitas) =>
  validar(await api.get(`${accion('get_estado_pago_cita')}&idCitas=${idCitas}`));

// Crea la preferencia en el servidor. Devuelve { idPagoMp, initPoint, monto }.
export const crearLinkPago = async (idCitas, urlRetorno = '') =>
  validar(await api.post(accion('crear_preferencia_cita'), { idCitas, urlRetorno }));

// Lo mismo para pedidos de productos (solo el cliente). El estado tiene el mismo formato,
// con idPedido en lugar de idCitas.
export const consultarEstadoPagoPedido = async (idPedido) =>
  validar(await api.get(`${accion('get_estado_pago_pedido')}&idPedido=${idPedido}`));

export const crearLinkPagoPedido = async (idPedido, urlRetorno = '') =>
  validar(await api.post(accion('crear_preferencia_pedido'), { idPedido, urlRetorno }));

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sigueSinResolverse = (estado) =>
  !estado.pagada && ['creada', ...ESTADOS_EN_PROCESO].includes(estado.ultimoPagoMp?.estado);

// Abre el checkout y, al volver, devuelve el estado del pago.
// Si el navegador volvió a la app por la URL de retorno (el pago terminó), reconsulta
// unas veces mientras el webhook llega; si el usuario lo cerró, consulta una sola vez.
const pagarConMercadoPago = async (crearLink, consultar, { intentos = 5, intervaloMs = 3000 } = {}) => {
  const urlRetorno = Linking.createURL('pago');
  const { initPoint } = await crearLink(urlRetorno);

  const resultado = await WebBrowser.openAuthSessionAsync(initPoint, urlRetorno);

  const maxIntentos = resultado?.type === 'success' ? intentos : 1;
  let estado = await consultar();
  for (let i = 1; i < maxIntentos && sigueSinResolverse(estado); i++) {
    await esperar(intervaloMs);
    estado = await consultar();
  }
  return estado;
};

export const pagarCita = (idCitas, opciones) =>
  pagarConMercadoPago(
    (urlRetorno) => crearLinkPago(idCitas, urlRetorno),
    () => consultarEstadoPago(idCitas),
    opciones
  );

export const pagarPedido = (idPedido, opciones) =>
  pagarConMercadoPago(
    (urlRetorno) => crearLinkPagoPedido(idPedido, urlRetorno),
    () => consultarEstadoPagoPedido(idPedido),
    opciones
  );

// Pago en el local. tipo: 'cita' | 'pedido'. idMedios_pago: Efectivo o Transferencia
// (de obtenerPagosPendientes().mediosLocal), o null para quitar la elección.
// Devuelve { message, data: { idMedios_pago, medioPago } | null }.
export const elegirPagoLocal = async (tipo, id, idMedios_pago) => {
  const response = await api.post(accion('elegir_pago_local'), { tipo, id, idMedios_pago });
  validar(response);
  return response.data;
};

// { mediosLocal: [{ idMedios_pago, medioPago }], citas: [...], pedidos: [...] }: lo que el
// cliente tiene sin pagar, cada uno con medioPagoLocal (null si no eligió pagar en el local).
export const obtenerPagosPendientes = async () => validar(await api.get(accion('get_pagos_pendientes')));

// Cómo se abona en el local con cada medio (para el resumen que ve el cliente).
export const INSTRUCCIONES_PAGO_LOCAL = {
  Efectivo: 'Abonás en efectivo en el mostrador al llegar a tu cita o al retirar tu pedido.',
  Transferencia:
    'Transferís desde tu celular en el mostrador, al llegar a tu cita o al retirar tu pedido: en recepción te dan los datos de la cuenta del salón.',
};

// Separa lo pendiente que el cliente eligió pagar en el local, agrupado por medio.
// Devuelve [{ medioPago, items: [{ tipo, id, ...item }], total }], en el orden de mediosLocal.
export const agruparPagoLocal = (pendientes) => {
  if (!pendientes) {
    return [];
  }
  const items = [
    ...(pendientes.citas || []).map((c) => ({ ...c, tipo: 'cita', id: c.idCitas })),
    ...(pendientes.pedidos || []).map((p) => ({ ...p, tipo: 'pedido', id: p.idPedido })),
  ].filter((item) => item.medioPagoLocal && item.saldo > 0);

  const orden = (pendientes.mediosLocal || []).map((m) => m.medioPago);
  const grupos = {};
  items.forEach((item) => {
    if (!grupos[item.medioPagoLocal]) {
      grupos[item.medioPagoLocal] = { medioPago: item.medioPagoLocal, items: [], total: 0 };
    }
    grupos[item.medioPagoLocal].items.push(item);
    grupos[item.medioPagoLocal].total += item.saldo;
  });
  return Object.values(grupos).sort((a, b) => orden.indexOf(a.medioPago) - orden.indexOf(b.medioPago));
};

export const formatearMonto = (monto) =>
  `$${Number(monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Texto para mostrarle al usuario según el estado del cobro.
export const describirEstadoPago = (estado) => {
  if (!estado) {
    return null;
  }
  if (estado.pagada) {
    return { tipo: 'ok', texto: 'Pago acreditado. ¡Gracias!' };
  }
  const ultimo = estado.ultimoPagoMp?.estado;
  if (ESTADOS_EN_PROCESO.includes(ultimo)) {
    return { tipo: 'pendiente', texto: 'Tu pago se está procesando. Te lo confirmamos en unos minutos.' };
  }
  if (ultimo === 'rejected') {
    return { tipo: 'error', texto: 'Mercado Pago rechazó el pago. Podés intentar con otro medio.' };
  }
  if (ultimo === 'cancelled') {
    return { tipo: 'error', texto: 'El pago se canceló.' };
  }
  if (ultimo === 'refunded' || ultimo === 'charged_back') {
    return { tipo: 'error', texto: 'El pago fue devuelto.' };
  }
  return { tipo: 'info', texto: 'No se registró ningún pago.' };
};
