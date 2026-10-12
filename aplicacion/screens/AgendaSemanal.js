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

                      <Text style={styles.textoPrecioTotal}>
                        💰 Total: ${cita.precioTotal ? cita.precioTotal : '0'}
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