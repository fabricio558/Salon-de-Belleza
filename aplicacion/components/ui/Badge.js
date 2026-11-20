import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, estiloEstadoCita } from '../../theme';

// Tonos libres (para lo que no es un estado de cita).
const TONOS = {
  neutral: { fondo: colors.surfaceSubtle, texto: colors.textPrimary },
  inverso: { fondo: colors.primary, texto: colors.textOnPrimary },
  success: { fondo: colors.successSoft, texto: colors.success },
  warning: { fondo: colors.warningSoft, texto: colors.warning },
  error: { fondo: colors.errorSoft, texto: colors.error },
  enCurso: { fondo: colors.enCursoSoft, texto: colors.enCurso },
  // Acento de marca (rol, "destacado", "nuevo"). No es un estado: no usarlo para avisos.
  dorado: { fondo: colors.goldSoft, texto: colors.goldText },
};
// Alias de los nombres anteriores.
TONOS.primary = TONOS.neutral;
TONOS.accent = TONOS.neutral;
TONOS.danger = TONOS.error;
TONOS.info = TONOS.enCurso;

// Badge de estado: rectángulo chico con ícono + texto en mayúsculas espaciadas.
// El estado nunca depende solo del color: el ícono y el texto lo dicen igual.
//   <Badge estado={cita.idEstado} />            → colores, ícono y nombre del estado
//   <Badge estado={4} texto="En curso" />       → mismo estilo, otro texto
//   <Badge tono="success" texto="Pagada" icono="checkmark" />
export default function Badge({ estado, tono, texto, icono, style }) {
  let fondo;
  let colorTexto;
  let nombre = texto;
  let iconoFinal = icono;

  if (estado !== undefined && estado !== null && !tono) {
    const e = estiloEstadoCita(estado);
    fondo = e.fondo;
    colorTexto = e.texto;
    nombre = texto || e.nombre;
    iconoFinal = icono === undefined ? e.icono : icono;
  } else {
    const t = TONOS[tono] || TONOS.neutral;
    fondo = t.fondo;
    colorTexto = t.texto;
  }

  return (
    <View style={[styles.badge, { backgroundColor: fondo }, style]}>
      {iconoFinal ? <Ionicons name={iconoFinal} size={12} color={colorTexto} style={styles.icono} /> : null}
      <Text style={[styles.texto, { color: colorTexto }]} numberOfLines={1}>
        {nombre}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  icono: {
    marginRight: spacing.xs,
  },
  texto: {
    ...typography.label,
    fontSize: 10,
    lineHeight: 14,
  },
});
