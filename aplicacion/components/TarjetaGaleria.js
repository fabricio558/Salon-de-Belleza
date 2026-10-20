import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function TarjetaGaleria({ imagen, titulo }) {
  return (
    <View style={styles.tarjetaGaleria}>
      <Image 
        source={imagen} 
        style={styles.imagenGaleria} 
      />
      <Text style={styles.tituloGaleria}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjetaGaleria: {
    width: 240,
    marginRight: 15,
  },
  imagenGaleria: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  tituloGaleria: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
  },
});