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

export default function StackScreens({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const login = async () => {
    if (!correo || !contrasena) {
      Alert.alert("Atención", "Campos vacíos. Por favor complete sus datos");
      return;
    }

    try {
      const response = await fetch('http://192.168.100.19/salonBelleza/api_proyecto/index.php?action=login', {
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
        navigation.navigate('Agenda Diaria');
      } else {
        Alert.alert("Error", data.message);
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
    backgroundColor: '#e1cec2',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#e6d3c6',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  subtitle: {
    fontSize: 14,
    color: '#8D8B94',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#f6e8e8',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFE8E6',
    shadowColor: '#232226',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#232226',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#e3dcd6',
    borderWidth: 1,
    borderColor: '#E6DFDB',
    color: '#232226',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#63b572',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3A5A40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});