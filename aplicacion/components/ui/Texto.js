import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

// Texto con la tipografía del tema.
//   <Texto variante="bodySmall" color="textMuted">...</Texto>
// `color` acepta un nombre de theme.colors o un color.
export function Texto({ variante = 'body', color = 'text', centrado = false, style, children, ...props }) {
  const colorFinal = colors[color] || color;
  return (
    <Text
      style={[typography[variante] || typography.body, { color: colorFinal }, centrado && styles.centrado, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Títulos: h1 por defecto, en el color fuerte del tema.
export function Titulo({ nivel = 'h1', color = 'textStrong', ...props }) {
  return <Texto variante={nivel} color={color} accessibilityRole="header" {...props} />;
}

const styles = StyleSheet.create({
  centrado: {
    textAlign: 'center',
  },
});

export default Texto;
