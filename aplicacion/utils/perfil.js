import api, { accion } from './api';
import { esRespuestaValida } from './manejoErrores';
import { formatearFechaCorta } from './fechas';

// Lógica de la pantalla "Mi Perfil" (screens/MiPerfil.js), separada de la UI.
// Cada rol define cómo carga y guarda sus datos y qué resumen muestra.

export const ROL_CLIENTE = 1;
export const ROL_ESTILISTA = 2;
export const ROL_RECEPCIONISTA = 3;

// 'Fabricio Segovia' → 'FS'. Sin nombre, un punto medio (el avatar nunca queda vacío).
export const iniciales = (nombres = '', apellido = '') => {
  const primera = (texto) => (texto || '').trim().charAt(0).toUpperCase();
  return `${primera(nombres)}${primera(apellido)}` || '·';
};

// '20001231' → '2000-12-31' mientras se escribe.
export const formatearFechaInput = (texto) => {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  if (numeros.length <= 4) {
    return numeros;
  }
  if (numeros.length <= 6) {
    return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
  }
  return `${numeros.slice(0, 4)}-${numeros.slice(4, 6)}-${numeros.slice(6)}`;
};

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devuelve { campo: mensaje } con los errores (vacío si está todo bien).
// El servidor vuelve a validar: esto es solo para avisar antes de enviar.
export const validarDatosPerfil = (datos) => {
  const errores = {};
  if (!datos.nombres?.trim()) {
    errores.nombres = 'Ingresá tu nombre.';
  }
  if (!datos.apellido?.trim()) {
    errores.apellido = 'Ingresá tu apellido.';
  }
  if (!datos.correo?.trim()) {
    errores.correo = 'Ingresá tu correo.';
  } else if (!CORREO_VALIDO.test(datos.correo.trim())) {
    errores.correo = 'El correo no es válido.';
  }
  if (datos.fechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaNacimiento)) {
    errores.fechaNacimiento = 'Usá el formato AAAA-MM-DD o dejalo vacío.';
  }
  return errores;
};

export const validarContrasenas = (actual, nueva) => {
  const errores = {};
  if (!actual) {
    errores.actual = 'Ingresá tu contraseña actual.';
  }
  if (!nueva) {
    errores.nueva = 'Ingresá la nueva contraseña.';
  } else if (nueva.length < 6) {
    errores.nueva = 'Tiene que tener al menos 6 caracteres.';
  } else if (nueva === actual) {
    errores.nueva = 'Tiene que ser distinta de la actual.';
  }
  return errores;
};

// ── Resúmenes ───────────────────────────────────────────────────────────────
// Cada resumen es { destacada, metricas }:
//   destacada: { etiqueta, titulo, detalle, destino } o null si no hay nada que destacar
//   metricas:  [{ clave, etiqueta, valor, icono, destino }]
// `destino` es el nombre de la pantalla del drawer a la que lleva el toque.

const ESTADO_ACTIVA = 1;
const ESTADO_CANCELADA = 2;
const ESTADO_FINALIZADA = 3;
const ESTADO_EN_CURSO = 4;

const fechaHora = (cita) => `${formatearFechaCorta(cita.fecha)} · ${cita.hora} h`;

export const resumenCliente = (citas = [], pedidos = []) => {
  const proximas = citas
    .filter((c) => Number(c.proxima) === 1)
    .sort((a, b) => Number(a.fechaHoraTs) - Number(b.fechaHoraTs));
  const proxima = proximas[0];

  return {
    destacada: proxima
      ? {
          etiqueta: Number(proxima.idEstado) === ESTADO_EN_CURSO ? 'En curso' : 'Próxima cita',
          titulo: fechaHora(proxima),
          detalle: [proxima.servicios, proxima.estilista && `con ${proxima.estilista}`].filter(Boolean).join(' · '),
          destino: 'Mis Citas',
        }
      : null,
    vacio: proxima ? null : { mensaje: 'No tenés citas próximas.', accion: 'Reservar', destino: 'Reservar Cita' },
    metricas: [
      {
        clave: 'pedidos',
        etiqueta: 'Pedidos activos',
        valor: pedidos.filter((p) => p.estado === 'pendiente').length,
        icono: 'bag-handle-outline',
        destino: 'Mis Pedidos',
      },
      {
        clave: 'realizadas',
        etiqueta: 'Visitas realizadas',
        valor: citas.filter((c) => Number(c.idEstado) === ESTADO_FINALIZADA).length,
        icono: 'sparkles-outline',
        destino: 'Mis Citas',
      },
    ],
  };
};

export const resumenEstilista = (citasHoy = []) => {
  const vigentes = citasHoy.filter((c) => Number(c.idEstado) !== ESTADO_CANCELADA);
  const siguiente =
    vigentes.find((c) => Number(c.idEstado) === ESTADO_EN_CURSO) ||
    vigentes.find((c) => Number(c.idEstado) === ESTADO_ACTIVA);

  return {
    destacada: siguiente
      ? {
          etiqueta: Number(siguiente.idEstado) === ESTADO_EN_CURSO ? 'En curso' : 'Siguiente cita',
          titulo: `Hoy · ${siguiente.hora} h`,
          detalle: [`${siguiente.nombres || ''} ${siguiente.apellido || ''}`.trim(), siguiente.servicios]
            .filter(Boolean)
            .join(' · '),
          destino: 'Inicio',
        }
      : null,
    vacio: siguiente ? null : { mensaje: 'No te quedan citas para hoy.', accion: 'Ver agenda', destino: 'Agenda Semanal' },
    metricas: [
      {
        clave: 'hoy',
        etiqueta: 'Citas hoy',
        valor: vigentes.length,
        icono: 'calendar-outline',
        destino: 'Inicio',
      },
      {
        clave: 'finalizadas',
        etiqueta: 'Finalizadas',
        valor: vigentes.filter((c) => Number(c.idEstado) === ESTADO_FINALIZADA).length,
        icono: 'checkmark-done-outline',
        destino: 'Inicio',
      },
    ],
  };
};

