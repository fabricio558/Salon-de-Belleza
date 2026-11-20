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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import Header from '../components/header';
import CardCita from '../components/cita';
import OpcionesPago from '../components/OpcionesPago';
import ResumenPagoLocal, { ModalResumenPagoLocal } from '../components/ResumenPagoLocal';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { obtenerPagosPendientes } from '../utils/pagos';
import { validarHorario, formatearFechaHora } from '../utils/horarios';
import { formatearFecha, dateDesdeFechaHora, isoDesdeDate, horaDesdeDate } from '../utils/fechas';

const PESTANAS = [
  { clave: 'proximas', etiqueta: 'Próximas' },
  { clave: 'historial', etiqueta: 'Historial' },
];

const ESTADO_ACTIVA = 1;
// Las canceladas no se pagan; el resto se puede pagar online mientras tenga saldo.
const ESTADO_CANCELADA = 2;

const obtenerIdCliente = async () => {
  const session = await AsyncStorage.getItem('user_session');
  return session ? JSON.parse(session).idUsuarios : null;
};

// fecha 'AAAA-MM-DD' y hora 'HH:MM' en hora del salón (como las manda el servidor).
const describirFechaHora = (fecha, hora) => `${formatearFecha(fecha)} a las ${hora}`;

// Historial de citas del cliente, con cancelación y reprogramación de las activas.
export default function MisCitas({ navigation }) {
  const [citas, setCitas] = useState([]);
  const [idCliente, setIdCliente] = useState(null);
  const [anticipacionMinutos, setAnticipacionMinutos] = useState(120);
  const [pestana, setPestana] = useState('proximas');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [error, setError] = useState(null);
  const [pendientesPago, setPendientesPago] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);

  // Citas sin pagar, con el medio elegido para el local. get_pagos_pendientes también
  // trae los pedidos, pero acá no se muestran: esos se ven en MisPedidos.
  const cargarPendientesPago = async () => {
    try {
      const pendientes = await obtenerPagosPendientes();
      setPendientesPago(pendientes ? { ...pendientes, pedidos: [] } : pendientes);
    } catch (err) {
      console.log('Error en get_pagos_pendientes:', err);
    }
  };

  const alElegirPagoLocal = async () => {
    await cargarPendientesPago();
    setMostrarResumen(true);
  };

  const cargarCitas = async () => {
    try {
      setError(null);
      const id = await obtenerIdCliente();
      setIdCliente(id);
      if (!id) {
        setError('No se encontró tu sesión. Volvé a iniciar sesión.');
        return;
      }
      cargarPendientesPago();

      const response = await api.get(`/index.php?action=get_citas_cliente&idClientes=${id}`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_citas_cliente devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        setCitas(response.data.data);
        setAnticipacionMinutos(response.data.anticipacionMinutos);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_citas_cliente:', err);
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

  // POST a cancelar_cita / reprogramar_cita; si sale bien, recarga la lista.
  const enviarCambio = async (action, cita, datosExtra = {}) => {
    setProcesandoId(cita.idCitas);
    try {
      const response = await api.post(`/index.php?action=${action}`, {
        idClientes: idCliente,
        idCitas: cita.idCitas,
        ...datosExtra,
      });

      if (!esRespuestaValida(response.data)) {
        console.log(`${action} devolvió una respuesta inválida:`, response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        Alert.alert('Listo', response.data.message);
        await cargarCitas();
      } else {
        Alert.alert('Atención', response.data.message);
        // El estado pudo cambiar (por ejemplo, venció el plazo): refrescar.
        await cargarCitas();
      }
    } catch (err) {
      console.log(`Error en ${action}:`, err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarCancelacion = (cita) => {
    Alert.alert(
      'Cancelar cita',
      `¿Querés cancelar tu cita del ${describirFechaHora(cita.fecha, cita.hora)} con ${cita.estilista}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => enviarCambio('cancelar_cita', cita) },
      ]
    );
  };

  // El selector trabaja con fecha y hora "de reloj": lo que elige el cliente se
  // envía tal cual (formatearFechaHora) y el servidor lo interpreta en hora del salón.
  // Que sea futura y que el horario esté libre lo controla el servidor con su reloj.
  const abrirReprogramacion = (cita) => {
    const actual = dateDesdeFechaHora(cita.fecha, cita.hora);

    DateTimePickerAndroid.open({
      value: actual,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, fecha) => {
        if (event.type !== 'set' || !fecha) {
          return;
        }
        if (fecha.getDay() === 0) {
          Alert.alert('Horario no disponible', 'El local permanece cerrado los domingos.');
          return;
        }

        DateTimePickerAndroid.open({
          value: actual,
          mode: 'time',
          is24Hour: true,
          onChange: (event2, hora) => {
            if (event2.type !== 'set' || !hora) {
              return;
            }
            const nueva = new Date(fecha);
            nueva.setHours(hora.getHours(), hora.getMinutes(), 0, 0);

            const validacion = validarHorario(nueva);
            if (!validacion.valido) {
              Alert.alert('Horario no disponible', validacion.mensaje);
              return;
            }
            Alert.alert(
              'Reprogramar cita',
              `¿Mover tu cita del ${describirFechaHora(cita.fecha, cita.hora)} al ${describirFechaHora(isoDesdeDate(nueva), horaDesdeDate(nueva))}?`,
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Sí, reprogramar',
                  onPress: () => enviarCambio('reprogramar_cita', cita, { fechaHora: formatearFechaHora(nueva) }),
                },
              ]
            );
          },
        });
      },
    });
  };

  const proximas = citas.filter((c) => c.proxima).sort((a, b) => a.fechaHoraTs - b.fechaHoraTs);
  const historial = citas.filter((c) => !c.proxima);
  const listaActual = pestana === 'proximas' ? proximas : historial;
  const horasAnticipacion = anticipacionMinutos / 60;

  // Último mensaje que dejó el estilista o el recepcionista al cancelar/reprogramar.
  const renderMensajeSalon = (cita) => {
    if (!cita.mensajeSalon) {
      return null;
    }
    const esCancelacion = cita.tipoCambio === 'cancelacion';
    return (
      <View style={[styles.cajaMensaje, esCancelacion ? styles.cajaMensajeCancelacion : styles.cajaMensajeReprogramacion]}>
        <Text style={styles.tituloMensaje}>
          {esCancelacion ? 'El salón canceló esta cita' : 'El salón reprogramó esta cita'}
        </Text>
        {!esCancelacion && cita.fechaAnterior && (
          <Text style={styles.textoFechaAnterior}>
            Antes: {describirFechaHora(cita.fechaAnterior, cita.horaAnterior)}
          </Text>
        )}
        <Text style={styles.textoMensaje}>“{cita.mensajeSalon}”</Text>
        <Text style={styles.autorMensaje}>
          — {cita.autorCambio}{cita.rolAutorCambio ? ` (${cita.rolAutorCambio})` : ''}
        </Text>
      </View>
    );
  };

  const renderAcciones = (cita) => {
    if (procesandoId === cita.idCitas) {
      return <ActivityIndicator color="#000000" style={styles.indicadorAccion} />;
    }
    if (cita.puedeModificar) {
      return (
        <View style={styles.filaAcciones}>
          <Pressable
            style={[styles.botonAccion, styles.botonReprogramar]}
            disabled={procesandoId !== null}
            onPress={() => abrirReprogramacion(cita)}
          >
            <Text style={styles.textoReprogramar}>Reprogramar</Text>
          </Pressable>
          <Pressable
            style={[styles.botonAccion, styles.botonCancelar]}
            disabled={procesandoId !== null}
            onPress={() => confirmarCancelacion(cita)}
          >
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      );
    }
    if (cita.idEstado === ESTADO_ACTIVA && cita.proxima) {
      return (
        <Text style={styles.textoNota}>
          Faltan menos de {horasAnticipacion} horas: para cambios, comunicate con el salón.
        </Text>
      );
    }
    return null;
  };

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
    if (listaActual.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoVacio}>
            {pestana === 'proximas' ? 'No tenés citas próximas.' : 'Todavía no tenés citas pasadas.'}
          </Text>
          {pestana === 'proximas' && (
            <Pressable style={styles.botonReservar} onPress={() => navigation.navigate('Reservar Cita')}>
              <Text style={styles.textoBotonReservar}>RESERVAR UNA CITA</Text>
            </Pressable>
          )}
        </View>
      );
    }
    return listaActual.map((cita) => (
      <CardCita key={cita.idCitas} item={cita} mostrarFecha mostrarCliente={false}>
        {renderMensajeSalon(cita)}
        {renderAcciones(cita)}
        {cita.idEstado !== ESTADO_CANCELADA && cita.saldo > 0 && (
          <OpcionesPago
            tipo="cita"
            item={{ ...cita, id: cita.idCitas }}
            mediosLocal={pendientesPago?.mediosLocal || []}
            onCambio={cargarCitas}
            onElegirLocal={alElegirPagoLocal}
          />
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
          <Text style={styles.tituloPrincipal}>Mis citas</Text>
          <Text style={styles.subtitulo}>
            Podés cancelar o reprogramar una cita activa hasta {horasAnticipacion} horas antes.
          </Text>
        </View>

        <View style={styles.filaPestanas}>
          {PESTANAS.map(({ clave, etiqueta }) => {
            const activa = pestana === clave;
            const cantidad = clave === 'proximas' ? proximas.length : historial.length;
            return (
              <Pressable
                key={clave}
                style={[styles.pestana, activa && styles.pestanaActiva]}
                onPress={() => setPestana(clave)}
              >
                <Text style={[styles.textoPestana, activa && styles.textoPestanaActiva]}>
                  {etiqueta}{cargando ? '' : ` (${cantidad})`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!cargando && !error && <ResumenPagoLocal pendientes={pendientesPago} />}
        {renderContenido()}
      </ScrollView>

      <ModalResumenPagoLocal
        visible={mostrarResumen}
        pendientes={pendientesPago}
        onClose={() => setMostrarResumen(false)}
      />
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
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  filaPestanas: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    padding: 3,
  },
  pestana: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  pestanaActiva: {
    backgroundColor: '#000000',
  },
  textoPestana: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  textoPestanaActiva: {
    color: '#FFFFFF',
  },
  filaAcciones: {
    flexDirection: 'row',
    marginTop: 12,
  },
  botonAccion: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  botonReprogramar: {
    backgroundColor: '#000000',
  },
  botonCancelar: {
    borderWidth: 1,
    borderColor: '#C62828',
  },
  textoReprogramar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  textoCancelar: {
    color: '#C62828',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cajaMensaje: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  cajaMensajeCancelacion: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#C62828',
  },
  cajaMensajeReprogramacion: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#EF6C00',
  },
  tituloMensaje: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  textoFechaAnterior: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  textoMensaje: {
    fontSize: 14,
    color: '#333333',
    marginTop: 6,
    fontStyle: 'italic',
  },
  autorMensaje: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'right',
  },
  indicadorAccion: {
    marginTop: 12,
  },
  textoNota: {
    fontSize: 12,
    color: '#888888',
    marginTop: 10,
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
  botonReservar: {
    marginTop: 14,
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  textoBotonReservar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
