import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Texto } from '../ui';

// Error del servidor dentro de un formulario (no un Alert: el usuario no pierde lo que escribió).
export default function AvisoError({ mensaje }) {
  if (!mensaje) {
    return null;
  }
  return (
    <View style={styles.aviso} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
      <Texto variante="bodySmall" color="error" style={styles.texto}>
        {mensaje}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  texto: {
    flex: 1,
  },
});