export const resumenRecepcion = (citasHoy = [], pedidosPendientes = []) => {
  const vigentes = citasHoy.filter((c) => Number(c.idEstado) !== ESTADO_CANCELADA);
  return {
    destacada: null,
    vacio: null,
    metricas: [
      {
        clave: 'hoy',
        etiqueta: 'Citas hoy',
        valor: vigentes.length,
        icono: 'calendar-outline',
        destino: 'Inicio',
      },
      {
        clave: 'cobrar',
        etiqueta: 'Por cobrar',
        valor: vigentes.filter((c) => Number(c.total) > 0 && !c.pagada).length,
        icono: 'wallet-outline',
        destino: 'Inicio',
      },
      {
        clave: 'pedidos',
        etiqueta: 'Pedidos',
        valor: pedidosPendientes.length,
        icono: 'bag-handle-outline',
        destino: 'Pedidos',
      },
    ],
  };
};

// ── Acceso a la API por rol ─────────────────────────────────────────────────

const leerDatos = (response) => {
  if (!esRespuestaValida(response.data)) {
    throw new Error('Respuesta inválida del servidor');
  }
  if (!response.data.success) {
    throw new Error(response.data.message || 'No se pudieron cargar los datos.');
  }
  return response.data.data;
};

// Para el resumen: si falla, la pantalla igual muestra el perfil (lista vacía).
const listaOVacia = async (promesa) => {
  try {
    const datos = leerDatos(await promesa);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.log('Resumen de perfil:', error.message);
    return null;
  }
};

const DATOS_BASE = ['nombres', 'apellido', 'correo', 'fechaNacimiento'];
const NOTAS_CLIENTE = ['notaAlergias', 'notaPreferencias'];

const elegir = (origen, claves) =>
  claves.reduce((acc, clave) => ({ ...acc, [clave]: origen?.[clave] || '' }), {});

const limpiar = (datos) => ({
  ...datos,
  nombres: datos.nombres.trim(),
  apellido: datos.apellido.trim(),
  correo: datos.correo.trim(),
});

export const CONFIG_PERFIL = {
  [ROL_CLIENTE]: {
    nombreRol: 'Cliente',
    icono: 'person-outline',
    claves: [...DATOS_BASE, ...NOTAS_CLIENTE],
    tieneNotas: true,
    cargar: async (sesion) =>
      leerDatos(await api.get(`${accion('get_clientes')}&id=${sesion.idUsuarios}`)),
    guardar: async (_sesion, datos) => api.post(accion('update_cliente'), limpiar(datos)),
    resumen: async (sesion) => {
      const [citas, pedidos] = await Promise.all([
        listaOVacia(api.get(`${accion('get_citas_cliente')}&idClientes=${sesion.idUsuarios}`)),
        listaOVacia(api.get(`${accion('get_pedidos_cliente')}&idClientes=${sesion.idUsuarios}`)),
      ]);
      return citas === null && pedidos === null ? null : resumenCliente(citas || [], pedidos || []);
    },
  },
  [ROL_ESTILISTA]: {
    nombreRol: 'Estilista',
    icono: 'cut-outline',
    claves: DATOS_BASE,
    tieneNotas: false,
    cargar: async (sesion) =>
      leerDatos(await api.get(`${accion('get_estilista')}&id=${sesion.idUsuarios}`)),
    guardar: async (_sesion, datos) => api.post(accion('update_estilista'), limpiar(datos)),
    resumen: async (sesion) => {
      const id = sesion.idEstilistas || sesion.idUsuarios;
      const citas = await listaOVacia(api.get(`${accion('get_citasDiarias')}&id_estilistas=${id}`));
      return citas === null ? null : resumenEstilista(citas);
    },
  },
  [ROL_RECEPCIONISTA]: {
    nombreRol: 'Recepción',
    icono: 'briefcase-outline',
    claves: DATOS_BASE,
    tieneNotas: false,
    cargar: async (sesion) =>
      leerDatos(await api.get(`${accion('get_perfil_recepcionista')}&id=${sesion.idUsuarios}`)),
    // update_perfil_recepcionista todavía identifica al usuario por el body (ver PENDIENTES.md).
    guardar: async (sesion, datos) =>
      api.post(accion('update_perfil_recepcionista'), { idUsuarios: sesion.idUsuarios, ...limpiar(datos) }),
    resumen: async () => {
      const [citas, pedidos] = await Promise.all([
        listaOVacia(api.get(accion('get_citas_dia'))),
        listaOVacia(api.get(`${accion('get_pedidos_salon')}&vista=pendientes`)),
      ]);
      return citas === null && pedidos === null ? null : resumenRecepcion(citas || [], pedidos || []);
    },
  },
};

export const configPerfil = (idRol) => CONFIG_PERFIL[Number(idRol)] || CONFIG_PERFIL[ROL_CLIENTE];

export const datosDesdeRespuesta = (config, origen) => elegir(origen, config.claves);

// update_contrasena toma el usuario de la sesión.
export const cambiarContrasena = async (contrasenaActual, nuevaContrasena) =>
  api.post(accion('update_contrasena'), { contrasenaActual, nuevaContrasena });
