import React, { useState, useCallback } from "react";
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
import TimerServicio from "../components/TimerServicio";

export default function AgendaSemanal({ navigation }) {
  const [citasAgrupadas, setCitasAgrupadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [totalCitas, setTotalCitas] = useState(0);

  const formatearFecha = (fechaString) => {
    const partes = fechaString.split('-'); 
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const formateada = fecha.toLocaleDateString('es-ES', opciones);
    return formateada.charAt(0).toUpperCase() + formateada.slice(1);
  };

  const agruparCitasPorDia = (citasArray) => {
    const grupos = {};
    citasArray.forEach(cita => {
      if (!grupos[cita.fecha]) {
        grupos[cita.fecha] = [];
      }
      grupos[cita.fecha].push(cita);
    });

    return Object.keys(grupos).map(fecha => ({
      fechaOriginal: fecha,
      tituloDia: formatearFecha(fecha),
      turnos: grupos[fecha]
    }));
  };

  const obtenerColorEstado = (estado) => {
    const estadoLimpio = (estado || 'Pendiente').toLowerCase().trim();
    
    switch (estadoLimpio) {
      case 'activa':
        return '#81C784'; 
      case 'finalizada':
        return '#64B5F6'; 
      case 'cancelada':
        return '#E57373'; 
      default:
        return '#FFB74D'; 
    }
  };

  const cargarAgenda = async () => {
    try {
      setCargando(true);
      const session = await AsyncStorage.getItem('user_session');
      
      if (session) {
        const userData = JSON.parse(session);
        const idEstilista = userData.idEstilistas || userData.idUsuarios || userData.id;
        
        if (!idEstilista) return;

        const url = `${BASE_URL}/services/get_citasSemanal.php?id_estilistas=${idEstilista}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.success) {
          const citas = response.data.data;
          setTotalCitas(citas.length);
          setCitasAgrupadas(agruparCitasPorDia(citas));
        } else {
          setTotalCitas(0);
          setCitasAgrupadas([]);
        }
      }
    } catch (error) {
      console.log("Error cargando agenda semanal:", error);
      setCitasAgrupadas([]);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarAgenda();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTitle}>
          <Text style={styles.tituloPrincipal}>Tus Citas de Esta Semana</Text>
          <Text style={styles.subtitulo}>
            {cargando ? 'Cargando turnos...' : `Tienes un total de ${totalCitas} citas esta semana.`}
          </Text>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color="#B8838A" style={{ marginTop: 40 }} />
        ) : citasAgrupadas.length > 0 ? (
          citasAgrupadas.map((grupoDia, index) => (
            <View key={index} style={styles.grupoDiaContainer}>
              <View style={styles.diaHeader}>
                <Text style={styles.diaTexto}>{grupoDia.tituloDia}</Text>
              </View>

              {grupoDia.turnos.map((cita) => (
              <View key={cita.idCitas} style={styles.tarjetaCita}>
                
                <Pressable 
                  style={styles.zonaNavegable}
                  onPress={() => navigation.navigate('FichaCliente', { id_clientes: cita.idClientes })}
                >
                  <View style={styles.horaContainer}>
                    <Text style={styles.textoHora}>{cita.hora}</Text>
                  </View>
            
                  <View style={styles.infoContainer}>
                    <Text style={styles.textoCliente}>{cita.nombres} {cita.apellido}</Text>
                    <View style={[styles.badgeEstado, { backgroundColor: obtenerColorEstado(cita.estado) }]}>
                      <Text style={styles.textoEstado}>{cita.estado || 'Pendiente'}</Text>
                    </View>
                    <Text style={styles.textoServicios}>
                      {cita.servicios ? cita.servicios : 'Sin servicios registrados'}
                    </Text>
                  </View>
                </Pressable>

                <TimerServicio
                idCitas={cita.idCitas}
                horaInicioTs={cita.horaInicioTs}
                horaFinTs={cita.horaFinTs}
                onFinalizado={() => cargarAgenda()}
                />
              </View>
            ))}
            </View>
          ))
        ) : (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.textoVacio}>No hay citas programadas para el resto de la semana.</Text>
          </View>
        )}
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
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerTitle: {
    marginHorizontal: 15,
    marginBottom: 20,
    paddingTop: 10,
  },
  tituloPrincipal: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  subtitulo: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
  },
  grupoDiaContainer: {
    marginHorizontal: 15,
    marginBottom: 25,
  },
  diaHeader: {
    backgroundColor: '#efb7da',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  diaTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textTransform: 'capitalize',
  },
  tarjetaCita: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 1,
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
    justifyContent: 'center',
  },
  textoCliente: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '600',
    marginBottom: 4, 
  },
  badgeEstado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  textoEstado: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase', 
  },
  tarjetaVacia: {
    marginHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6d3c6',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  textoVacio: {
    color: '#8D8B94',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 15,
  },

  textoServicios: {
  fontSize: 13,
  color: '#8D8B94',
  marginTop: 2,
},
  tarjetaCita: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  marginBottom: 10,
  padding: 15,
  elevation: 1,
  borderLeftWidth: 4,
  borderLeftColor: '#B8838A',
  
},
zonaNavegable: {
  flexDirection: 'row',
  alignItems: 'center',
},
horaContainer: {
  width: 60,
  borderRightWidth: 1,
  borderRightColor: '#F0F0F0',
  marginRight: 15,
},
});