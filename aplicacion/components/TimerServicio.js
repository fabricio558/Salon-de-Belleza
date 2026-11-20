import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { colors, typography, spacing } from '../theme';
import Boton from './ui/Boton';


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
      const response = await api.post(`/index.php?action=iniciar_servicio`, { idCitas });
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
      const response = await api.post(`/index.php?action=finalizar_servicio`, { idCitas });
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
      <View style={[styles.contenedor, styles.fila]}>
        <Ionicons name="checkmark-done-outline" size={16} color={colors.success} />
        <Text style={styles.textoFinalizado}>Finalizado en {formatearTiempo(segundos)}</Text>
      </View>
    );
  }

  if (inicioTs) {
    return (
      <View style={styles.contenedor}>
        <View style={styles.fila}>
          <Ionicons name="time-outline" size={22} color={colors.enCurso} />
          <Text style={styles.cronometro} accessibilityLabel={`Tiempo transcurrido ${formatearTiempo(segundos)}`}>
            {formatearTiempo(segundos)}
          </Text>
        </View>
        <Boton
          titulo="Finalizar"
          variante="danger"
          tamano="sm"
          icono="stop-circle-outline"
          onPress={finalizarServicio}
          cargando={cargando}
        />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Boton
        titulo="Iniciar servicio"
        variante="secondary"
        tamano="sm"
        icono="play-circle-outline"
        onPress={iniciarServicio}
        cargando={cargando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cronometro: {
    ...typography.h2,
    fontFamily: typography.bodyStrong.fontFamily,
    // Único uso de color en la tarjeta: el servicio en curso se destaca con el
    // azul pizarra del estado "En Curso" (8:1 sobre la tarjeta).
    color: colors.enCurso,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  textoFinalizado: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
  },
});
