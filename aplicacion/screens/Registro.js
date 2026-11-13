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
  ActivityIndicator,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';

const pad = (n) => n.toString().padStart(2, '0');
const aIso = (fecha) => `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
const aTexto = (fecha) => `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Registro de usuarios nuevos. El servidor siempre los crea con rol cliente.
export default function Registro({ navigation }) {
  const [nombres, setNombres] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const abrirSelectorFecha = () => {
    DateTimePickerAndroid.open({
      value: fechaNacimiento || new Date(2000, 0, 1),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (event, fecha) => {
        if (event.type === 'set' && fecha) {
          setFechaNacimiento(fecha);
        }
      },
    });
  };

  const validar = () => {
    if (!nombres.trim() || !apellido.trim() || !correo.trim() || !contrasena) {
      return 'Completá nombre, apellido, correo y contraseña.';
    }
    if (!CORREO_VALIDO.test(correo.trim())) {
      return 'El correo no es válido.';
    }
    if (contrasena.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (contrasena !== confirmacion) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const registrar = async () => {
    const errorValidacion = validar();
    if (errorValidacion) {
      Alert.alert('Atención', errorValidacion);
      return;
    }

    setEnviando(true);
    try {
      const response = await axios.post(`${BASE_URL}/index.php?action=registrar_usuario`, {
        nombres: nombres.trim(),
        apellido: apellido.trim(),
        correo: correo.trim(),
        contrasena,
        fechaNacimiento: fechaNacimiento ? aIso(fechaNacimiento) : '',
      });

      if (!esRespuestaValida(response.data)) {
        console.log('registrar_usuario devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        Alert.alert('¡Listo!', response.data.message, [
          { text: 'Iniciar sesión', onPress: () => navigation.replace('Login') },
        ]);
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (error) {
      console.log('Error en registrar_usuario:', error);
      Alert.alert('Error', mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.navigate('Bienvenida')}>
          <Text style={styles.logoTexto}>MANDALA</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.navBtnVolver}>
          <Text style={styles.navBtnVolverText}>← Volver</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CREAR CUENTA</Text>
          <Text style={styles.cardSub}>Registrate para reservar tus turnos.</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#888888"
            maxLength={45}
            value={nombres}
            onChangeText={setNombres}
          />
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            placeholderTextColor="#888888"
            maxLength={45}
            value={apellido}
            onChangeText={setApellido}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            placeholderTextColor="#888888"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={45}
            value={correo}
            onChangeText={setCorreo}
          />

          <Pressable style={styles.input} onPress={abrirSelectorFecha}>
            <Text style={fechaNacimiento ? styles.textoFecha : styles.textoPlaceholder}>
              {fechaNacimiento ? aTexto(fechaNacimiento) : 'Fecha de nacimiento (opcional)'}
            </Text>
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Contraseña (mínimo 6 caracteres)"
            placeholderTextColor="#888888"
            secureTextEntry={true}
            autoCapitalize="none"
            value={contrasena}
            onChangeText={setContrasena}
          />
          <TextInput
            style={styles.input}
            placeholder="Repetir contraseña"
            placeholderTextColor="#888888"
            secureTextEntry={true}
            autoCapitalize="none"
            value={confirmacion}
            onChangeText={setConfirmacion}
          />

          <Pressable
            style={[styles.button, enviando && styles.buttonDeshabilitado]}
            onPress={registrar}
            disabled={enviando}
          >
            {enviando
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.buttonText}>REGISTRARME</Text>}
          </Pressable>

          <Pressable style={styles.linkLogin} onPress={() => navigation.replace('Login')}>
            <Text style={styles.textLinkLogin}>
              ¿Ya tenés una cuenta? <Text style={styles.textLinkLoginBold}>Iniciá sesión</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Mismo estilo que InicioSesion.js.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 30,
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
  textoFecha: {
    fontSize: 15,
    color: '#000000',
  },
  textoPlaceholder: {
    fontSize: 15,
    color: '#888888',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonDeshabilitado: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkLogin: {
    marginTop: 20,
    alignItems: 'center',
  },
  textLinkLogin: {
    color: '#666666',
    fontSize: 13,
  },
  textLinkLoginBold: {
    fontWeight: 'bold',
    color: '#000000',
  },
});
