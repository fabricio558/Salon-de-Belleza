import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { useRoute } from '@react-navigation/native';
import BASE_URL from "../direcIP/ip";
import axios from "axios";

export default function FichaCliente({ navigation }) {
  const route = useRoute();
  
  // Atrapamos el ID enviado desde AgendaSemanal
  const idClientes = route.params?.id_clientes ?? route.params?.id_clientes;

  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarCliente = async () => {
    try {
      // Reemplazamos API_URL por la variable global BASE_URL
      const response = await axios.get(`${BASE_URL}/index.php?action=get_clientes&id=${idClientes}`);
      
      if (response.data.success) {
        setCliente(response.data.data);
      } else {
        console.log("No se encontró el cliente:", response.data.message);
      }
    } catch (error) {
      console.log("Error al cargar el cliente:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (idClientes) {
      cargarCliente();
    } else {
      setCargando(false);
    }
  }, [idClientes]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.hamburgerButton} 
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Mandala</Text>
          <Text style={styles.subtitle}>Tu Centro de Belleza de Confianza</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cuerpo}>
          <View style={styles.usuarioLista}>
            <Text style={styles.textoLista}>DETALLES DEL CLIENTE</Text>
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color="#B8838A" style={{ marginTop: 20 }} />
          ) : !cliente ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#8E6E73' }}>
              Por favor seleccione un cliente desde la Agenda para ver su ficha.
            </Text>
          ) : (
            <View style={styles.tarjetaUsuario}>
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Nombre:</Text>
                <Text style={styles.valor}>{cliente.nombres} {cliente.apellido}</Text>
              </View>
            
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Correo:</Text>
                <Text style={styles.valor}>{cliente.correo}</Text>
              </View>
            
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Fecha de Nacimiento:</Text>
                <Text style={styles.valor}>{cliente.fechaNacimiento}</Text>
              </View>
            
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Alergias:</Text>
                <Text style={styles.valor}>{cliente.notaAlergias ?? 'Ninguna'}</Text>
              </View>
            
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Preferencias:</Text>
                <Text style={styles.valor}>{cliente.notaPreferencias ?? 'Ninguna'}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e1cec2" },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20, backgroundColor: '#e6d3c6', flexDirection: 'row', alignItems: 'center', zIndex: 1, elevation: 3 },
  hamburgerButton: { padding: 8, marginRight: 10 },
  hamburgerIcon: { fontSize: 26, color: '#B8838A', fontWeight: 'bold' },
  headerTitleContainer: { flex: 1, alignItems: 'center', marginRight: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B8838A' },
  subtitle: { fontSize: 13, color: '#8D8B94', marginTop: 2 },
  scrollContent: { paddingTop: 15, paddingBottom: 30 },
  cuerpo: { backgroundColor: "#F9F3EE", marginHorizontal: 15, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E2D2C6" },
  usuarioLista: { backgroundColor: "transparent", marginBottom: 10, paddingVertical: 6, alignItems: "center" },
  textoLista: { color: "#B8838A", fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  tarjetaUsuario: { backgroundColor: "#FFFFFF", marginBottom: 12, padding: 14, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  campoContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FAF6F3", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginBottom: 6 },
  etiqueta: { fontWeight: "bold", fontSize: 14, color: "#8E6E73" },
  valor: { fontSize: 14, color: "#4A4A4A" },
});