import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, FlatList } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import axios from "axios";


const API_URL = 'http://192.168.50.65/salonBelleza/api_proyecto/index.php';


export default function StackScreens({ navigation }) {

  const [usuarios, setUsuarios] = useState([]);
  const [nombres, setNombres] = useState('');
  const [apellido, setApellido] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(API_URL);
      setUsuarios(response.data);
    } catch (error) {
      console.log("Error al cargar los usuarios", error);
    }
  };

  const crearUsuarios = async () => {
    try {
      await axios.post(API_URL, {
        nombres,
        apellido, 
        nombreUsuario,
        fechaNacimiento,
        correo
      });
      cargarUsuarios();
      setNombres('');
      setApellido('');
      setNombreUsuario('');
      setFechaNacimiento('');
      setCorreo('');
    } catch (error) {
      console.log("Error al crear usuario", error);
    }
  };

  const abrirSelectorFecha = () => {
    DateTimePickerAndroid.open({
      value: fechaNacimiento ? new Date(fechaNacimiento) : new Date(),
      mode: 'date',
      is24Hour: true,
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          const fechaFormateada = date.toISOString().split('T')[0];
          setFechaNacimiento(fechaFormateada);
        }
      },
    });
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

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
                <Text style={styles.textoLista}>LISTA DE USUARIOS</Text>
              </View>
        <FlatList 
          style={styles.lista}
          data={usuarios}
          keyExtractor={(item, index) => (item?.idUsuarios ? item.idUsuarios.toString() : index.toString())}
          renderItem={({ item }) => (

            <View style={styles.tarjetaUsuario}>

              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Nombre:</Text>
                <Text style={styles.valor}>{item.nombres}</Text>
              </View>
        
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Apellido:</Text>
                <Text style={styles.valor}>{item.apellido}</Text>
              </View>

              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Nombre de Usuario:</Text>
                <Text style={styles.valor}>{item.nombreUsuario}</Text>
              </View>
        
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Correo:</Text>
                <Text style={styles.valor}>{item.correo}</Text>
              </View>
  
              <View style={styles.campoContainer}>
                <Text style={styles.etiqueta}>Fecha de Nacimiento:</Text>
                <Text style={styles.valor}>{item.fechaNacimiento}</Text>
              </View>
            </View>
          )}
        />
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
    flexDirection: 'row', 
    alignItems: 'center',
    zIndex: 1,
    elevation: 3,
  },
  hamburgerButton: {
    padding: 8,
    marginRight: 10,
  },
  hamburgerIcon: {
    fontSize: 26,
    color: '#B8838A',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 30, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  subtitle: {
    fontSize: 13,
    color: '#8D8B94',
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
  body: {
    backgroundColor: "#efb7da",
    marginLeft: 15,
    marginRight: 15,
    borderRadius: 15,
    height: 225,
    marginBottom: 15,
    padding: 10, 
  },

  /* --- ESTILOS DE LA LISTA ACTUALIZADOS --- */
  cuerpo: {
    backgroundColor: "#F9F3EE",
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2D2C6",
  },
  
  usuarioLista: {
    backgroundColor: "transparent",
    marginBottom: 10,
    paddingVertical: 6,
    alignItems: "center",
  },

  textoLista: {
    color: "#B8838A",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  lista: {
    backgroundColor: "transparent",
  },

  tarjetaUsuario: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  campoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAF6F3",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },

  etiqueta: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#8E6E73",
  },

  valor: {
    fontSize: 14,
    color: "#4A4A4A",
  },
});