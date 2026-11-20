import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { accion, CLAVE_SESION } from '../utils/api';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { colors, typography, spacing } from '../theme';
import { Boton, Input, Texto, Titulo } from '../components/ui';

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

  // Diseño: pantalla blanca de una sola columna, como la portada de una revista.
  // El logo es el protagonista (serif grande y espaciada), una línea negra corta
  // separa la marca del formulario, y hay un solo botón negro: la acción principal.
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.navBar}>
        <Boton
          titulo="Volver"
          variante="text"
          tamano="sm"
          icono="arrow-back"
          onPress={() => navigation.navigate('Bienvenida')}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => navigation.navigate('Bienvenida')}
          accessibilityRole="button"
          accessibilityLabel="Mandala, ir a la bienvenida"
          style={styles.marca}
        >
          <Text style={styles.logoTexto}>MANDALA</Text>
          <Text style={styles.lema}>Salón de belleza</Text>
        </Pressable>

        <View style={styles.separador} />

        <Titulo nivel="h1" centrado>Iniciar sesión</Titulo>
        <Texto variante="bodySmall" color="textSecondary" centrado style={styles.subtitulo}>
          Ingresa tus credenciales para acceder a tu cuenta.
        </Texto>

        <Input
          label="Correo electrónico"
          icono="mail-outline"
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
        />

        <Input
          label="Contraseña"
          icono="lock-closed-outline"
          placeholder="Tu contraseña"
          secureTextEntry={true}
          autoCapitalize="none"
          value={contrasena}
          onChangeText={setContrasena}
        />

        <Boton titulo="Ingresar" onPress={login} tamano="lg" anchoCompleto style={styles.botonIngresar} />

        <View style={styles.registro}>
          <Text style={styles.textoRegistro}>¿No tienes una cuenta?</Text>
          <Boton
            titulo="Regístrate"
            variante="text"
            tamano="sm"
            onPress={() => navigation.navigate('Registro')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.pantalla,
    paddingBottom: spacing.xxxl,
  },
  marca: {
    alignItems: 'center',
    minHeight: spacing.toqueMinimo,
  },
  logoTexto: {
    ...typography.display,
    color: colors.textPrimary,
  },
  lema: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Línea corta y fina: el único "adorno" de la pantalla.
  separador: {
    width: 40,
    height: 1,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginVertical: spacing.xxl,
  },
  subtitulo: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  botonIngresar: {
    marginTop: spacing.sm,
  },
  registro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  textoRegistro: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
