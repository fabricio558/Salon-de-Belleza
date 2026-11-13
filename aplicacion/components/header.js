import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCarrito } from '../context/CarritoContext';

export default function Header({ navigation, titulo = "MANDALA", subtitulo }) {
  // Solo el cliente tiene carrito (CarritoProvider en navigation.js).
  const carrito = useCarrito();

  return (
    <View style={styles.header}>
      <Pressable
        style={styles.hamburgerButton}
        onPress={() => navigation.openDrawer()}
      >
        <Text style={styles.hamburgerIcon}>☰</Text>
      </Pressable>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.title}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitle}>{subtitulo}</Text> : null}
      </View>

      {carrito.habilitado ? (
        <Pressable
          style={styles.botonCarrito}
          onPress={() => navigation.navigate('Mi Carrito')}
          hitSlop={8}
          accessibilityLabel={`Carrito, ${carrito.cantidadTotal} productos`}
        >
          <Text style={styles.iconoCarrito}>🛒</Text>
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

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    zIndex: 1,
  },
  hamburgerButton: {
    padding: 5,
    marginRight: 10,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  // Mismo ancho que el botón ☰ (35) para que el título quede centrado.
  espacioDerecho: {
    width: 35,
  },
  botonCarrito: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoCarrito: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#B8838A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBadge: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});
