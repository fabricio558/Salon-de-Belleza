// components/ServicioItem.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ServicioItem({ servicio, precio, imagenUrl }) {
  return (
    <View style={styles.filaServicio}>
      <Image 
        source={{ uri: imagenUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=300' }} 
        style={styles.imagenServicio} 
      />
      <View style={styles.infoServicio}>
        <Text style={styles.nombreServicio}>{servicio}</Text>
        <Text style={styles.precioServicio}>${precio}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filaServicio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  imagenServicio: {
    width: 55,
    height: 55,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  infoServicio: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreServicio: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  precioServicio: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
});