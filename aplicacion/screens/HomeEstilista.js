import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator,
  Modal
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from "../components/header";
import TimerServicio from "../components/TimerServicio";

export default function StackScreens({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [saludo, setSaludo] = useState('');
  const [fechaActual, setFechaActual] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState(null);

  const [citasHoy, setCitasHoy] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(true);

  const cargarCatalogoServicios = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/router.php?action=get_servicios`);
        if (response.data && response.data.success) {
            setServiciosCatalogo(response.data.data);
        }
    } catch (error) {
        console.log("Error cargando catálogo de servicios:", error);
    }
  };

  useEffect(() => {
    cargarCatalogoServicios();
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

  const abrirModalEdicion = (cita) => {
    setCitaSeleccionadaId(cita.idCitas);

    if (cita.ids_servicios) {
        const idsArray = cita.ids_servicios.split(',').map(id => parseInt(id, 10));
        setServiciosSeleccionados(idsArray);
    } else {
        setServiciosSeleccionados([]);
    }
    
    setModalVisible(true);
  };

  const toggleSeleccionServicio = (idServicio) => {
    if (serviciosSeleccionados.includes(idServicio)) {
        setServiciosSeleccionados(serviciosSeleccionados.filter(id => id !== idServicio));
    } else {
        setServiciosSeleccionados([...serviciosSeleccionados, idServicio]);
    }
  };

  const guardarCambiosServicios = async () => {
    try {
        const url = `${BASE_URL}/router.php?action=update_servicios_cita`;
        const response = await axios.post(url, {
            idCitas: citaSeleccionadaId,
            servicios: serviciosSeleccionados 
        });

        if (response.data && response.data.success) {
            setModalVisible(false);
            cargarDatos(); 
        } else {
            console.log("Error al actualizar:", response.data.message);
        }
    } catch (error) {
        console.log("Error de red al actualizar servicios:", error);
    }
  };

  const agregarServicioACita = (idServicio) => {
    if (!serviciosSeleccionados.includes(idServicio)) {
        setServiciosSeleccionados([...serviciosSeleccionados, idServicio]);
    }
  };

  const eliminarServicioDeCita = (idServicio) => {
    setServiciosSeleccionados(serviciosSeleccionados.filter(id => id !== idServicio));
  };

  const calcularDuracion = (inicioTs, finTs) => {
    if (!inicioTs || !finTs) return null;
    const duracionSegundos = Math.max(0, parseInt(finTs, 10) - parseInt(inicioTs, 10));
    const minutos = Math.floor(duracionSegundos / 60);
    const segundos = duracionSegundos % 60;

    if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const minsRestantes = minutos % 60;
      return `${horas}h ${minsRestantes}m`;
    }
    return `${minutos} min ${segundos} seg`;
  };

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

  useFocusEffect(
    useCallback(() => {
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
            citasHoy.map((cita) => {
              const duracionTexto = calcularDuracion(cita.horaInicioTs, cita.horaFinTs);

              return (
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
                      <Text style={styles.textoServicios}>
                        {cita.servicios ? cita.servicios : 'Sin servicios registrados'}
                      </Text>
                    
                      <Text style={styles.textoPrecioTotal}>
                        💰 Total: ${cita.precioTotal ? cita.precioTotal : '0'}
                      </Text>
                    
                      {duracionTexto && (
                        <Text style={{color: '#81C784', fontWeight: 'bold', marginTop: 5}}>
                          ⏱️ Duración: {duracionTexto}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.accionesFila}>
                    <Pressable 
                      style={styles.botonEditarServicios}
                      onPress={() => abrirModalEdicion(cita)}
                    >
                      <Text style={styles.textoBotonEditar}>✏️ Modificar Servicios</Text>
                    </Pressable>

                    <TimerServicio
                      idCitas={cita.idCitas}
                      horaInicioTs={cita.horaInicioTs}
                      horaFinTs={cita.horaFinTs}
                      onFinalizado={() => cargarDatos()} 
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.tarjetaVacia}>
              <Text style={styles.textoVacio}>No tienes citas programadas para hoy.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Gestionar Servicios</Text>
            <Text style={styles.modalSubtitulo}>Modifica los servicios asignados a este turno:</Text>

            <Text style={styles.seccionTitulo}>📋 Servicios en la Cita:</Text>
            <ScrollView style={styles.listaContenedor}>
              {serviciosSeleccionados.length > 0 ? (
                serviciosSeleccionados.map((idServ) => {
                  const servInfo = serviciosCatalogo.find(s => s.idServicios == idServ);
                  
                  return (
                    <View key={idServ} style={styles.filaServicioActual}>
                      <Text style={styles.textoServicioActual}>
                        {servInfo ? servInfo.servicio : 'Cargando servicio...'}
                      </Text>
                      <Pressable 
                        style={styles.botonEliminar} 
                        onPress={() => eliminarServicioDeCita(idServ)}
                      >
                        <Text style={styles.textoBotonEliminar}>🗑️ Quitar</Text>
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.textoVacioModal}>No hay servicios en esta cita.</Text>
              )}
            </ScrollView>

            <Text style={[styles.seccionTitulo, { marginTop: 10 }]}>➕ Agregar del Catálogo:</Text>
            <ScrollView style={styles.listaContenedor}>
              {serviciosCatalogo
                .filter(serv => !serviciosSeleccionados.includes(serv.idServicios))
                .map((serv) => (
                  <View key={serv.idServicios} style={styles.filaServicioCatalogo}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.textoServicioModal}>{serv.servicio}</Text>
                      <Text style={styles.precioServicioModal}>${serv.precio}</Text>
                    </View>
                    <Pressable 
                      style={styles.botonAgregar} 
                      onPress={() => agregarServicioACita(serv.idServicios)}
                    >
                      <Text style={styles.textoBotonAgregar}>➕ Agregar</Text>
                    </Pressable>
                  </View>
                ))}
            </ScrollView>

            <View style={styles.modalBotonesContainer}>
              <Pressable 
                style={[styles.modalBoton, styles.botonCancelarModal]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textoBotonCancelar}>Cancelar</Text>
              </Pressable>

              <Pressable 
                style={[styles.modalBoton, styles.botonGuardarModal]} 
                onPress={guardarCambiosServicios}
              >
                <Text style={styles.textoBotonGuardar}>Guardar Cambios</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    elevation: 2,
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
  textoServicios: {
    fontSize: 13,
    color: '#8D8B94',
    marginTop: 2,
  },
  accionesFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    width: '100%',
  },
  botonEditarServicios: {
    backgroundColor: '#efb7da',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  textoBotonEditar: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B8838A',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitulo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    marginVertical: 10,
  },
  modalBotonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  botonCancelarModal: {
    backgroundColor: '#E0E0E0',
  },
  botonGuardarModal: {
    backgroundColor: '#B8838A',
  },
  textoBotonCancelar: {
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  textoBotonGuardar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B8838A',
    marginBottom: 5,
  },
  contenedorSeccionLista: {
    maxHeight: 730,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 5,
  },
  filaServicioActual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  textoServicioActual: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '600',
    flex: 1,
  },
  botonEliminar: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textoBotonEliminar: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filaServicioCatalogo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textoServicioModal: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  precioServicioModal: {
    fontSize: 13,
    color: '#888',
  },
  botonAgregar: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  textoBotonAgregar: {
    color: '#388E3C',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textoVacioModal: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  listaContenedor: {
    maxHeight: 130,      
    marginBottom: 5,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  textoPrecioTotal: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginTop: 4,
  },
});