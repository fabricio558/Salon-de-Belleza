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
import { colors, typography, spacing, radius, estiloEstadoCita } from '../theme';
import { EstadoVacio, Titulo, Texto } from '../components/ui';

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
      return <ActivityIndicator size="large" color={colors.primary} style={styles.cargando} />;
    }
    if (error) {
      return (
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo={error}
          mensaje="Deslizá hacia abajo para reintentar."
        />
      );
    }
    if (citas.length === 0) {
      return (
        <EstadoVacio
          icono="calendar-clear-outline"
          titulo="Sin citas"
          mensaje="No hay citas para hoy."
        />
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
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.encabezado}>
          <Titulo nivel="h1">Citas del día</Titulo>
          <Texto variante="bodySmall" color="primaryText" style={styles.subtitulo}>{formatearFecha(fecha)}</Texto>
          {!cargando && !error && (
            <Texto variante="bodySmall" color="textMuted" style={styles.resumenTexto}>
              {citas.length} {citas.length === 1 ? 'cita' : 'citas'} en total
            </Texto>
          )}
        </View>

        {!cargando && !error && citas.length > 0 && (
          <View style={styles.filaResumen}>
            {RESUMEN_ESTADOS.map(({ idEstado, etiqueta }) => {
              const estilo = estiloEstadoCita(idEstado);
              return (
                <View
                  key={idEstado}
                  style={[styles.cajaResumen, { backgroundColor: estilo.fondo }]}
                  accessible
                  accessibilityLabel={`${contarPorEstado(idEstado)} ${etiqueta}`}
                >
                  <Text style={[styles.numeroResumen, { color: estilo.texto }]}>{contarPorEstado(idEstado)}</Text>
                  <Text style={[styles.etiquetaResumen, { color: estilo.texto }]}>{etiqueta}</Text>
                </View>
              );
            })}
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.pantalla,
  },
  encabezado: {
    marginBottom: spacing.lg,
  },
  subtitulo: {
    marginTop: spacing.xxs,
    textTransform: 'capitalize',
  },
  resumenTexto: {
    marginTop: spacing.xs,
  },
  filaResumen: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.seccion,
  },
  cajaResumen: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  numeroResumen: {
    ...typography.h2,
  },
  etiquetaResumen: {
    ...typography.caption,
    fontSize: 11,
  },
  cargando: {
    marginTop: spacing.xxl,
  },
});
