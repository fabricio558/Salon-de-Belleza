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
import api, { accion, CLAVE_SESION } from '../utils/api';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';

export default function InicioSesion({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const login = async () => {
    if (!correo || !contrasena) {
      Alert.alert("Atención", "Campos vacíos. Por favor complete sus datos");
      return;
    }

    try {
      const response = await api.post(accion('login'), { correo, contrasena });
      const data = response.data;

      if (!esRespuestaValida(data)) {
        console.log('login devolvió una respuesta inválida:', data);
        Alert.alert("Error", "Respuesta inválida del servidor");
      } else if (data.success && data.data?.token) {
        // data.data: idUsuarios, idEstilistas, nombres, apellido, idRol y el token de sesión.
        await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(data.data));

        setCorreo('');
        setContrasena('');
        navigation.replace('MainDrawer');
      } else {
        Alert.alert("Atención", data.message || "No se pudo iniciar sesión.");
      }
    } catch(error) {
      console.log('Error en login:', error);
      Alert.alert("Error", mensajeDeError(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.navigate('Bienvenida')}>
          <Text style={styles.logoTexto}>MANDALA</Text>
        </Pressable>
        <Pressable 
          onPress={() => navigation.navigate('Bienvenida')} 
          style={styles.navBtnVolver}
        >
          <Text style={styles.navBtnVolverText}>← Volver</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>INICIAR SESIÓN</Text>
          <Text style={styles.cardSub}>Ingresa tus credenciales para acceder a tu cuenta.</Text>
            
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            placeholderTextColor="#888888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
          />
        
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888888"
            secureTextEntry={true}
            autoCapitalize="none"
            value={contrasena}
            onChangeText={setContrasena}
          />
          
          <Pressable
            style={styles.button}
            onPress={login}
          >
            <Text style={styles.buttonText}>INGRESAR</Text>
          </Pressable>

          <Pressable
            style={styles.buttonRegistroLink}
            onPress={() => navigation.navigate('Registro')}
          >
            <Text style={styles.textRegistroLink}>¿No tienes una cuenta? <Text style={{fontWeight: 'bold', color: '#000000'}}>Regístrate</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoTexto: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  navBtnVolver: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  navBtnVolverText: {
    fontWeight: 'bold',
    color: '#666666',
    fontSize: 14,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 25,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  cardSub: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonRegistroLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  textRegistroLink: {
    color: '#666666',
    fontSize: 13,
  },
});