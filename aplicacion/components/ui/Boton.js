import React from 'react';
import { Pressable, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';

// Botón de la marca.
//   variante: primary   → negro sólido con texto blanco (la acción principal; uno por pantalla)
//             secondary → borde negro fino, fondo transparente (acciones secundarias)
//             text      → solo texto subrayado al presionar (acciones terciarias, links)
//             danger    → borde y texto de error (acciones destructivas)
//   tamano:   sm | md | lg
// `outline` y `ghost` se aceptan como alias de `secondary` y `text`.
//
// Diseño: rectángulo casi recto (radius.md = 4) y texto en mayúsculas espaciadas,
// como las etiquetas de una marca de moda. Al presionar, el primario pasa a grafito
// y los demás reciben un fondo gris tenue: feedback claro sin agregar color.

const VARIANTES = {
  primary: {
    fondo: colors.primary,
    fondoPresionado: colors.primaryPressed,
    texto: colors.textOnPrimary,
    borde: colors.primary,
    bordePresionado: colors.primaryPressed,
  },
  secondary: {
    fondo: 'transparent',
    fondoPresionado: colors.surfaceSubtle,
    texto: colors.textPrimary,
    borde: colors.primary,
    bordePresionado: colors.primary,
  },
  text: {
    fondo: 'transparent',
    fondoPresionado: colors.surfaceSubtle,
    texto: colors.textPrimary,
    borde: 'transparent',
    bordePresionado: 'transparent',
  },
  danger: {
    fondo: 'transparent',
    fondoPresionado: colors.errorSoft,
    texto: colors.error,
    borde: colors.error,
    bordePresionado: colors.error,
  },
};
VARIANTES.outline = VARIANTES.secondary;
VARIANTES.ghost = VARIANTES.text;

// sm se ve más bajo (36), pero hitSlop completa los 44 px de área táctil.
const TAMANOS = {
  sm: { alto: 36, padding: spacing.md, texto: typography.buttonSmall, icono: 16, hitSlop: 4 },
  md: { alto: 48, padding: spacing.xl, texto: typography.button, icono: 18, hitSlop: 0 },
  lg: { alto: 56, padding: spacing.xxl, texto: { ...typography.button, fontSize: 14 }, icono: 20, hitSlop: 0 },
};

export default function Boton({
  titulo,
  onPress,
  variante = 'primary',
  tamano = 'md',
  icono,
  iconoDerecha = false,
  cargando = false,
  deshabilitado = false,
  anchoCompleto = false,
  style,
  textStyle,
  accessibilityLabel,
  ...props
}) {
  const v = VARIANTES[variante] || VARIANTES.primary;
  const t = TAMANOS[tamano] || TAMANOS.md;
  const inactivo = deshabilitado || cargando;

  // Deshabilitado: gris plano en todas las variantes (los controles inactivos
  // están exentos del contraste mínimo de WCAG, pero el texto sigue legible).
  const colorTexto = deshabilitado ? colors.disabledText : v.texto;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      hitSlop={t.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => {
        const presionado = pressed && !inactivo;
        let fondo = presionado ? v.fondoPresionado : v.fondo;
        let borde = presionado ? v.bordePresionado : v.borde;
        if (deshabilitado) {
          fondo = variante === 'primary' ? colors.disabled : 'transparent';
          borde = v.borde === 'transparent' ? 'transparent' : colors.disabled;
        }
        return [
          styles.base,
          { minHeight: t.alto, paddingHorizontal: t.padding, backgroundColor: fondo, borderColor: borde },
          anchoCompleto && styles.anchoCompleto,
          style,
        ];
      }}
      {...props}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={v.texto} />
      ) : (
        <View style={[styles.contenido, iconoDerecha && styles.contenidoInvertido]}>
          {icono ? <Ionicons name={icono} size={t.icono} color={colorTexto} /> : null}
          {titulo ? (
            <Text style={[t.texto, styles.texto, { color: colorTexto }, textStyle]} numberOfLines={1}>
              {titulo}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchoCompleto: {
    alignSelf: 'stretch',
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contenidoInvertido: {
    flexDirection: 'row-reverse',
  },
  texto: {
    flexShrink: 1,
  },
});
