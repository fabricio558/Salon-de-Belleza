import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '../context/CarritoContext';
import { colors, typography, spacing, radius } from '../theme';

// Header de marca: blanco, logo en serif con letterSpacing amplio y una línea fina
// abajo. Los botones laterales tienen 44x44 y el título queda centrado.
export default function Header({ navigation, titulo = "MANDALA", subtitulo }) {
  // Solo el cliente tiene carrito (CarritoProvider en navigation.js).
  const carrito = useCarrito();

  return (
    <View style={styles.header}>
      <Pressable
        style={({ pressed }) => [styles.botonIcono, pressed && styles.botonPresionado]}
        onPress={() => navigation.openDrawer()}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
      >
        <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.title} numberOfLines={1}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitle} numberOfLines={1}>{subtitulo}</Text> : null}
      </View>

      {carrito.habilitado ? (
        <Pressable
          style={({ pressed }) => [styles.botonIcono, pressed && styles.botonPresionado]}
          onPress={() => navigation.navigate('Mi Carrito')}
          accessibilityRole="button"
          accessibilityLabel={`Carrito, ${carrito.cantidadTotal} productos`}
        >
          <Ionicons name="bag-handle-outline" size={24} color={colors.textPrimary} />
          {carrito.cantidadTotal > 0 && (
            <View style={styles.badge}>
              <Text style={styles.textoBadge}>{carrito.cantidadTotal > 99 ? '99+' : carrito.cantidadTotal}</Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.espacioDerecho} />
      )}
    </View>
  );
}

const TAMANO_BOTON = spacing.toqueMinimo;

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    zIndex: 1,
  },
  botonIcono: {
    width: TAMANO_BOTON,
    height: TAMANO_BOTON,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPresionado: {
    backgroundColor: colors.surfaceSubtle,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  // Mismo ancho que el botón de menú para que el título quede centrado.
  espacioDerecho: {
    width: TAMANO_BOTON,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBadge: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0,
    lineHeight: 14,
    color: colors.textOnPrimary,
  },
  title: {
    ...typography.logo,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
