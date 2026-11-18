import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import Header from '../components/header';
import CardCita from '../components/cita';
import AccionesCitaSalon from '../components/AccionesCitaSalon';
import CobroCita from '../components/CobroCita';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { formatearFecha } from '../utils/fechas';

// estado_cita.idEstado: solo las activas (todavía no iniciadas) se pueden reprogramar o cancelar.
// Se cobran todas las que no están canceladas y tienen saldo.
const ESTADO_ACTIVA = 1;
const ESTADO_CANCELADA = 2;

const RESUMEN_ESTADOS = [
  { idEstado: 1, etiqueta: 'Activas' },
  { idEstado: 4, etiqueta: 'En curso' },
  { idEstado: 3, etiqueta: 'Finalizadas' },
  { idEstado: 2, etiqueta: 'Canceladas' },
];

export default function HomeRecepcionista({ navigation }) {
  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarCitas = async () => {
    try {
      setError(null);
      const response = await api.get(`/index.php?action=get_citas_dia`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_citas_dia devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        setCitas(response.data.data);
        setFecha(response.data.fecha);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_citas_dia:', err);
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCitas();
    }, [])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargarCitas();
  };

  const contarPorEstado = (idEstado) => citas.filter((c) => c.idEstado === idEstado).length;

  const renderContenido = () => {
    if (cargando) {
      return <ActivityIndicator size="large" color="#000000" style={styles.cargando} />;
    }
    if (error) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoError}>{error}</Text>
          <Text style={styles.textoAyuda}>Deslizá hacia abajo para reintentar.</Text>
        </View>
      );
    }
    if (citas.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoVacio}>No hay citas para hoy.</Text>
        </View>
      );
    }
    return citas.map((cita) => (
      <CardCita key={cita.idCitas} item={cita}>
        {cita.idEstado === ESTADO_ACTIVA && (
          <AccionesCitaSalon cita={cita} nombreCliente={cita.cliente} onCambio={cargarCitas} />
        )}
        {cita.idEstado !== ESTADO_CANCELADA && cita.saldo > 0 && (
          <CobroCita cita={cita} onCambio={cargarCitas} />
        )}
      </CardCita>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
      >
        <View style={styles.encabezado}>
          <Text style={styles.tituloPrincipal}>Citas del día</Text>
          <Text style={styles.subtitulo}>{formatearFecha(fecha)}</Text>
          {!cargando && !error && (
            <Text style={styles.resumenTexto}>
              {citas.length} {citas.length === 1 ? 'cita' : 'citas'} en total
            </Text>
          )}
        </View>

        {!cargando && !error && citas.length > 0 && (
          <View style={styles.filaResumen}>
            {RESUMEN_ESTADOS.map(({ idEstado, etiqueta }) => (
              <View key={idEstado} style={styles.cajaResumen}>
                <Text style={styles.numeroResumen}>{contarPorEstado(idEstado)}</Text>
                <Text style={styles.etiquetaResumen}>{etiqueta}</Text>
              </View>
            ))}
          </View>
        )}

        {renderContenido()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  encabezado: {
    marginBottom: 15,
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#333333',
    marginTop: 2,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  resumenTexto: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cajaResumen: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#F7F7F7',
  },
  numeroResumen: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  etiquetaResumen: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  cargando: {
    marginTop: 40,
  },
  tarjetaMensaje: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 14,
    color: '#666666',
  },
  textoError: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
  },
  textoAyuda: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
  },
});
