import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../../theme';
import { Texto } from '../ui';

const DURACION_MS = 2600;

// Confirmación breve ("Datos actualizados") que aparece abajo y se va sola.
// Reemplaza al Alert de éxito: confirma sin interrumpir.
//   <AvisoFlotante mensaje={aviso} onOcultar={() => setAviso(null)} />
export default function AvisoFlotante({ mensaje, onOcultar }) {
  const animacion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!mensaje) {
      return undefined;
    }
    Animated.spring(animacion, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(animacion, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onOcultar());
    }, DURACION_MS);
    return () => clearTimeout(timer);
  }, [mensaje, animacion, onOcultar]);

  if (!mensaje) {
    return null;
  }

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.aviso,
        {
          opacity: animacion,
          transform: [{ translateY: animacion.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.textOnPrimary} />
      <Texto variante="bodySmall" color="textOnPrimary" style={styles.texto}>
        {mensaje}
      </Texto>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    position: 'absolute',
    left: spacing.pantalla,
    right: spacing.pantalla,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  texto: {
    flex: 1,
  },
});
