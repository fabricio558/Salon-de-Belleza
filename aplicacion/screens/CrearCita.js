import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { validarHorario, formatearFechaHora } from '../utils/horarios';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { normalizarTexto } from '../utils/texto';
import Header from "../components/header";
import AgendaDisponibilidad from '../components/AgendaDisponibilidad';
import BuscadorServicios from '../components/BuscadorServicios';
import { formatearFecha, isoDesdeDate, horaDesdeDate, dateDesdeFechaHora } from '../utils/fechas';
import { colors, typography, spacing, radius } from '../theme';
import { Boton, Chip, Input, Tarjeta, Texto, Titulo } from '../components/ui';

const ROL_RECEPCIONISTA = 3;
const MAX_CLIENTES_SUGERIDOS = 6;

// Reserva de citas. La usan dos roles:
// - cliente: la cita es para el usuario de la sesión;
// - recepcionista: elige primero el cliente que pide la cita.
export default function CrearCita({ navigation }) {
  const [idClientes, setIdClientes] = useState(null);

  const [esRecepcionista, setEsRecepcionista] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  const [servicios, setServicios] = useState([]);
  const [estilistas, setEstilistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [estilistaSeleccionado, setEstilistaSeleccionado] = useState(null);
  // null hasta que se elige en la agenda (o en el selector manual).
  const [fechaHora, setFechaHora] = useState(null);
  const seleccion = fechaHora ? { fecha: isoDesdeDate(fechaHora), hora: horaDesdeDate(fechaHora) } : null;

  // Desde la agenda llegan textos 'AAAA-MM-DD' y 'HH:MM' en hora del salón.
  const elegirHorario = (fecha, hora) => {
    setFechaHora(fecha ? dateDesdeFechaHora(fecha, hora) : null);
  };
  const [enviando, setEnviando] = useState(false);

  const cargarDatos = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      const userData = session ? JSON.parse(session) : null;

      if (!userData || !userData.idUsuarios) {
        Alert.alert("Atención", "No se encontró tu sesión. Por favor, volvé a iniciar sesión.");
        return;
      }

      const recepcion = userData.idRol === ROL_RECEPCIONISTA;
      setEsRecepcionista(recepcion);
      if (!recepcion) {
        setIdClientes(userData.idUsuarios);
      }

      const pedidos = [
        api.get(`/index.php?action=get_servicios`),
        api.get(`/index.php?action=get_estilistas`),
      ];
      if (recepcion) {
        pedidos.push(api.get(`/index.php?action=get_clientes_lista&idSolicitante=${userData.idUsuarios}`));
      }
      const [resServicios, resEstilistas, resClientes] = await Promise.all(pedidos);

      if (resServicios.data.success) setServicios(resServicios.data.data);
      if (resEstilistas.data.success) setEstilistas(resEstilistas.data.data);
      if (resClientes) {
        if (esRespuestaValida(resClientes.data) && resClientes.data.success) {
          setClientes(resClientes.data.data);
        } else {
          Alert.alert('Atención', resClientes.data?.message || 'No se pudo cargar la lista de clientes.');
        }
      }
    } catch (error) {
      console.log("Error al cargar datos:", error);
      Alert.alert('Error', mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  };

  const textoBusquedaCliente = normalizarTexto(busquedaCliente.trim());
  const clientesSugeridos = textoBusquedaCliente
    ? clientes
      .filter((c) => normalizarTexto(`${c.nombres} ${c.apellido} ${c.correo}`).includes(textoBusquedaCliente))
      .slice(0, MAX_CLIENTES_SUGERIDOS)
    : [];

  const elegirCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleServicio = (servicio) => {
    setServiciosSeleccionados((prev) => {
      const yaExiste = prev.find((s) => s.idServicios === servicio.idServicios);
      if (yaExiste) {
        return prev.filter((s) => s.idServicios !== servicio.idServicios);
      }
      return [
        ...prev,
        {
          idServicios: servicio.idServicios,
          servicio: servicio.servicio,
          precio: parseFloat(servicio.precio),
          cantidad: 1,
        },
      ];
    });
  };

  const cambiarCantidad = (idServicios, delta) => {
    setServiciosSeleccionados((prev) =>
      prev.map((s) =>
        s.idServicios === idServicios
          ? { ...s, cantidad: Math.max(1, s.cantidad + delta) }
          : s
      )
    );
  };

  const calcularSubtotal = (servicio) => servicio.precio * servicio.cantidad;

  const calcularTotal = () =>
    serviciosSeleccionados.reduce((acc, s) => acc + calcularSubtotal(s), 0);

  const abrirSelectorFecha = () => {
    DateTimePickerAndroid.open({
      value: fechaHora || new Date(),
      mode: "date",
      is24Hour: true,
      onChange: (event, date) => {
        if (event.type === "set" && date) {
          if (date.getDay() === 0) {
            Alert.alert("Horario no disponible", "El local permanece cerrado los domingos.");
            return;
          }

          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            is24Hour: true,
            onChange: (event2, hora) => {
              if (event2.type === "set" && hora) {
                const fechaCompleta = new Date(date);
                fechaCompleta.setHours(hora.getHours());
                fechaCompleta.setMinutes(hora.getMinutes());

                
                const validacion = validarHorario(fechaCompleta);
                if (!validacion.valido) {
                  Alert.alert("Horario no disponible", validacion.mensaje);
                  return;
                }

                setFechaHora(fechaCompleta);
              }
            },
          });
        }
      },
    });
  };

  const confirmarCita = async () => {
    const idClienteCita = esRecepcionista ? clienteSeleccionado?.idClientes : idClientes;
    if (!idClienteCita) {
      Alert.alert(
        'Atención',
        esRecepcionista ? 'Elegí el cliente que solicita la cita.' : 'No se identificó tu usuario. Volvé a iniciar sesión.'
      );
      return;
    }
    if (!estilistaSeleccionado) {
      Alert.alert("Atención", "Seleccioná un estilista");
      return;
    }
    if (serviciosSeleccionados.length === 0) {
      Alert.alert("Atención", "Seleccioná al menos un servicio");
      return;
    }
    if (!fechaHora) {
      Alert.alert('Atención', 'Elegí un día y un horario en la agenda.');
      return;
    }

    setEnviando(true);
    try {
      const response = await api.post(`/index.php?action=crear_cita`, {
        idClientes: idClienteCita,
        idEstilistas: estilistaSeleccionado.idEstilistas,
        fechaHora: formatearFechaHora(fechaHora),
        servicios: serviciosSeleccionados.map((s) => ({
          idServicios: s.idServicios,
          cantidad: s.cantidad,
          precio: s.precio,
        })),
      });

      if (!esRespuestaValida(response.data)) {
        console.log('crear_cita devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        const mensaje = esRecepcionista
          ? `La cita de ${clienteSeleccionado.nombres} ${clienteSeleccionado.apellido} fue agendada correctamente.`
          : 'Tu cita fue reservada correctamente';
        Alert.alert('Éxito', mensaje, [
          {
            text: 'OK',
            onPress: () => {
              setServiciosSeleccionados([]);
              setEstilistaSeleccionado(null);
              setClienteSeleccionado(null);
              setFechaHora(null);
              navigation.navigate('Inicio');
            }
          },
        ]);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.log("Error al crear la cita:", error);
      Alert.alert('Error', mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <ActivityIndicator size="large" color={colors.primary} style={styles.cargando} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Titulo nivel="h1">{esRecepcionista ? 'Agendar cita' : 'Reservar nueva cita'}</Titulo>
        <Texto variante="bodySmall" color="textMuted" style={styles.subtitulo}>
          {esRecepcionista
            ? 'Elegí el cliente, los servicios, el estilista y un horario libre.'
            : 'Elegí tus servicios y tu estilista: la agenda te muestra qué horarios quedan libres.'}
        </Texto>

        {esRecepcionista && (
          <Seccion icono="person-outline" titulo="Cliente">
            {clienteSeleccionado ? (
              <Tarjeta variante="suave" style={styles.clienteElegido}>
                <View style={styles.infoClienteElegido}>
                  <Text style={styles.nombreClienteElegido}>
                    {clienteSeleccionado.nombres} {clienteSeleccionado.apellido}
                  </Text>
                  <Text style={styles.correoCliente}>{clienteSeleccionado.correo}</Text>
                </View>
                <Boton
                  titulo="Cambiar"
                  variante="ghost"
                  tamano="sm"
                  icono="swap-horizontal"
                  onPress={() => setClienteSeleccionado(null)}
                />
              </Tarjeta>
            ) : (
              <>
                <Input
                  icono="search-outline"
                  placeholder="Buscar cliente por nombre o correo"
                  accessibilityLabel="Buscar cliente"
                  autoCapitalize="none"
                  value={busquedaCliente}
                  onChangeText={setBusquedaCliente}
                  style={styles.buscador}
                />
                {clientesSugeridos.map((cliente) => (
                  <Pressable
                    key={cliente.idClientes}
                    style={({ pressed }) => [styles.sugerenciaCliente, pressed && styles.sugerenciaPresionada]}
                    onPress={() => elegirCliente(cliente)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
                    <View style={styles.infoClienteElegido}>
                      <Text style={styles.nombreSugerencia}>{cliente.nombres} {cliente.apellido}</Text>
                      <Text style={styles.correoCliente}>{cliente.correo}</Text>
                    </View>
                  </Pressable>
                ))}
                {textoBusquedaCliente !== '' && clientesSugeridos.length === 0 && (
                  <Text style={styles.textoSinClientes}>
                    No hay clientes que coincidan. Si es nuevo, tiene que registrarse primero.
                  </Text>
                )}
                {textoBusquedaCliente === '' && (
                  <Text style={styles.textoSinClientes}>
                    {clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}. Escribí para buscar.
                  </Text>
                )}
              </>
            )}
          </Seccion>
        )}

        <Seccion icono="sparkles-outline" titulo="Servicios">
          <BuscadorServicios
            servicios={servicios}
            seleccionados={serviciosSeleccionados}
            onAlternar={toggleServicio}
            onCambiarCantidad={cambiarCantidad}
          />
        </Seccion>

        <Seccion icono="cut-outline" titulo={esRecepcionista ? 'Estilista' : 'Selecciona tu estilista'}>
          <View style={styles.filaEstilistas}>
            {estilistas.map((est) => {
              const activo = estilistaSeleccionado?.idEstilistas === est.idEstilistas;
              return (
                <Chip
                  key={est.idEstilistas}
                  texto={`${est.nombres} ${est.apellido}`}
                  icono="person-outline"
                  seleccionado={activo}
                  onPress={() => setEstilistaSeleccionado(est)}
                />
              );
            })}
          </View>
        </Seccion>

        <Seccion icono="calendar-outline" titulo="Día y horario">
          {seleccion ? (
            <View style={styles.seleccionHorario} accessibilityLiveRegion="polite">
              <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} />
              <Text style={styles.textoSeleccionHorario}>
                {formatearFecha(seleccion.fecha)} · {seleccion.hora} h
              </Text>
            </View>
          ) : null}
          <AgendaDisponibilidad
            idEstilistas={estilistaSeleccionado?.idEstilistas}
            servicios={serviciosSeleccionados}
            seleccion={seleccion}
            onElegir={elegirHorario}
            onOtroHorario={abrirSelectorFecha}
          />
        </Seccion>

        {serviciosSeleccionados.length > 0 && (
          <Tarjeta style={styles.resumen}>
            <Texto variante="h3" color="textStrong" style={styles.tituloResumen}>Resumen de la reserva</Texto>
            {serviciosSeleccionados.map((s) => (
              <View key={s.idServicios} style={styles.filaResumen}>
                <Text style={styles.textoResumen}>
                  {s.servicio} x{s.cantidad}
                </Text>
                <Text style={styles.textoResumen}>${calcularSubtotal(s).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.filaTotal}>
              <Text style={styles.textoTotal}>Total</Text>
              <Text style={styles.textoTotal}>${calcularTotal().toFixed(2)}</Text>
            </View>
          </Tarjeta>
        )}

        <Boton
          titulo={esRecepcionista ? 'Agendar cita' : 'Confirmar reserva'}
          onPress={confirmarCita}
          cargando={enviando}
          tamano="lg"
          icono="checkmark-circle-outline"
          anchoCompleto
          style={styles.botonConfirmar}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Seccion({ icono, titulo, children }) {
  return (
    <View style={styles.seccion}>
      <View style={styles.encabezadoSeccion}>
        <Ionicons name={icono} size={18} color={colors.primaryText} />
        <Text style={styles.etiquetaSeccion} accessibilityRole="header">{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cargando: {
    marginTop: spacing.xxl,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.pantalla,
  },
  subtitulo: {
    marginTop: spacing.xs,
  },
  seccion: {
    marginTop: spacing.seccion,
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  etiquetaSeccion: {
    ...typography.h3,
    color: colors.textStrong,
    marginLeft: spacing.sm,
  },
  clienteElegido: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  infoClienteElegido: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  nombreClienteElegido: {
    ...typography.bodyStrong,
    color: colors.textStrong,
  },
  correoCliente: {
    ...typography.caption,
    color: colors.textMuted,
  },
  buscador: {
    marginBottom: spacing.sm,
  },
  sugerenciaCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing.toqueMinimo,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  sugerenciaPresionada: {
    backgroundColor: colors.primarySoft,
  },
  nombreSugerencia: {
    ...typography.bodySmall,
    fontFamily: typography.bodyStrong.fontFamily,
    color: colors.text,
  },
  textoSinClientes: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  seleccionHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  textoSeleccionHorario: {
    ...typography.bodyStrong,
    color: colors.textOnPrimary,
    flex: 1,
  },
  filaEstilistas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resumen: {
    marginTop: spacing.seccion,
  },
  tituloResumen: {
    marginBottom: spacing.sm,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  textoResumen: {
    ...typography.bodySmall,
    color: colors.text,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textoTotal: {
    ...typography.h3,
    color: colors.primaryText,
  },
  botonConfirmar: {
    marginTop: spacing.seccion,
  },
});
