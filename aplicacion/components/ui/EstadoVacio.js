import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Texto } from './Texto';

// Mensaje para listas sin resultados.
//   <EstadoVacio icono="calendar-outline" titulo="Sin citas" mensaje="..." >{botón opcional}</EstadoVacio>
export default function EstadoVacio({ icono = 'sparkles-outline', titulo, mensaje, children, style }) {
  return (
    <View style={[styles.contenedor, style]}>
      <View style={styles.circulo}>
        <Ionicons name={icono} size={28} color={colors.textPrimary} />
      </View>
      {titulo ? (
        <Texto variante="h3" color="textStrong" centrado>
          {titulo}
        </Texto>
      ) : null}
      {mensaje ? (
        <Texto variante="bodySmall" color="textMuted" centrado style={styles.mensaje}>
          {mensaje}
        </Texto>
      ) : null}
      {children ? <View style={styles.accion}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circulo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  mensaje: {
    marginTop: spacing.xs,
  },
  accion: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
