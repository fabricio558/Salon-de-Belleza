import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

// Bloque gris que "respira" mientras carga: anticipa la forma del contenido
// (mejor que un spinner suelto, porque la pantalla no salta al llegar los datos).
//   <Esqueleto ancho={120} alto={14} />   <Esqueleto circulo alto={72} />
export default function Esqueleto({ ancho = '100%', alto = 14, circulo = false, style }) {
  const opacidad = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [opacidad]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        { width: circulo ? alto : ancho, height: alto, opacity: opacidad },
        circulo && { borderRadius: alto / 2 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
  },
});
