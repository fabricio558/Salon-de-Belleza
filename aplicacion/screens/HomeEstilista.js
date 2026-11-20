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
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import Header from "../components/header";
import TimerServicio from "../components/TimerServicio";
import AccionesCitaSalon from '../components/AccionesCitaSalon';
import { colors, typography, spacing, radius, shadows, estiloEstadoCita } from '../theme';
import { Boton, Badge, Tarjeta, EstadoVacio, Texto, Titulo } from '../components/ui';
// estado_cita.idEstado: solo las activas (todavía no iniciadas) se pueden reprogramar o cancelar.
const ESTADO_ACTIVA = 1;

export default function HomeEstilista({ navigation }) {
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
        const response = await api.get(`/index.php?action=get_servicios`);
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

  const guardarCambiosServicios = async () => {
    try {
        const url = `/index.php?action=update_servicios_cita`;
        const response = await api.post(url, {
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

        const response = await api.get(`/index.php?action=get_citasDiarias&id_estilistas=${idEstilista}`);
        
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
        <View style={styles.headerTitle}>
          <Titulo nivel="h1">{saludo}, {nombre}</Titulo>
          <Texto variante="bodySmall" color="primaryText" style={styles.subtitulo}>{fechaActual}</Texto>
          <View style={styles.resumen}>
            <Ionicons name="calendar-outline" size={18} color={colors.primaryText} />
            <Texto variante="bodySmall" color="text" style={styles.resumenTexto}>
              Tienes {citasHoy.length} {citasHoy.length === 1 ? 'cita programada' : 'citas programadas'} para hoy.
            </Texto>
          </View>
        </View>

        <View style={styles.agendaContainer}>
          <Titulo nivel="h2" style={styles.tituloSeccion}>Tus turnos de hoy</Titulo>

          {cargandoCitas ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.cargando} />
          ) : citasHoy.length > 0 ? (
            citasHoy.map((cita) => {
              const duracionTexto = calcularDuracion(cita.horaInicioTs, cita.horaFinTs);

              return (
                <Tarjeta
                  key={cita.idCitas}
                  variante="cita"
                  colorBorde={estiloEstadoCita(cita.idEstado).borde}
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
                      <View style={styles.filaCliente}>
                        <Text style={styles.textoCliente} numberOfLines={1}>{cita.nombres} {cita.apellido}</Text>
                        {cita.idEstado ? <Badge estado={cita.idEstado} texto={cita.estado} /> : null}
                      </View>
                      <Text style={styles.textoServicios}>
                        {cita.servicios ? cita.servicios : 'Sin servicios registrados'}
                      </Text>

                      <Text style={styles.textoPrecioTotal}>
                        Total: ${cita.precioTotal ? cita.precioTotal : '0'}
                      </Text>

                      {duracionTexto && (
                        <View style={styles.filaDuracion}>
                          <Ionicons name="timer-outline" size={14} color={colors.success} />
                          <Text style={styles.textoDuracion}>Duración: {duracionTexto}</Text>
                        </View>
                      )}
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
                      onFinalizado={() => cargarDatos()}
                    />
                  </View>

                  {cita.idEstado === ESTADO_ACTIVA && (
                    <AccionesCitaSalon
                      cita={cita}
                      nombreCliente={`${cita.nombres} ${cita.apellido}`}
                      onCambio={() => cargarDatos()}
                    />
                  )}
                </Tarjeta>
              );
            })
          ) : (
            <EstadoVacio
              icono="calendar-clear-outline"
              titulo="Día libre"
              mensaje="No tienes citas programadas para hoy."
            />
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
            <Titulo nivel="h2" centrado>Gestionar servicios</Titulo>
            <Texto variante="bodySmall" color="textMuted" centrado style={styles.modalSubtitulo}>
              Modifica los servicios asignados a este turno.
            </Texto>

            <View style={styles.seccionModal}>
              <Ionicons name="list-outline" size={18} color={colors.primaryText} />
              <Text style={styles.seccionTituloModal}>Servicios en la cita</Text>
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
              <Text style={styles.seccionTituloModal}>Agregar del catálogo</Text>
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
    marginTop: spacing.xxs,
    textTransform: 'capitalize',
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  resumenTexto: {
    marginLeft: spacing.sm,
  },
  agendaContainer: {
    marginBottom: spacing.seccion,
  },
  tituloSeccion: {
    marginBottom: spacing.md,
  },
  cargando: {
    marginTop: spacing.xl,
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
  filaCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  textoCliente: {
    ...typography.bodyStrong,
    color: colors.textStrong,
    flexShrink: 1,
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
  filaDuracion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  textoDuracion: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
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
  seccionTituloModal: {
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
