import React, { useState, useCallback } from "react";
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

export default function AgendaSemanal({ navigation }) {
  const [citasAgrupadas, setCitasAgrupadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [totalCitas, setTotalCitas] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState(null);

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

  useFocusEffect(
    useCallback(() => {
      cargarCatalogoServicios();
    }, [])
  );

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

  const guardarCambiosServicios = async () => {
    try {
      const url = `${BASE_URL}/router.php?action=update_servicios_cita`;
      const response = await axios.post(url, {
        idCitas: citaSeleccionadaId,
        servicios: serviciosSeleccionados 
      });

      if (response.data && response.data.success) {
        setModalVisible(false);
        cargarAgenda(); 
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
        return '#2E7D32'; 
      case 'finalizada':
        return '#1565C0'; 
      case 'cancelada':
        return '#C62828'; 
      default:
        return '#E65100'; 
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
          <Text style={styles.tituloPrincipal}>AGENDA SEMANAL</Text>
          <Text style={styles.subtitulo}>
            {cargando ? 'Cargando turnos...' : `Tienes un total de ${totalCitas} citas esta semana.`}
          </Text>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color="#000000" style={{ marginTop: 40 }} />
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

                      <Text style={styles.textoPrecioTotal}>
                        Total: ${cita.precioTotal ? cita.precioTotal : '0'}
                      </Text>
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
                      onFinalizado={() => cargarAgenda()}
                    />
                  </View>
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

            <Text style={[styles.seccionTitulo, { marginTop: 15 }]}>➕ Agregar del Catálogo:</Text>
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
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    marginBottom: 20,
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  grupoDiaContainer: {
    marginBottom: 25,
  },
  diaHeader: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  diaTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'capitalize',
  },
  tarjetaCita: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  zonaNavegable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horaContainer: {
    width: 65,
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
    marginRight: 15,
    justifyContent: 'center',
  },
  textoHora: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  textoCliente: {
    fontSize: 15,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 4, 
  },
  badgeEstado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  textoEstado: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase', 
  },
  tarjetaVacia: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  textoVacio: {
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 14,
  },
  textoServicios: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  accionesFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    width: '100%',
  },
  botonEditarServicios: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textoBotonEditar: {
    fontSize: 12,
    color: '#000000',
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
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitulo: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBotonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  botonCancelarModal: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  botonGuardarModal: {
    backgroundColor: '#000000',
  },
  textoBotonCancelar: {
    color: '#333333',
    fontWeight: 'bold',
  },
  textoBotonGuardar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
  },
  filaServicioActual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  textoServicioActual: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    flex: 1,
  },
  botonEliminar: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textoBotonEliminar: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filaServicioCatalogo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  textoServicioModal: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  precioServicioModal: {
    fontSize: 12,
    color: '#666666',
  },
  botonAgregar: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  textoBotonAgregar: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textoVacioModal: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
  },
  listaContenedor: {
    maxHeight: 140,      
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  textoPrecioTotal: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '900',
    marginTop: 4,
  },
});