import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';

// Chip seleccionable (servicios, estilistas, filtros).
// Sin seleccionar: blanco con borde fino. Seleccionado: negro sólido con un check,
// así el estado se lee también sin color.
//   <Chip texto="Corte" detalle="$5000" seleccionado={sel} onPress={...} />
export default function Chip({ texto, detalle, seleccionado = false, onPress, icono, deshabilitado = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: seleccionado, disabled: deshabilitado }}
      accessibilityLabel={detalle ? `${texto}, ${detalle}` : texto}
      style={({ pressed }) => [
        styles.chip,
        seleccionado && styles.seleccionado,
        pressed && !seleccionado && styles.presionado,
        deshabilitado && styles.deshabilitado,
        style,
      ]}
    >
      {seleccionado ? (
        <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} style={styles.icono} />
      ) : icono ? (
        <Ionicons name={icono} size={16} color={colors.textPrimary} style={styles.icono} />
      ) : null}
      <View style={styles.textos}>
        <Text style={[styles.texto, seleccionado && styles.textoSeleccionado]} numberOfLines={1}>
          {texto}
        </Text>
        {detalle ? (
          <Text style={[styles.detalle, seleccionado && styles.textoSeleccionado]} numberOfLines={1}>
            {detalle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  seleccionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presionado: {
    backgroundColor: colors.surfaceSubtle,
  },
  deshabilitado: {
    opacity: 0.5,
  },
  icono: {
    marginRight: spacing.xs + 2,
  },
  textos: {
    flexShrink: 1,
  },
  texto: {
    ...typography.bodySmall,
    fontFamily: typography.buttonSmall.fontFamily,
    color: colors.textPrimary,
  },
  detalle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  textoSeleccionado: {
    color: colors.textOnPrimary,
  },
});
