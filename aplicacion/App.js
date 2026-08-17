import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import axios from "axios";

const API_URL = 'http://192.168.50.65/salonBelleza/api_proyecto/index.php';

export default function App() {
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
    <View style={styles.container}>
      <Text style={styles.titulo}>LISTA DE USUARIOS</Text>

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
              <Text style={styles.etiqueta}>Correo Electrónico:</Text>
              <Text style={styles.valor}>{item.correo}</Text>
            </View>

            <View style={styles.campoContainer}>
              <Text style={styles.etiqueta}>Fecha de Nacimiento:</Text>
              <Text style={styles.valor}>{item.fechaNacimiento}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.formContainer}>
        <TextInput 
          style={styles.formulario}
          placeholder="Nombres"
          value={nombres}
          onChangeText={ (text) => setNombres(text)}
        />

        <TextInput
          style={styles.formulario}
          placeholder="Apellido"
          value={apellido}
          onChangeText={ (text) => setApellido(text)}
        />

        <TextInput 
          style={styles.formulario}
          placeholder="Nombre de Usuario"
          value={nombreUsuario}
          onChangeText={ (text) => setNombreUsuario(text)}
        />

        <TextInput 
          style={styles.formulario}
          placeholder="Correo Electrónico"
          value={correo}
          onChangeText={ (text) => setCorreo(text)}
        />

        <Pressable style={styles.formulario} onPress={abrirSelectorFecha} 
        onChangeText={ (text) => setFechaNacimiento(text)}>
          <Text style={{ color: fechaNacimiento ? '#000' : '#888' }}>
            {fechaNacimiento ? fechaNacimiento : "Seleccionar Fecha de Nacimiento"}
          </Text>
        </Pressable>

        <Pressable style={styles.boton} onPress={crearUsuarios}>
          <Text style={styles.textoBoton}>Crear Usuario</Text>
        </Pressable>
      </View>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    padding: 20,
    backgroundColor: "#e85959",
  },
  titulo: {
    backgroundColor: "#35dd3e",
    fontSize: 20,
    height: 60,
    textAlignVertical: "center",
    textAlign: "center",
    marginBottom: 10,
  },
  lista: {
    flex: 1,
    marginVertical: 10,
  },
  tarjetaUsuario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campoContainer: {
    marginBottom: 10,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  valor: {
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4,
  },
  formContainer: {
    gap: 8,
  },
  formulario: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
  },
  boton: {
    backgroundColor: "#000",
    padding: 12,
    alignItems: "center",
    borderRadius: 5,
  },
  textoBoton: {
    color: "#fff",
    fontWeight: "bold",
  }
});