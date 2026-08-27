import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import BASE_URL from '../direcIP/ip';
import Header from '../components/header'; 
import { useFocusEffect } from '@react-navigation/native';

export default function AgendaSemanal({ navigation }) {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [estilista, setEstilista] = useState(null); 

  useFocusEffect(
    useCallback(() => {
      cargarSesionYcitas(); 
    }, [])
  );

  const cargarSesionYcitas = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('user_session');
      
      if (sessionData !== null) {
        const usuario = JSON.parse(sessionData);
        setEstilista(usuario);
        
        // Maneja idEstilistas o id_estilista según como venga guardado
        const idEst = usuario.idEstilistas ?? usuario.id_estilista ?? usuario.id;
        obtenerCitas(idEst); 
      } else {
        navigation.navigate('Login'); 
      }
    } catch (error) {
      console.error("Error al cargar la sesión:", error);
      setCargando(false);
    }
  };

  const obtenerCitas = async (idDinamico) => {
    try {
      const response = await fetch(`${BASE_URL}/index.php?action=get_citas&id_estilistas=${idDinamico}`);
      const data = await response.json();
      
      if (data.success) {
        setCitas(data.data);
      }
    } catch (error) {
      console.error("Error al cargar citas:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <View style={styles.bodyContainer}>
        <Text style={styles.saludo}>
          Agenda de {estilista ? estilista.nombres : 'Semana'}
        </Text>

        {cargando ? (
          <ActivityIndicator size="large" color="#B8838A" style={{ marginTop: 50 }} />
        ) : citas.length === 0 ? (
          <Text style={styles.textoVacio}>No hay citas programadas.</Text>
        ) : (
          <FlatList 
              data={citas}
              keyExtractor={(item) => item.idCitas.toString()} 
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.tarjetaCita}
                  onPress={() => {
                    navigation.navigate('FichaCliente', { id_clientes: item.idClientes });
                  }}
                >
                  <Text style={styles.textoCliente}>
                    Cliente: {item.nombres} {item.apellido}
                  </Text>
                  <Text style={styles.textoHora}>
                    Fecha: {item.fecha} | Hora: {item.hora} hs
                  </Text>
                </TouchableOpacity>
              )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F3EE',
  },
  bodyContainer: {
    flex: 1,
    padding: 15,
  },
  saludo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B8838A',
    marginBottom: 15,
  },
  tarjetaCita: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textoCliente: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  textoHora: {
    fontSize: 14,
    color: '#8E6E73',
    marginTop: 4,
  },
  textoVacio: {
    textAlign: 'center',
    color: '#8E6E73',
    marginTop: 30,
    fontSize: 15,
  }
});