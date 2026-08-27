import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CardCita({ item }) {
  const [fecha, horaCompleta] = item.fechaHora.split(' ');
  const hora = horaCompleta ? horaCompleta.substring(0, 5) : '';

  return (
    <View style={styles.cardCita}>
      <Text style={styles.textoCliente}>{item.nombres} {item.apellido}</Text>
      <Text style={styles.textoDetalle}>📅 {fecha} - ⏰ {hora}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardCita: {
    backgroundColor: '#f6e8e8',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
  },
  textoCliente: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  textoDetalle: {
    fontSize: 14,
    color: '#8D8B94',
    marginTop: 5,
  }
});