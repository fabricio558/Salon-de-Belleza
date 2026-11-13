import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from '../components/header';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';

// Mismo diseño que GestionPerfilEstilista.js. A diferencia de ese, la contraseña
// guardada nunca llega a la app: la actual se verifica en el servidor (update_contrasena).
export default function GestionPerfilRecepcionista({ navigation }) {
  const [idUsuario, setIdUsuario] = useState(null);
  const [nombres, setNombres] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

  const handleFechaChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length <= 4) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }
    setFechaNacimiento(formatted);
  };

  const cargarDatosPerfil = async () => {
    try {
      setCargando(true);
      setError(null);
      const session = await AsyncStorage.getItem('user_session');
      const id = session ? JSON.parse(session).idUsuarios : null;
      setIdUsuario(id);
      if (!id) {
        setError('No se encontró tu sesión. Volvé a iniciar sesión.');
        return;
      }

      const response = await axios.get(`${BASE_URL}/index.php?action=get_perfil_recepcionista&id=${id}`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_perfil_recepcionista devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        const perfil = response.data.data;
        setNombres(perfil.nombres || '');
        setApellido(perfil.apellido || '');
        setCorreo(perfil.correo || '');
        setFechaNacimiento(perfil.fechaNacimiento || '');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_perfil_recepcionista:', err);
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosPerfil();
  }, []);

  const guardarCambios = async () => {
    if (!nombres.trim() || !apellido.trim() || !correo.trim()) {
      Alert.alert('Atención', 'Los campos de nombre, apellido y correo son obligatorios.');
      return;
    }
    if (fechaNacimiento && fechaNacimiento.length !== 10) {
      Alert.alert('Atención', 'Completá la fecha de nacimiento con el formato AAAA-MM-DD o dejala vacía.');
      return;
    }

    try {
      setGuardando(true);
      const response = await axios.post(`${BASE_URL}/index.php?action=update_perfil_recepcionista`, {
        idUsuarios: idUsuario,
        nombres: nombres.trim(),
        apellido: apellido.trim(),
        correo: correo.trim(),
        fechaNacimiento,
      });

      if (!esRespuestaValida(response.data)) {
        console.log('update_perfil_recepcionista devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        Alert.alert('Éxito', response.data.message);
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (err) {
      console.log('Error en update_perfil_recepcionista:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModalPasswordVisible(false);
    setContrasenaActual('');
    setNuevaContrasena('');
    setMostrarActual(false);
    setMostrarNueva(false);
  };

  const confirmarCambioContrasena = async () => {
    if (!contrasenaActual || !nuevaContrasena) {
      Alert.alert('Atención', 'Por favor completá ambos campos de contraseña.');
      return;
    }
    if (nuevaContrasena.length < 6) {
      Alert.alert('Atención', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setCambiandoContrasena(true);
      const response = await axios.post(`${BASE_URL}/index.php?action=update_contrasena`, {
        idUsuarios: idUsuario,
        contrasenaActual,
        nuevaContrasena,
      });

      if (!esRespuestaValida(response.data)) {
        console.log('update_contrasena devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        cerrarModal();
        Alert.alert('Éxito', response.data.message);
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (err) {
      console.log('Error en update_contrasena:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setCambiandoContrasena(false);
    }
  };

  const renderFormulario = () => {
    if (cargando) {
      return <ActivityIndicator size="small" color="#000000" style={styles.cargando} />;
    }
    if (error) {
      return (
        <View style={styles.tarjetaUsuario}>
          <Text style={styles.textoError}>{error}</Text>
          <Pressable style={styles.botonGuardar} onPress={cargarDatosPerfil}>
            <Text style={styles.textoBotonGuardar}>REINTENTAR</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.tarjetaUsuario}>
        <View style={styles.campoContainer}>
          <Text style={styles.etiqueta}>Nombres:</Text>
          <TextInput
            style={styles.inputEditable}
            value={nombres}
            onChangeText={setNombres}
            maxLength={45}
            placeholder="Tus nombres"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.campoContainer}>
          <Text style={styles.etiqueta}>Apellido:</Text>
          <TextInput
            style={styles.inputEditable}
            value={apellido}
            onChangeText={setApellido}
            maxLength={45}
            placeholder="Tu apellido"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.campoContainer}>
          <Text style={styles.etiqueta}>Correo Electrónico:</Text>
          <TextInput
            style={styles.inputEditable}
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={45}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.campoContainerPasswordRow}>
          <View>
            <Text style={styles.etiqueta}>Contraseña:</Text>
            <Text style={styles.textoPasswordOculta}>••••••••</Text>
          </View>
          <Pressable style={styles.botonModificarPassword} onPress={() => setModalPasswordVisible(true)}>
            <Text style={styles.textoBotonModificar}>Modificar</Text>
          </Pressable>
        </View>

        <View style={styles.campoContainer}>
          <Text style={styles.etiqueta}>Fecha de Nacimiento:</Text>
          <TextInput
            style={styles.inputEditable}
            value={fechaNacimiento}
            onChangeText={handleFechaChange}
            keyboardType="numeric"
            maxLength={10}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#888"
          />
        </View>

        <Pressable
          style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
          onPress={guardarCambios}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBotonGuardar}>GUARDAR CAMBIOS</Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.seccionCatalogo}>
          <Text style={styles.tituloSeccion}>GESTIÓN DE PERFIL</Text>
          <Text style={styles.subtituloSeccion}>Administra tus datos personales.</Text>
          {renderFormulario()}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalPasswordVisible}
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitulo}>Modificar Contraseña</Text>
              <Text style={styles.modalSubtitulo}>Ingresa tu contraseña actual y la nueva clave.</Text>

              <Text style={styles.seccionTituloModal}>Contraseña Actual:</Text>
              <View style={styles.campoContainerModalPassword}>
                <TextInput
                  style={styles.inputModalPassword}
                  value={contrasenaActual}
                  onChangeText={setContrasenaActual}
                  secureTextEntry={!mostrarActual}
                  autoCapitalize="none"
                  placeholder="Contraseña actual"
                  placeholderTextColor="#888"
                />
                <Pressable onPress={() => setMostrarActual(!mostrarActual)}>
                  <Text style={styles.textoVerOcultar}>{mostrarActual ? 'Ocultar' : 'Mostrar'}</Text>
                </Pressable>
              </View>

              <Text style={styles.seccionTituloModal}>Nueva Contraseña:</Text>
              <View style={styles.campoContainerModalPassword}>
                <TextInput
                  style={styles.inputModalPassword}
                  value={nuevaContrasena}
                  onChangeText={setNuevaContrasena}
                  secureTextEntry={!mostrarNueva}
                  autoCapitalize="none"
                  placeholder="Nueva contraseña (mínimo 6 caracteres)"
                  placeholderTextColor="#888"
                />
                <Pressable onPress={() => setMostrarNueva(!mostrarNueva)}>
                  <Text style={styles.textoVerOcultar}>{mostrarNueva ? 'Ocultar' : 'Mostrar'}</Text>
                </Pressable>
              </View>

              <View style={styles.modalBotonesContainer}>
                <Pressable style={[styles.modalBoton, styles.botonCancelarModal]} onPress={cerrarModal}>
                  <Text style={styles.textoBotonCancelar}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBoton, styles.botonGuardarModal, cambiandoContrasena && styles.botonDeshabilitado]}
                  onPress={confirmarCambioContrasena}
                  disabled={cambiandoContrasena}
                >
                  {cambiandoContrasena ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textoBotonGuardarModal}>Actualizar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40 },
  seccionCatalogo: { paddingHorizontal: 20, marginBottom: 30, marginTop: 20 },
  tituloSeccion: { fontSize: 22, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  subtituloSeccion: { fontSize: 14, color: '#666666', marginTop: 2, marginBottom: 15 },
  cargando: { marginVertical: 20 },
  tarjetaUsuario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campoContainer: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  campoContainerPasswordRow: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputEditable: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    paddingVertical: 4,
    marginTop: 2,
  },
  textoPasswordOculta: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    letterSpacing: 2,
  },
  botonModificarPassword: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  textoBotonModificar: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  etiqueta: { fontWeight: '900', fontSize: 13, color: '#000000' },
  botonGuardar: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBotonGuardar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  textoError: { fontSize: 14, color: '#C62828', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#EEEEEE', elevation: 5 },
  modalTitulo: { fontSize: 20, fontWeight: '900', color: '#000000', marginBottom: 5, textAlign: 'center' },
  modalSubtitulo: { fontSize: 13, color: '#666666', marginBottom: 20, textAlign: 'center' },
  seccionTituloModal: { fontSize: 13, fontWeight: '900', color: '#000000', marginBottom: 6 },
  campoContainerModalPassword: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  inputModalPassword: { flex: 1, fontSize: 14, color: '#333333', paddingVertical: 4 },
  textoVerOcultar: { fontSize: 12, fontWeight: 'bold', color: '#666666', paddingLeft: 10 },
  modalBotonesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBoton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  botonCancelarModal: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  botonGuardarModal: { backgroundColor: '#000000' },
  textoBotonCancelar: { color: '#333333', fontWeight: 'bold' },
  textoBotonGuardarModal: { color: '#FFFFFF', fontWeight: 'bold' },
});
