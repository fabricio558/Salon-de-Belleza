import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';

// Tarjeta del tema.
//   variante: normal → gris casi blanco con borde fino (datos de cliente, resúmenes)
//             cita   → igual, con una barra izquierda del color del estado
//             suave  → bloque gris tenue sin borde (notas, información secundaria)
//   colorBorde: color de la barra izquierda en la variante "cita".
// Si recibe onPress se vuelve presionable.
//
// Diseño: la tarjeta se separa del fondo blanco por un gris mínimo (#FAFAFA) y un
// borde de 1 px, con una sombra casi imperceptible. Nada de sombras pesadas: el
// look de lujo viene del aire, no del volumen.
export default function Tarjeta({
  variante = 'normal',
  colorBorde = colors.primary,
  onPress,
  style,
  children,
  ...props
}) {
  const estilos = [
    styles.base,
    variante === 'cita' && [styles.cita, { borderLeftColor: colorBorde }],
    variante === 'suave' && styles.suave,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [estilos, pressed && styles.presionada]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={estilos} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.entreTarjetas,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cita: {
    borderLeftWidth: 3,
  },
  suave: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.surfaceSubtle,
    ...shadows.none,
  },
  presionada: {
    backgroundColor: colors.surfaceSubtle,
  },
});
