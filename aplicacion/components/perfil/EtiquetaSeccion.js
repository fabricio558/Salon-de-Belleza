import React from 'react';
import { StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { Texto } from '../ui';

// Cabecera de sección en mayúsculas espaciadas (la "voz" editorial de los textos chicos).
export default function EtiquetaSeccion({ children, style }) {
  return (
    <Texto variante="label" color="textSecondary" accessibilityRole="header" style={[styles.etiqueta, style]}>
      {children}
    </Texto>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    marginBottom: spacing.md,
  },
});
