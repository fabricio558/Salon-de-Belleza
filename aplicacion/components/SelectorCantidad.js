import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// Control − cantidad + (mismo estilo que el de los servicios en CrearCita).
// Con `min` = 0, bajar desde 1 llama a onCambiar(0) (quitar).
export default function SelectorCantidad({ valor, min = 1, max, onCambiar }) {
  const puedeBajar = valor > min;
  const puedeSubir = max === undefined || valor < max;

  return (
    <View style={styles.control}>
      <Pressable
        style={[styles.boton, !puedeBajar && styles.botonDeshabilitado]}
        onPress={() => onCambiar(valor - 1)}
        disabled={!puedeBajar}
        hitSlop={6}
      >
        <Text style={styles.textoBoton}>−</Text>
      </Pressable>
      <Text style={styles.cantidad}>{valor}</Text>
      <Pressable
        style={[styles.boton, !puedeSubir && styles.botonDeshabilitado]}
        onPress={() => onCambiar(valor + 1)}
        disabled={!puedeSubir}
        hitSlop={6}
      >
        <Text style={styles.textoBoton}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 3,
  },
  boton: {
    backgroundColor: '#000000',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.3,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cantidad: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
});
