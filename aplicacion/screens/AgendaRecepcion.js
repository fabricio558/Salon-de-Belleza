import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from '../components/header';
import CardCita from '../components/cita';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { formatearFecha, formatearFechaCorta, sumarDias } from '../utils/fechas';

// Agrupa las citas (ya ordenadas por fecha y hora) por su campo `fecha`.
const agruparPorDia = (citas) => {
  const grupos = [];
  citas.forEach((cita) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === cita.fecha) {
      ultimo.citas.push(cita);
    } else {
      grupos.push({ fecha: cita.fecha, citas: [cita] });
    }
  });
  return grupos;
};

// Agenda semanal de todos los estilistas, para el recepcionista.
export default function AgendaRecepcion({ navigation }) {
  const [citas, setCitas] = useState([]);
  const [semana, setSemana] = useState({ desde: '', hasta: '', hoy: '' });
  // null = semana actual (la decide el servidor).
  const [fechaReferencia, setFechaReferencia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarSemana = async (fecha) => {
    try {
      setError(null);
      const params = fecha ? `&fecha=${fecha}` : '';
      const response = await axios.get(`${BASE_URL}/index.php?action=get_citas_semana${params}`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_citas_semana devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        const { desde, hasta, hoy, data } = response.data;
        setCitas(data);
        setSemana({ desde, hasta, hoy });
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_citas_semana:', err);
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarSemana(fechaReferencia);
    }, [fechaReferencia])
  );

  const irASemana = (fecha) => {
    setCargando(true);
    setFechaReferencia(fecha);
  };

  const refrescar = () => {
    setRefrescando(true);
    cargarSemana(fechaReferencia);
  };

  const esSemanaActual = semana.hoy >= semana.desde && semana.hoy <= semana.hasta;
  const grupos = agruparPorDia(citas);

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
    if (grupos.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoVacio}>No hay citas esta semana.</Text>
        </View>
      );
    }
    return grupos.map((grupo) => (
      <View key={grupo.fecha} style={styles.grupoDia}>
        <View style={[styles.encabezadoDia, grupo.fecha === semana.hoy && styles.encabezadoHoy]}>
          <Text style={[styles.textoDia, grupo.fecha === semana.hoy && styles.textoHoy]}>
            {formatearFecha(grupo.fecha)}{grupo.fecha === semana.hoy ? ' · hoy' : ''}
          </Text>
          <Text style={[styles.cantidadDia, grupo.fecha === semana.hoy && styles.textoHoy]}>
            {grupo.citas.length} {grupo.citas.length === 1 ? 'cita' : 'citas'}
          </Text>
        </View>
        {grupo.citas.map((cita) => <CardCita key={cita.idCitas} item={cita} />)}
      </View>
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
          <Text style={styles.tituloPrincipal}>Agenda semanal</Text>
          {semana.desde ? (
            <Text style={styles.subtitulo}>
              {formatearFechaCorta(semana.desde)} al {formatearFechaCorta(semana.hasta)}
              {!cargando && !error ? ` · ${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.navegacionSemana}>
          <Pressable
            style={styles.botonSemana}
            disabled={!semana.desde || cargando}
            onPress={() => irASemana(sumarDias(semana.desde, -7))}
          >
            <Text style={styles.textoBotonSemana}>‹ Anterior</Text>
          </Pressable>
          <Pressable
            style={[styles.botonSemana, esSemanaActual && styles.botonDeshabilitado]}
            disabled={esSemanaActual || cargando}
            onPress={() => irASemana(null)}
          >
            <Text style={styles.textoBotonSemana}>Esta semana</Text>
          </Pressable>
          <Pressable
            style={styles.botonSemana}
            disabled={!semana.desde || cargando}
            onPress={() => irASemana(sumarDias(semana.desde, 7))}
          >
            <Text style={styles.textoBotonSemana}>Siguiente ›</Text>
          </Pressable>
        </View>

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
    marginBottom: 12,
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
    fontWeight: '600',
  },
  navegacionSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  botonSemana: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
  textoBotonSemana: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  grupoDia: {
    marginBottom: 10,
  },
  encabezadoDia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  encabezadoHoy: {
    backgroundColor: '#000000',
  },
  textoDia: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'capitalize',
  },
  cantidadDia: {
    fontSize: 12,
    color: '#666666',
  },
  textoHoy: {
    color: '#FFFFFF',
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
