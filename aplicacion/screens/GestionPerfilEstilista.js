import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator, TextInput, Alert, Modal } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from "../components/header";

export default function GestionPerfilEstilista({ navigation }) {
  const [idEstilista, setIdEstilista] = useState(null);
  const [nombres, setNombres] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenaBD, setContrasenaBD] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [contrasenaActualInput, setContrasenaActualInput] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);

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
      const session = await AsyncStorage.getItem('user_session');
      if (session) {
        const userData = JSON.parse(session);
        const id = userData.idUsuarios || userData.id;
        setIdEstilista(id);

        if (id) {
          const response = await axios.get(`${BASE_URL}/services/get_estilista.php?id=${id}`);
          if (response.data && response.data.success) {
            const est = response.data.data;
            setNombres(est.nombres || '');
            setApellido(est.apellido || '');
            setCorreo(est.correo || '');
            setContrasenaBD(est.contrasena || '');
            setFechaNacimiento(est.fechaNacimiento || '');
          }
        }
      }
    } catch (error) {
      console.log("Error cargando perfil de estilista:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosPerfil();
  }, []);

  const guardarCambios = async () => {
    if (!nombres || !apellido || !correo) {
      Alert.alert("Atención", "Los campos de nombre, apellido y correo son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      const response = await axios.post(`${BASE_URL}/services/update_estilista.php`, {
        idEstilistas: idEstilista,
        nombres,
        apellido,
        correo,
        contrasena: contrasenaBD,
        fechaNacimiento
      });

      if (response.data && response.data.success) {
        Alert.alert("Éxito", "Tus datos han sido actualizados correctamente.");
      } else {
        Alert.alert("Error", response.data.message || "No se pudo actualizar la información.");
      }
    } catch (error) {
      console.log("Error de red al actualizar:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarCambioContrasena = async () => {
    if (!contrasenaActualInput || !nuevaContrasena) {
      Alert.alert("Atención", "Por favor completa ambos campos de contraseña.");
      return;
    }

    if (contrasenaActualInput !== contrasenaBD) {
      Alert.alert("Error", "La contraseña actual es incorrecta.");
      return;
    }

    try {
      setGuardando(true);
      const response = await axios.post(`${BASE_URL}/services/update_estilista.php`, {
        idEstilistas: idEstilista,
        nombres,
        apellido,
        correo,
        contrasena: nuevaContrasena,
        fechaNacimiento
      });

      if (response.data && response.data.success) {
        setContrasenaBD(nuevaContrasena);
        setModalPasswordVisible(false);
        setContrasenaActualInput('');
        setNuevaContrasena('');
        Alert.alert("Éxito", "Contraseña actualizada correctamente.");
      } else {
        Alert.alert("Error", response.data.message || "No se pudo actualizar la contraseña.");
      }
    } catch (error) {
      console.log("Error al actualizar contraseña:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.seccionCatalogo}>
          <Text style={styles.tituloSeccion}>GESTIÓN DE PERFIL</Text>
          <Text style={styles.subtituloSeccion}>Administra tus datos personales.</Text>

          {cargando ? (
            <ActivityIndicator size="small" color="#000000" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.tarjetaUsuario}>
              
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Nombres:</Text>
                <TextInput
                  style={styles.inputEditable}
                  value={nombres}
                  onChangeText={setNombres}
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
                  placeholder="Correo electrónico"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.campoContainerPasswordRow}>
                <View>
                  <Text style={styles.etiqueta}>Contraseña:</Text>
                  <Text style={styles.textoPasswordOculta}>••••••••</Text>
                </View>
                <Pressable 
                  style={styles.botonModificarPassword} 
                  onPress={() => setModalPasswordVisible(true)}
                >
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
                style={[styles.botonGuardar, guardando && { opacity: 0.6 }]} 
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
          )}
        </View>

        {/* Modal de Contraseña */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalPasswordVisible}
          onRequestClose={() => setModalPasswordVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitulo}>Modificar Contraseña</Text>
              <Text style={styles.modalSubtitulo}>Ingresa tu contraseña actual y la nueva clave.</Text>

              <Text style={styles.seccionTituloModal}>Contraseña Actual:</Text>
              <View style={styles.campoContainerModalPassword}>
                <TextInput
                  style={styles.inputModalPassword}
                  value={contrasenaActualInput}
                  onChangeText={setContrasenaActualInput}
                  secureTextEntry={!mostrarActual}
                  placeholder="Contraseña actual"
                  placeholderTextColor="#888"
                />
                <Pressable onPress={() => setMostrarActual(!mostrarActual)}>
                  <Text style={styles.textoVerOcultar}>{mostrarActual ? "Ocultar" : "Mostrar"}</Text>
                </Pressable>
              </View>

              <Text style={styles.seccionTituloModal}>Nueva Contraseña:</Text>
              <View style={styles.campoContainerModalPassword}>
                <TextInput
                  style={styles.inputModalPassword}
                  value={nuevaContrasena}
                  onChangeText={setNuevaContrasena}
                  secureTextEntry={!mostrarNueva}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#888"
                />
                <Pressable onPress={() => setMostrarNueva(!mostrarNueva)}>
                  <Text style={styles.textoVerOcultar}>{mostrarNueva ? "Ocultar" : "Mostrar"}</Text>
                </Pressable>
              </View>

              <View style={styles.modalBotonesContainer}>
                <Pressable 
                  style={[styles.modalBoton, styles.botonCancelarModal]} 
                  onPress={() => setModalPasswordVisible(false)}
                >
                  <Text style={styles.textoBotonCancelar}>Cancelar</Text>
                </Pressable>

                <Pressable 
                  style={[styles.modalBoton, styles.botonGuardarModal]} 
                  onPress={confirmarCambioContrasena}
                >
                  <Text style={styles.textoBotonGuardarModal}>Actualizar</Text>
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 40 },
  seccionCatalogo: { paddingHorizontal: 20, marginBottom: 30, marginTop: 20 },
  tituloSeccion: { fontSize: 22, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  subtituloSeccion: { fontSize: 14, color: '#666666', marginTop: 2, marginBottom: 15 },
  tarjetaUsuario: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campoContainer: { 
    backgroundColor: "#FAFAFA", 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  campoContainerPasswordRow: {
    backgroundColor: "#FAFAFA", 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputEditable: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    paddingVertical: 4,
    marginTop: 2,
  },
  textoPasswordOculta: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
    letterSpacing: 2,
  },
  botonModificarPassword: {
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  textoBotonModificar: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  etiqueta: { fontWeight: "900", fontSize: 13, color: "#000000" },
  botonGuardar: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotonGuardar: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#EEEEEE', elevation: 5 },
  modalTitulo: { fontSize: 20, fontWeight: '900', color: '#000000', marginBottom: 5, textAlign: 'center' },
  modalSubtitulo: { fontSize: 13, color: '#666666', marginBottom: 20, textAlign: 'center' },
  seccionTituloModal: { fontSize: 13, fontWeight: '900', color: '#000000', marginBottom: 6 },
  campoContainerModalPassword: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  inputModalPassword: { flex: 1, fontSize: 14, color: "#333333", paddingVertical: 4 },
  textoVerOcultar: { fontSize: 12, fontWeight: 'bold', color: '#666666', paddingLeft: 10 },
  modalBotonesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBoton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  botonCancelarModal: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  botonGuardarModal: { backgroundColor: '#000000' },
  textoBotonCancelar: { color: '#333333', fontWeight: 'bold' },
  textoBotonGuardarModal: { color: '#FFFFFF', fontWeight: 'bold' },
});