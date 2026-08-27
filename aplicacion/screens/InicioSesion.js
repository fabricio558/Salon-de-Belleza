import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../direcIP/ip';

export default function InicioSesion({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const login = async () => {
    if (!correo || !contrasena) {
      Alert.alert("Atención", "Campos vacíos. Por favor complete sus datos");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/index.php?action=login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: correo,
          contrasena: contrasena,
        }),
      });

      const data = await response.json(); 

      if (data.success) {
        if (data.data) {
          await AsyncStorage.setItem('user_session', JSON.stringify(data.data));
        }
        
        setCorreo('');
        setContrasena('');
        navigation.replace('MainDrawer');
      } else {
        Alert.alert("Atención", data.message); 
      } 
    } catch(error) {
      console.error(error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e6d3c6" />

      <View style={styles.header}>
        <Text style={styles.title}>Mandala</Text>
        <Text style={styles.subtitle}>Tu Centro de Belleza de Confianza</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>INICIAR SESIÓN</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              placeholderTextColor="#8D8B94"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={setCorreo}
            />
          
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#8D8B94"
              secureTextEntry={true}
              autoCapitalize="none"
              value={contrasena}
              onChangeText={setContrasena}
            />
            
          <Pressable
            style={styles.button}
            onPress={login}
          >
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e1cec2",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#e6d3c6',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  subtitle: {
    fontSize: 14,
    color: '#8D8B94',
    marginTop: 5,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#f6e8e8',
    borderRadius: 15,
    padding: 25,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B8838A',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#232226',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e6d3c6',
  },
  button: {
    backgroundColor: '#B8838A',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});