import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Sistema de diseño de SalonBelleza: monocromático, editorial y minimalista.
//
// Decisiones generales:
// - La marca es blanco y negro. El negro (#0A0A0A, no #000 puro, que en pantalla
//   se ve "duro") es el color de acción: botones, foco, selección.
// - Mucho blanco: el fondo de las pantallas es blanco puro y las tarjetas se
//   separan con un gris casi imperceptible y un borde fino, no con sombras fuertes.
// - El color solo aparece donde el gris no alcanza para comunicar: éxito, error,
//   advertencia y "En Curso". Son tonos desaturados para no romper la estética,
//   y siempre van acompañados de un ícono y un texto (nunca solo color).
// - El dorado es un ACENTO puntual (aros de avatar, indicadores activos, divisores
//   cortos, etiquetas chicas), nunca un fondo grande ni el color de la acción
//   principal, que sigue siendo el negro. Guía completa en theme/README.md.
// - Todo texto cumple WCAG AA (4.5:1). La tabla de contraste está en theme/README.md.
// ─────────────────────────────────────────────────────────────────────────────

// ── Colores ─────────────────────────────────────────────────────────────────
const gris = {
  negro: '#0A0A0A',
  grafito: '#2B2B2B',
  gris700: '#5C5C5C', // texto secundario: 6.7:1 sobre blanco
  gris500: '#757575', // texto deshabilitado
  gris400: '#8A8A8A', // borde de inputs: 3.4:1 sobre blanco (WCAG 1.4.11)
  gris300: '#BDBDBD',
  gris200: '#E0E0E0',
  gris150: '#E6E6E6', // bordes de tarjetas y separadores
  gris100: '#F2F2F2', // fondos tenues, ítem activo, presionado
  gris50: '#FAFAFA', // fondo de tarjetas
  blanco: '#FFFFFF',
};

// Dorado cálido y apagado (tipo latón envejecido / champagne), no amarillo metálico.
// Cada tono tiene un uso fijo según el fondo, para cumplir contraste:
const dorado = {
  dorado: '#A8854A', // acento gráfico sobre claro: aros, bordes, indicadores, íconos decorativos (3.4:1 ≥ 3:1)
  doradoTexto: '#7D5F28', // texto e íconos chicos sobre claro (5.9:1 blanco, 5.3:1 sobre doradoSuave)
  doradoClaro: '#CDB07A', // texto e íconos sobre negro o grafito (9.5:1 / 6.8:1)
  doradoLinea: '#E3CF9F', // divisores y filetes decorativos (no transmiten información)
  doradoSuave: '#F7F1E6', // fondo de badges y etiquetas doradas (solo superficies chicas)
};

export const colors = {
  // Nombres por función (los que pide la guía de marca)
  primary: gris.negro,
  primaryPressed: gris.grafito,
  background: gris.blanco,
  surface: gris.blanco,
  surfaceMuted: gris.gris50, // tarjetas
  surfaceSubtle: gris.gris100, // bloques secundarios, presionado
  border: gris.gris150,
  borderStrong: gris.gris400,
  textPrimary: gris.negro,
  textSecondary: gris.gris700,
  textOnPrimary: gris.blanco,
  disabled: gris.gris200,
  disabledText: gris.gris500, // los controles deshabilitados están exentos de WCAG

  // Acento dorado (ver arriba).
  gold: dorado.dorado,
  goldText: dorado.doradoTexto,
  goldOnDark: dorado.doradoClaro,
  goldLine: dorado.doradoLinea,
  goldSoft: dorado.doradoSuave,

  // Estados: desaturados, siempre con su versión "Soft" para fondos de badge.
  success: '#3E5C45',
  successSoft: '#EDF2EE',
  error: '#8C3A36',
  errorSoft: '#F6ECEB',
  // Terracota (antes ocre #7A5B1E): el ocre se confundía con el dorado de acento,
  // y un "Pendiente" no tiene que parecer un detalle de marca.
  warning: '#8A4A1C',
  warningSoft: '#F8ECE3',
  enCurso: '#2F4A5F', // azul pizarra: el único "frío", para el timer de servicio
  enCursoSoft: '#E9EFF3',

  overlay: 'rgba(10, 10, 10, 0.55)',
  shadow: '#000000',

  // ── Alias de compatibilidad ──
  // Las pantallas ya migradas usan estos nombres. Apuntan a la paleta nueva para
  // que toda la app cambie de estilo desde este archivo. En código nuevo, usar
  // los nombres de arriba.
  primaryDark: gris.grafito,
  primaryStrong: gris.negro,
  primaryText: gris.negro,
  primarySoft: gris.gris100,
  primaryDisabled: gris.gris200,
  accent: gris.gris100,
  accentSoft: gris.gris200,
  header: gris.blanco,
  headerAlt: gris.gris100,
  surfaceWarm: gris.blanco, // inputs
  surfaceAlt: gris.gris100,
  text: gris.grafito,
  textStrong: gris.negro,
  textMuted: gris.gris700,
  textSubtle: gris.gris500,
  white: gris.blanco,
  danger: '#8C3A36',
  dangerSoft: '#F6ECEB',
  info: '#2F4A5F',
  infoSoft: '#E9EFF3',
};

// ── Espaciado ───────────────────────────────────────────────────────────────
// Escala 4-8-12-16-24-32-48. Los atajos de layout fijan la consistencia:
// mismos márgenes laterales y la misma separación en todas las pantallas.
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  pantalla: 24, // margen lateral generoso: más blanco, look editorial
  seccion: 32,
  entreTarjetas: 12,
  toqueMinimo: 44,
};

