import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { useRoute } from '@react-navigation/native';
import BASE_URL from "../direcIP/ip";
import axios from "axios";
import Header from "../components/header"; 

export default function FichaCliente({ navigation }) {
  const route = useRoute();
  const idClientes = route.params?.id_clientes ?? route.params?.id_clientes;

  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarCliente = async () => {
    try {
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
      <Header navigation={navigation} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cuerpo}>
          <View style={styles.usuarioLista}>
            <Text style={styles.textoLista}>DETALLES DEL CLIENTE</Text>
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color="#000000" style={{ marginTop: 20 }} />
          ) : !cliente ? (
            <Text style={styles.textoVacio}>
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
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  scrollContent: { 
    paddingTop: 15, 
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  cuerpo: { 
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
  usuarioLista: { 
    marginBottom: 15, 
    paddingVertical: 6, 
    alignItems: "center" 
  },
  textoLista: { 
    color: "#000000", 
    fontSize: 22, 
    fontWeight: "900", 
    letterSpacing: 0.5 
  },
  tarjetaUsuario: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 8,
  },
  campoContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    backgroundColor: "#FAFAFA", 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  etiqueta: { 
    fontWeight: "900", 
    fontSize: 14, 
    color: "#000000" 
  },
  valor: { 
    fontSize: 14, 
    color: "#333333",
    fontWeight: "500",
  },
  textoVacio: {
    textAlign: 'center', 
    marginTop: 20, 
    color: '#666666',
    fontStyle: 'italic',
  },
});