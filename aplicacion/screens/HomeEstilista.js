import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from "../components/header";

export default function StackScreens({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [saludo, setSaludo] = useState('');
  const [fechaActual, setFechaActual] = useState('');
  
  const [citasHoy, setCitasHoy] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(true);

  useEffect(() => {
    const determinarSaludo = () => {
      const horaActual = new Date().getHours();
      if (horaActual >= 6 && horaActual < 12) setSaludo('Buenos días');
      else if (horaActual >= 12 && horaActual < 20) setSaludo('Buenas tardes');
      else setSaludo('Buenas noches');
    };

    const obtenerFecha = () => {
      const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const fecha = new Date().toLocaleDateString('es-ES', opciones);
      setFechaActual(fecha.charAt(0).toUpperCase() + fecha.slice(1));
    };

    determinarSaludo();
    obtenerFecha();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cargarDatos = async () => {
        try {
          setCargandoCitas(true);
          const session = await AsyncStorage.getItem('user_session');
          
          if (session) {
            const userData = JSON.parse(session);
            setNombre(userData.nombres || 'Estilista');
            
            const idEstilista = userData.idEstilistas || userData.idUsuarios || userData.id;
            
            if (!idEstilista) {
              setCargandoCitas(false);
              return;
            }

            const response = await axios.get(`${BASE_URL}/services/get_citasDiarias.php?id_estilistas=${idEstilista}`);
            
            if (response.data && response.data.success) {
              setCitasHoy(response.data.data);
            } else {
              setCitasHoy([]);
            }
          }
        } catch (error) {
          console.log("Error cargando el dashboard:", error);
          setCitasHoy([]);
        } finally {
          setCargandoCitas(false);
        }
      };

      cargarDatos();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Text style={styles.saludo}>{saludo}, {nombre}</Text>
          <Text style={styles.agenda}>{fechaActual}</Text>
          <Text style={styles.resumenTexto}>
            Tienes {citasHoy.length} {citasHoy.length === 1 ? 'cita programada' : 'citas programadas'} para hoy.
          </Text>
        </View>

        <View style={styles.agendaContainer}>
          <Text style={styles.tituloSeccion}>Tus Turnos de Hoy</Text>
          
          {cargandoCitas ? (
            <ActivityIndicator size="large" color="#B8838A" style={{ marginTop: 20 }} />
          ) : citasHoy.length > 0 ? (
            citasHoy.map((cita) => (
              <Pressable 
                key={cita.idCitas} 
                style={styles.tarjetaCita}
                onPress={() => navigation.navigate('FichaCliente', { id_clientes: cita.idClientes })}
              >
                <View style={styles.horaContainer}>
                  <Text style={styles.textoHora}>{cita.hora}</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.textoCliente}>{cita.nombres} {cita.apellido}</Text>
                  <Text style={styles.textoServicios}>
                    {cita.servicios ? cita.servicios : 'Sin servicios registrados'}
                  </Text>
                </View>
                
              </Pressable>
            ))
          ) : (
            <View style={styles.tarjetaVacia}>
              <Text style={styles.textoVacio}>No tienes citas programadas para hoy.</Text>
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
    backgroundColor: "#e1cec2",
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
  body: {
    backgroundColor: "#efb7da",
    marginHorizontal: 15,
    borderRadius: 15,
    paddingVertical: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3,
  },
  saludo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: "center",
    color: '#B8838A',
    marginBottom: 5,
  },
  agenda: {
    fontSize: 16,
    textAlign: "center",
    color: '#4A4A4A',
    textTransform: 'capitalize',
    marginBottom: 15,
  },
  resumenTexto: {
    fontSize: 14,
    color: '#8D8B94',
    fontWeight: '600',
  },
  agendaContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B8838A',
    marginBottom: 15,
  },
  tarjetaCita: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#B8838A',
  },
  horaContainer: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
    marginRight: 15,
  },
  textoHora: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  infoContainer: {
    flex: 1,
  },
  textoCliente: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  tarjetaVacia: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6d3c6',
    borderStyle: 'dashed',
  },
  textoVacio: {
    color: '#8D8B94',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: "#1295e0",
    justifyContent: "center",
    alignItems: "center",
    height: 45,
    marginHorizontal: 15,
    borderRadius: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  textoServicios: {
  fontSize: 13,
  color: '#8D8B94',
  marginTop: 2,
},
});