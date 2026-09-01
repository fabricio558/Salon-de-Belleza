import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Importamos esto
import axios from "axios";
import BASE_URL from "../direcIP/ip";
import Header from "../components/header";

export default function CrearCita({ navigation }) {
  // Eliminamos el useRoute(), ya no recibimos el ID por navegación
  const [idClientes, setIdClientes] = useState(null); // <-- Ahora es un estado

  const [servicios, setServicios] = useState([]);
  const [estilistas, setEstilistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [estilistaSeleccionado, setEstilistaSeleccionado] = useState(null);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [enviando, setEnviando] = useState(false);

  const cargarDatos = async () => {
    try {
      // 1. Recuperamos la sesión completa del teléfono
      const session = await AsyncStorage.getItem('user_session');
      
      if (session) {
        const userData = JSON.parse(session);
        // Leemos el ID usando la nueva clave genérica que pusimos en PHP
        const idDelCliente = userData.idUsuarios; 
        
        if (idDelCliente) {
            setIdClientes(idDelCliente); // Lo guardamos en el estado
        } else {
            Alert.alert("Error", "Tu sesión es inválida. Volvé a ingresar.");
        }
      } else {
        Alert.alert("Error", "No se encontró tu sesión. Por favor, volvé a iniciar sesión.");
      }

      // 2. Cargamos los servicios y estilistas
      const [resServicios, resEstilistas] = await Promise.all([
        axios.get(`${BASE_URL}/index.php?action=get_servicios`),
        axios.get(`${BASE_URL}/index.php?action=get_estilistas`),
      ]);

      if (resServicios.data.success) setServicios(resServicios.data.data);
      if (resEstilistas.data.success) setEstilistas(resEstilistas.data.data);
    } catch (error) {
      console.log("Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los servicios o estilistas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Alterna un servicio dentro/fuera de la selección
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
          cantidad: 1, // por defecto
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
          // Después de elegir la fecha, abrimos el selector de hora
          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            is24Hour: true,
            onChange: (event2, hora) => {
              if (event2.type === "set" && hora) {
                const fechaCompleta = new Date(date);
                fechaCompleta.setHours(hora.getHours());
                fechaCompleta.setMinutes(hora.getMinutes());
                setFechaHora(fechaCompleta);
              }
            },
          });
        }
      },
    });
  };

  const formatearFechaHora = (fecha) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:00`;
  };

const confirmarCita = async () => {
    if (!idClientes) {
      Alert.alert("Atención", "No se identificó tu usuario. Volvé a iniciar sesión.");
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
      const response = await axios.post(`${BASE_URL}/index.php?action=crear_cita`, {
        idClientes: idClientes, // Acá enviamos el ID que sacamos de AsyncStorage
        idEstilistas: estilistaSeleccionado.idEstilistas,
        fechaHora: formatearFechaHora(fechaHora),
        servicios: serviciosSeleccionados.map((s) => ({
          idServicios: s.idServicios,
          cantidad: s.cantidad,
          precio: s.precio,
        })),
      });

      if (response.data.success) {
        Alert.alert("Éxito", "Tu cita fue reservada correctamente", [
          { 
            text: "OK", 
            onPress: () => {
              // 1. Limpiamos los estados para que el formulario quede vacío
              setServiciosSeleccionados([]);
              setEstilistaSeleccionado(null);
              setFechaHora(new Date());

              // 2. Redirigimos a la pantalla de la agenda
              // Asegurate de que el nombre coincida EXACTAMENTE con el de navigation.js
              navigation.navigate("Inicio"); 
            } 
          },
        ]);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.log("Error al crear la cita:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <ActivityIndicator size="large" color="#B8838A" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cuerpo}>
          <Text style={styles.titulo}>NUEVA CITA</Text>

          {/* Fecha y hora */}
          <Text style={styles.etiquetaSeccion}>Fecha y hora</Text>
          <Pressable style={styles.selectorFecha} onPress={abrirSelectorFecha}>
            <Text style={styles.textoSelectorFecha}>
              {fechaHora.toLocaleDateString()} - {fechaHora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </Pressable>

          {/* Servicios */}
          <Text style={styles.etiquetaSeccion}>Servicios</Text>
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

          {/* Estilista */}
          <Text style={styles.etiquetaSeccion}>Estilista</Text>
          <View style={styles.filaEstilistas}>
            {estilistas.map((est) => {
              const activo = estilistaSeleccionado?.idEstilistas === est.idEstilistas;
              return (
                <Pressable
                  key={est.idEstilistas}
                  style={[styles.chipEstilista, activo && styles.chipServicioActivo]}
                  onPress={() => setEstilistaSeleccionado(est)}
                >
                  <Text style={[styles.textoChip, activo && styles.textoChipActivo]}>
                    {est.nombres} {est.apellido}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Resumen de servicios seleccionados */}
          {serviciosSeleccionados.length > 0 && (
            <View style={styles.resumen}>
              <Text style={styles.etiquetaSeccion}>Resumen</Text>
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textoBotonConfirmar}>Confirmar Cita</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e1cec2" },
  scrollContent: { paddingTop: 15, paddingBottom: 40 },
  cuerpo: {
    backgroundColor: "#F9F3EE",
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2D2C6",
  },
  titulo: {
    color: "#B8838A",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 15,
  },
  etiquetaSeccion: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8E6E73",
    marginTop: 15,
    marginBottom: 8,
  },
  selectorFecha: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2D2C6",
  },
  textoSelectorFecha: { color: "#4A4A4A", fontSize: 15 },
  filaServicio: {
    marginBottom: 10,
  },
  chipServicio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2D2C6",
  },
  chipServicioActivo: {
    backgroundColor: "#B8838A",
    borderColor: "#B8838A",
  },
  textoChip: { color: "#4A4A4A", fontSize: 14 },
  textoChipActivo: { color: "#FFFFFF", fontWeight: "bold" },
  controlCantidad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  botonCantidad: {
    backgroundColor: "#E2D2C6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonCantidad: { fontSize: 18, fontWeight: "bold", color: "#B8838A" },
  cantidadTexto: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A4A4A",
  },
  filaEstilistas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipEstilista: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2D2C6",
  },
  resumen: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2D2C6",
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  textoResumen: { fontSize: 14, color: "#4A4A4A" },
  filaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2D2C6",
    paddingTop: 8,
    marginTop: 4,
  },
  textoTotal: { fontSize: 16, fontWeight: "bold", color: "#B8838A" },
  botonConfirmar: {
    backgroundColor: "#B8838A",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotonConfirmar: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
});