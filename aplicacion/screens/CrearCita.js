import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert, TextInput,
} from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { validarHorario, formatearFechaHora } from '../utils/horarios';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { normalizarTexto } from '../utils/texto';
import Header from "../components/header";

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
  const [fechaHora, setFechaHora] = useState(new Date());
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
      value: fechaHora,
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
              setFechaHora(new Date());
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
        <ActivityIndicator size="large" color="#000000" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.openDrawer()} style={styles.hamburgerButton}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </Pressable>
        <Text style={styles.logoTexto}>MANDALA</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cuerpo}>
          <Text style={styles.titulo}>{esRecepcionista ? 'AGENDAR CITA' : 'RESERVAR NUEVA CITA'}</Text>
          <Text style={styles.subtitulo}>
            {esRecepcionista
              ? 'Elegí el cliente, la fecha, los servicios y el estilista.'
              : 'Selecciona fecha, servicios y estilista preferido.'}
          </Text>

          {esRecepcionista && (
            <>
              <Text style={styles.etiquetaSeccion}>Cliente</Text>
              {clienteSeleccionado ? (
                <View style={styles.clienteElegido}>
                  <View style={styles.infoClienteElegido}>
                    <Text style={styles.nombreClienteElegido}>
                      {clienteSeleccionado.nombres} {clienteSeleccionado.apellido}
                    </Text>
                    <Text style={styles.correoCliente}>{clienteSeleccionado.correo}</Text>
                  </View>
                  <Pressable style={styles.botonCambiarCliente} onPress={() => setClienteSeleccionado(null)}>
                    <Text style={styles.textoCambiarCliente}>Cambiar</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.buscadorCliente}
                    placeholder="Buscar cliente por nombre o correo"
                    placeholderTextColor="#888888"
                    autoCapitalize="none"
                    value={busquedaCliente}
                    onChangeText={setBusquedaCliente}
                  />
                  {clientesSugeridos.map((cliente) => (
                    <Pressable
                      key={cliente.idClientes}
                      style={styles.sugerenciaCliente}
                      onPress={() => elegirCliente(cliente)}
                    >
                      <Text style={styles.nombreSugerencia}>{cliente.nombres} {cliente.apellido}</Text>
                      <Text style={styles.correoCliente}>{cliente.correo}</Text>
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
            </>
          )}

          <Text style={styles.etiquetaSeccion}>Fecha y Hora</Text>
          <Pressable style={styles.selectorFecha} onPress={abrirSelectorFecha}>
            <Text style={styles.textoSelectorFecha}>
              📅 {fechaHora.toLocaleDateString()} - {fechaHora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </Pressable>

          <Text style={styles.etiquetaSeccion}>Servicios Disponibles</Text>
          {servicios.map((servicio) => {
            const seleccionado = serviciosSeleccionados.find(
              (s) => s.idServicios === servicio.idServicios
            );
            return (
              <View key={servicio.idServicios} style={styles.filaServicio}>
                <Pressable
                  style={[styles.chipServicio, seleccionado && styles.chipServicioActivo]}
                  onPress={() => toggleServicio(servicio)}
                >
                  <Text style={[styles.textoChip, seleccionado && styles.textoChipActivo]}>
                    {servicio.servicio} - ${parseFloat(servicio.precio).toFixed(2)}
                  </Text>
                </Pressable>

                {seleccionado && (
                  <View style={styles.controlCantidad}>
                    <Pressable
                      style={styles.botonCantidad}
                      onPress={() => cambiarCantidad(servicio.idServicios, -1)}
                    >
                      <Text style={styles.textoBotonCantidad}>-</Text>
                    </Pressable>
                    <Text style={styles.cantidadTexto}>{seleccionado.cantidad}</Text>
                    <Pressable
                      style={styles.botonCantidad}
                      onPress={() => cambiarCantidad(servicio.idServicios, 1)}
                    >
                      <Text style={styles.textoBotonCantidad}>+</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}

          <Text style={styles.etiquetaSeccion}>{esRecepcionista ? 'Estilista' : 'Selecciona tu Estilista'}</Text>
          <View style={styles.filaEstilistas}>
            {estilistas.map((est) => {
              const activo = estilistaSeleccionado?.idEstilistas === est.idEstilistas;
              return (
                <Pressable
                  key={est.idEstilistas}
                  style={[styles.chipEstilista, activo && styles.chipEstilistaActivo]}
                  onPress={() => setEstilistaSeleccionado(est)}
                >
                  <Text style={[styles.textoChipEstilista, activo && styles.textoChipEstilistaActivo]}>
                    ✂️ {est.nombres} {est.apellido}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {serviciosSeleccionados.length > 0 && (
            <View style={styles.resumen}>
              <Text style={styles.etiquetaResumenTitulo}>Resumen de la Reserva</Text>
              {serviciosSeleccionados.map((s) => (
                <View key={s.idServicios} style={styles.filaResumen}>
                  <Text style={styles.textoResumen}>
                    {s.servicio} x{s.cantidad}
                  </Text>
                  <Text style={styles.textoResumen}>${calcularSubtotal(s).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.filaTotal}>
                <Text style={styles.textoTotal}>TOTAL</Text>
                <Text style={styles.textoTotal}>${calcularTotal().toFixed(2)}</Text>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.botonConfirmar, enviando && { opacity: 0.6 }]}
            onPress={confirmarCita}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBotonConfirmar}>{esRecepcionista ? 'AGENDAR CITA' : 'CONFIRMAR RESERVA'}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  navBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
  },
  hamburgerButton: {
    padding: 5,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  logoTexto: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  scrollContent: { 
    paddingTop: 20, 
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  cuerpo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titulo: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  etiquetaSeccion: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000000",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  buscadorCliente: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  sugerenciaCliente: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nombreSugerencia: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  correoCliente: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  textoSinClientes: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  clienteElegido: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 14,
  },
  infoClienteElegido: {
    flex: 1,
  },
  nombreClienteElegido: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  botonCambiarCliente: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textoCambiarCliente: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  selectorFecha: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textoSelectorFecha: { 
    color: "#333333", 
    fontSize: 15,
    fontWeight: "600",
  },
  filaServicio: {
    marginBottom: 10,
  },
  chipServicio: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipServicioActivo: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  textoChip: { 
    color: "#333333", 
    fontSize: 15,
    fontWeight: "600",
  },
  textoChipActivo: { 
    color: "#FFFFFF", 
    fontWeight: "bold" 
  },
  controlCantidad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 8,
  },
  botonCantidad: {
    backgroundColor: "#000000",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonCantidad: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#FFFFFF" 
  },
  cantidadTexto: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  filaEstilistas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipEstilista: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipEstilistaActivo: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  textoChipEstilista: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "600",
  },
  textoChipEstilistaActivo: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  resumen: {
    marginTop: 20,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  etiquetaResumenTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000000",
    marginBottom: 10,
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  textoResumen: { 
    fontSize: 14, 
    color: "#333333",
    fontWeight: "500",
  },
  filaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 10,
    marginTop: 6,
  },
  textoTotal: { 
    fontSize: 16, 
    fontWeight: "900", 
    color: "#000000" 
  },
  botonConfirmar: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 25,
  },
  textoBotonConfirmar: { 
    color: "#FFFFFF", 
    fontWeight: "bold", 
    fontSize: 14,
    letterSpacing: 1,
  },
});