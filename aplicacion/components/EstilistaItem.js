// components/EstilistaItem.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function EstilistaItem({ nombres, apellido, foto, rol = "Especialista Profesional" }) {
  return (
    <View style={styles.filaEstilista}>
      <Image 
        source={{ uri: foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' }} 
        style={styles.avatarEstilista} 
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.nombreEstilista}>{nombres} {apellido}</Text>
        <Text style={styles.rolEstilista}>{rol}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filaEstilista: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarEstilista: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  nombreEstilista: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  rolEstilista: {
    fontSize: 13,
    color: '#777777',
  },
});