// ── Tipografía ──────────────────────────────────────────────────────────────
// Playfair Display (serif de alto contraste, típica de revistas de moda) para
// títulos, y Poppins (sans geométrica y limpia) para el cuerpo. Se cargan con
// expo-font en prueba.js; si fallan, cae en la fuente del sistema.
//
// Con fuentes personalizadas el peso lo da la familia (Poppins_600SemiBold), no
// fontWeight: en Android combinarlos hace que se ignore la familia.
export const fuentes = {
  titulo: 'PlayfairDisplay_600SemiBold',
  tituloBold: 'PlayfairDisplay_700Bold',
  cuerpo: 'Poppins_400Regular',
  cuerpoMedium: 'Poppins_500Medium',
  cuerpoSemiBold: 'Poppins_600SemiBold',
  cuerpoBold: 'Poppins_700Bold',
  sistema: Platform.select({ ios: 'System', android: 'sans-serif', default: undefined }),
};

export const typography = {
  // Títulos en mayúsculas con letterSpacing amplio: es el gesto "editorial".
  title: {
    fontFamily: fuentes.titulo,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: fuentes.cuerpo,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  bodyStrong: {
    fontFamily: fuentes.cuerpoSemiBold,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontFamily: fuentes.cuerpo,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  // Texto chico: correos, ayudas, errores. Sin mayúsculas para que se lea bien.
  caption: {
    fontFamily: fuentes.cuerpoMedium,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  // Etiqueta en mayúsculas espaciadas: labels de inputs, badges, cabeceras de
  // sección. Es la "voz" editorial de los textos chicos.
  label: {
    fontFamily: fuentes.cuerpoMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fuentes.cuerpoSemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  buttonSmall: {
    fontFamily: fuentes.cuerpoSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  logo: {
    fontFamily: fuentes.tituloBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 6,
  },
  display: {
    fontFamily: fuentes.tituloBold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
};
// Niveles que usa <Titulo nivel="h1|h2|h3">.
typography.h1 = typography.title;
typography.h2 = typography.subtitle;
typography.h3 = { fontFamily: fuentes.cuerpoSemiBold, fontSize: 16, lineHeight: 24, letterSpacing: 0.2 };

// ── Radios ──────────────────────────────────────────────────────────────────
// Bordes casi rectos: transmiten seriedad. `pill` solo para avatares y contadores.
export const radius = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  pill: 999,
};

// ── Sombras ─────────────────────────────────────────────────────────────────
// Muy suaves: la separación la dan el blanco y los bordes finos. iOS usa
// shadow*; Android, elevation.
const crearSombra = (altura, radio, opacidad, elevation) => ({
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: altura },
  shadowOpacity: opacidad,
  shadowRadius: radio,
  elevation,
});

export const shadows = {
  none: crearSombra(0, 0, 0, 0),
  sm: crearSombra(1, 2, 0.04, 1),
  md: crearSombra(4, 12, 0.06, 2),
  lg: crearSombra(12, 28, 0.12, 8),
};

// ── Estados de cita ─────────────────────────────────────────────────────────
// En la base: 1 Activa, 2 Cancelada, 3 Finalizada, 4 En Curso. "Activa" se
// muestra como Confirmada (neutra: negro sobre gris) y "Pendiente" queda
// definida para cuando exista. Cada estado tiene ícono propio para no depender
// solo del color.
export const ESTADOS_CITA = {
  pendiente: {
    nombre: 'Pendiente',
    fondo: colors.warningSoft,
    texto: colors.warning,
    borde: colors.warning,
    icono: 'time-outline',
  },
  confirmada: {
    nombre: 'Confirmada',
    fondo: gris.gris100,
    texto: colors.textPrimary,
    borde: colors.primary,
    icono: 'checkmark-circle-outline',
  },
  enCurso: {
    nombre: 'En Curso',
    fondo: colors.enCursoSoft,
    texto: colors.enCurso,
    borde: colors.enCurso,
    icono: 'play-circle-outline',
  },
  finalizada: {
    nombre: 'Finalizada',
    fondo: colors.successSoft,
    texto: colors.success,
    borde: colors.success,
    icono: 'checkmark-done-outline',
  },
  cancelada: {
    nombre: 'Cancelada',
    fondo: colors.errorSoft,
    texto: colors.error,
    borde: colors.error,
    icono: 'close-circle-outline',
  },
};

const ESTADO_POR_ID = { 1: 'confirmada', 2: 'cancelada', 3: 'finalizada', 4: 'enCurso' };
const ESTADO_POR_NOMBRE = {
  pendiente: 'pendiente',
  activa: 'confirmada',
  confirmada: 'confirmada',
  'en curso': 'enCurso',
  finalizada: 'finalizada',
  cancelada: 'cancelada',
};

// Acepta el idEstado (número o texto) o el nombre que devuelve la API ("En Curso").
export const estiloEstadoCita = (estado) => {
  if (estado === null || estado === undefined) {
    return ESTADOS_CITA.confirmada;
  }
  const porId = ESTADO_POR_ID[Number(estado)];
  if (porId) {
    return ESTADOS_CITA[porId];
  }
  const porNombre = ESTADO_POR_NOMBRE[String(estado).trim().toLowerCase()];
  return ESTADOS_CITA[porNombre || 'confirmada'];
};

const theme = { colors, spacing, typography, fuentes, radius, shadows, estadosCita: ESTADOS_CITA, estiloEstadoCita };

export default theme;
