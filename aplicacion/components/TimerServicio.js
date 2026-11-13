import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';

const mensajeDeError = (error) => {
  if (error.response) {
    return error.response.data?.message || `El servidor respondió con error (HTTP ${error.response.status})`;
  }
  if (error.request) {
    return `No se pudo conectar con ${BASE_URL}. Revisá que el dispositivo esté en la misma red y que XAMPP esté encendido.`;
  }
  return error.message;
};

// Si PHP tira un error fatal devuelve HTML (status 200), no JSON.
const esRespuestaValida = (data) => data !== null && typeof data === 'object';

export default function TimerServicio({ idCitas, horaInicioTs = null, horaFinTs = null, onFinalizado }) {
  const [inicioTs, setInicioTs] = useState(horaInicioTs);
  const [finTs, setFinTs] = useState(horaFinTs);
  const [segundos, setSegundos] = useState(0);
  const [cargando, setCargando] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setInicioTs(horaInicioTs);
    setFinTs(horaFinTs);
  }, [horaInicioTs, horaFinTs]);

  useEffect(() => {
    if (inicioTs && finTs) {
      const totalSegundos = Math.max(0, parseInt(finTs, 10) - parseInt(inicioTs, 10));
      setSegundos(totalSegundos);
    } else if (inicioTs && !finTs) {
      const inicioMs = parseInt(inicioTs, 10) * 1000;

      const actualizar = () => {
        const ahora = Date.now();
        setSegundos(Math.max(0, Math.floor((ahora - inicioMs) / 1000)));
      };

      actualizar();
      intervalRef.current = setInterval(actualizar, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [inicioTs, finTs]);

  const formatearTiempo = (totalSegundos) => {
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const iniciarServicio = async () => {
    setCargando(true);
    try {
      const response = await axios.post(`${BASE_URL}/index.php?action=iniciar_servicio`, { idCitas });
      if (!esRespuestaValida(response.data)) {
        console.log('iniciar_servicio devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        setInicioTs(response.data.horaInicioTs);
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (error) {
      console.log('Error en iniciar_servicio:', error);
      Alert.alert('Error', mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  };

  const finalizarServicio = async () => {
    setCargando(true);
    try {
      const response = await axios.post(`${BASE_URL}/index.php?action=finalizar_servicio`, { idCitas });
      if (!esRespuestaValida(response.data)) {
        console.log('finalizar_servicio devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        clearInterval(intervalRef.current);
        setFinTs(response.data.horaFinTs);
        if (onFinalizado) {
          onFinalizado();
        }
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (error) {
      console.log('Error en finalizar_servicio:', error);
      Alert.alert('Error', mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  };

  if (finTs) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.textoFinalizado}> Finalizado en {formatearTiempo(segundos)}</Text>
      </View>
    );
  }

  if (inicioTs) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.cronometro}>{formatearTiempo(segundos)}</Text>
        <Pressable style={styles.botonFinalizar} onPress={finalizarServicio} disabled={cargando}>
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBoton}>Finalizar</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Pressable style={styles.botonIniciar} onPress={iniciarServicio} disabled={cargando}>
        {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBoton}>Iniciar Servicio</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 10, alignItems: 'center' },
  cronometro: { fontSize: 28, fontWeight: 'bold', color: '#B8838A', marginBottom: 8, fontVariant: ['tabular-nums'] },
  botonIniciar: { backgroundColor: '#81C784', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  botonFinalizar: { backgroundColor: '#E57373', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  textoBoton: { color: '#fff', fontWeight: 'bold' },
  textoFinalizado: { color: '#64B5F6', fontWeight: '600' },
});
