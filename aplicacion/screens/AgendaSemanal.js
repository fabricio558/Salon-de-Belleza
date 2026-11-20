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
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import Header from "../components/header";
import TimerServicio from "../components/TimerServicio";
import AccionesCitaSalon from '../components/AccionesCitaSalon';
import { colors, typography, spacing, radius, shadows, estiloEstadoCita } from '../theme';
import { Boton, Badge, Tarjeta, EstadoVacio, Texto, Titulo } from '../components/ui';

// estado_cita.idEstado: solo las activas (todavía no iniciadas) se pueden reprogramar o cancelar.
const ESTADO_ACTIVA = 1;

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
      const response = await api.get(`/index.php?action=get_servicios`);
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
      const url = `/index.php?action=update_servicios_cita`;
      const response = await api.post(url, {
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

  // Los colores de cada estado están en theme/theme.js (estiloEstadoCita).

  const cargarAgenda = async () => {
    try {
      setCargando(true);
      const session = await AsyncStorage.getItem('user_session');
      
      if (session) {
        const userData = JSON.parse(session);
        const idEstilista = userData.idEstilistas || userData.idUsuarios || userData.id;
        
        if (!idEstilista) return;

        const url = `/index.php?action=get_citasSemanal&id_estilistas=${idEstilista}`;
        const response = await api.get(url);
        
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
          <Titulo nivel="h1">Agenda semanal</Titulo>
          <Texto variante="bodySmall" color="textMuted" style={styles.subtitulo}>
            {cargando ? 'Cargando turnos...' : `Tienes un total de ${totalCitas} citas esta semana.`}
          </Texto>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.cargando} />
        ) : citasAgrupadas.length > 0 ? (
          citasAgrupadas.map((grupoDia, index) => (
            <View key={index} style={styles.grupoDiaContainer}>
              <View style={styles.diaHeader}>
                <Ionicons name="calendar-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.diaTexto}>{grupoDia.tituloDia}</Text>
              </View>

              {grupoDia.turnos.map((cita) => (
                <Tarjeta
                  key={cita.idCitas}
                  variante="cita"
                  colorBorde={estiloEstadoCita(cita.idEstado ?? cita.estado).borde}
                >
                  <Pressable
                    style={({ pressed }) => [styles.zonaNavegable, pressed && styles.zonaPresionada]}
                    onPress={() => navigation.navigate('FichaCliente', { id_clientes: cita.idClientes })}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ficha de ${cita.nombres} ${cita.apellido}, ${cita.hora}`}
                  >
                    <View style={styles.horaContainer}>
                      <Text style={styles.textoHora}>{cita.hora}</Text>
                    </View>

                    <View style={styles.infoContainer}>
                      <Text style={styles.textoCliente}>{cita.nombres} {cita.apellido}</Text>
                      <Badge
                        estado={cita.idEstado ?? cita.estado}
                        texto={cita.estado || 'Pendiente'}
                        style={styles.badgeEstado}
                      />
                      <Text style={styles.textoServicios}>
                        {cita.servicios ? cita.servicios : 'Sin servicios registrados'}
                      </Text>

                      <Text style={styles.textoPrecioTotal}>
                        Total: ${cita.precioTotal ? cita.precioTotal : '0'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>

                  <View style={styles.accionesFila}>
                    <Boton
                      titulo="Modificar servicios"
                      variante="outline"
                      tamano="sm"
                      icono="create-outline"
                      onPress={() => abrirModalEdicion(cita)}
                    />

                    <TimerServicio
                      idCitas={cita.idCitas}
                      horaInicioTs={cita.horaInicioTs}
                      horaFinTs={cita.horaFinTs}
                      onFinalizado={() => cargarAgenda()}
                    />
                  </View>

                  {cita.idEstado === ESTADO_ACTIVA && (
                    <AccionesCitaSalon
                      cita={cita}
                      nombreCliente={`${cita.nombres} ${cita.apellido}`}
                      onCambio={() => cargarAgenda()}
                    />
                  )}
                </Tarjeta>
              ))}
            </View>
          ))
        ) : (
          <EstadoVacio
            icono="calendar-clear-outline"
            titulo="Semana despejada"
            mensaje="No hay citas programadas para el resto de la semana."
          />
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
            <Titulo nivel="h2" centrado>Gestionar servicios</Titulo>
            <Texto variante="bodySmall" color="textMuted" centrado style={styles.modalSubtitulo}>
              Modifica los servicios asignados a este turno.
            </Texto>

            <View style={styles.seccionModal}>
              <Ionicons name="list-outline" size={18} color={colors.primaryText} />
              <Text style={styles.seccionTitulo}>Servicios en la cita</Text>
            </View>
            <ScrollView style={styles.listaContenedor}>
              {serviciosSeleccionados.length > 0 ? (
                serviciosSeleccionados.map((idServ) => {
                  const servInfo = serviciosCatalogo.find(s => s.idServicios == idServ);

                  return (
                    <View key={idServ} style={styles.filaServicio}>
                      <Text style={styles.textoServicioActual}>
                        {servInfo ? servInfo.servicio : 'Cargando servicio...'}
                      </Text>
                      <Boton
                        titulo="Quitar"
                        variante="danger"
                        tamano="sm"
                        icono="trash-outline"
                        onPress={() => eliminarServicioDeCita(idServ)}
                        accessibilityLabel={`Quitar ${servInfo ? servInfo.servicio : 'servicio'}`}
                      />
                    </View>
                  );
                })
              ) : (
                <Text style={styles.textoVacioModal}>No hay servicios en esta cita.</Text>
              )}
            </ScrollView>

            <View style={[styles.seccionModal, styles.seccionModalSeparada]}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
              <Text style={styles.seccionTitulo}>Agregar del catálogo</Text>
            </View>
            <ScrollView style={styles.listaContenedor}>
              {serviciosCatalogo
                .filter(serv => !serviciosSeleccionados.includes(serv.idServicios))
                .map((serv) => (
                  <View key={serv.idServicios} style={styles.filaServicio}>
                    <View style={styles.infoServicioModal}>
                      <Text style={styles.textoServicioModal}>{serv.servicio}</Text>
                      <Text style={styles.precioServicioModal}>${serv.precio}</Text>
                    </View>
                    <Boton
                      titulo="Agregar"
                      variante="secondary"
                      tamano="sm"
                      icono="add"
                      onPress={() => agregarServicioACita(serv.idServicios)}
                      accessibilityLabel={`Agregar ${serv.servicio}`}
                    />
                  </View>
                ))}
            </ScrollView>

            <View style={styles.modalBotonesContainer}>
              <Boton
                titulo="Cancelar"
                variante="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalBoton}
              />
              <Boton
                titulo="Guardar cambios"
                onPress={guardarCambiosServicios}
                style={styles.modalBoton}
              />
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.pantalla,
  },
  headerTitle: {
    marginBottom: spacing.seccion,
  },
  subtitulo: {
    marginTop: spacing.xs,
  },
  cargando: {
    marginTop: spacing.xxl,
  },
  grupoDiaContainer: {
    marginBottom: spacing.seccion,
  },
  // Cabecera de día editorial: etiqueta en mayúsculas espaciadas sobre una línea
  // fina que cruza la pantalla, en lugar de una "píldora" de color.
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  diaTexto: {
    ...typography.label,
    fontSize: 12,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  zonaNavegable: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing.toqueMinimo,
    borderRadius: radius.md,
  },
  zonaPresionada: {
    backgroundColor: colors.surfaceSubtle,
  },
  horaContainer: {
    width: 64,
    paddingVertical: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  textoHora: {
    ...typography.h3,
    fontSize: 17,
    color: colors.textStrong,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  textoCliente: {
    ...typography.bodyStrong,
    color: colors.textStrong,
  },
  badgeEstado: {
    marginVertical: spacing.xs,
  },
  textoServicios: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  textoPrecioTotal: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.primaryText,
  },
  accionesFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalSubtitulo: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  seccionModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seccionModalSeparada: {
    marginTop: spacing.lg,
  },
  seccionTitulo: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textStrong,
    marginLeft: spacing.sm,
  },
  listaContenedor: {
    maxHeight: 160,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filaServicio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  textoServicioActual: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  infoServicioModal: {
    flex: 1,
  },
  textoServicioModal: {
    ...typography.bodySmall,
    color: colors.text,
  },
  precioServicioModal: {
    ...typography.caption,
    color: colors.textMuted,
  },
  textoVacioModal: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  modalBotonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalBoton: {
    flex: 1,
  },
});
