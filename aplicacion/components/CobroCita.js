import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import api, { accion } from '../utils/api';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import {
  crearLinkPago,
  consultarEstadoPago,
  describirEstadoPago,
  formatearMonto,
  ESTADOS_EN_PROCESO,
} from '../utils/pagos';

// Cobro de una cita desde la vista del recepcionista.
// - Mostrador: efectivo, transferencia, QR... (registrar_cobro_cita). Cobra el saldo completo.
// - Mercado Pago: genera un link de pago para que el cliente pague desde su celular
//   (compartir) o para abrirlo en el celular del salón.
// cita: { idCitas, cliente, saldo, pagado, estadoPagoMp, medioPagoLocal }. onCambio: recargar la lista.
// medioPagoLocal: lo que el cliente eligió para pagar en el local (Efectivo/Transferencia) o null.
export default function CobroCita({ cita, onCambio }) {
  const [visible, setVisible] = useState(false);
  const [medios, setMedios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [link, setLink] = useState(null);
  const enProceso = ESTADOS_EN_PROCESO.includes(cita.estadoPagoMp);

  const errorDe = (error) => (error.response || error.request ? mensajeDeError(error) : error.message);

  const abrir = async () => {
    setVisible(true);
    setLink(null);
    setCargando(true);
    try {
      const response = await api.get(accion('get_medios_pago'));
      if (!esRespuestaValida(response.data) || !response.data.success) {
        throw new Error(response.data?.message || 'Respuesta inválida del servidor');
      }
      setMedios(response.data.data.filter((m) => !m.esMercadoPago));
    } catch (error) {
      console.log('Error en get_medios_pago:', error);
      Alert.alert('Error', errorDe(error));
    } finally {
      setCargando(false);
    }
  };

  const cerrar = () => {
    setVisible(false);
    onCambio?.();
  };

  const cobrarEnMostrador = (medio) => {
    Alert.alert(
      'Confirmar cobro',
      `¿Cobrar ${formatearMonto(cita.saldo)} a ${cita.cliente} en ${medio.medioPago}?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cobrar',
          onPress: async () => {
            setProcesando(true);
            try {
              const response = await api.post(accion('registrar_cobro_cita'), {
                idCitas: cita.idCitas,
                idMedios_pago: medio.idMedios_pago,
              });
              if (!esRespuestaValida(response.data)) {
                throw new Error('Respuesta inválida del servidor');
              }
              Alert.alert(response.data.success ? 'Cobro registrado' : 'Atención', response.data.message);
              if (response.data.success) {
                cerrar();
              }
            } catch (error) {
              console.log('Error en registrar_cobro_cita:', error);
              Alert.alert('Error', errorDe(error));
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  const generarLink = async () => {
    setProcesando(true);
    try {
      const datos = await crearLinkPago(cita.idCitas);
      setLink(datos.initPoint);
    } catch (error) {
      console.log('Error en crear_preferencia_cita:', error);
      Alert.alert('No se pudo generar el link', errorDe(error));
    } finally {
      setProcesando(false);
    }
  };

  const compartirLink = async () => {
    try {
      await Share.share({
        message: `Hola ${cita.cliente}, podés pagar tu cita (${formatearMonto(cita.saldo)}) con Mercado Pago acá: ${link}`,
      });
    } catch (error) {
      console.log('Error al compartir el link:', error);
    }
  };

  const abrirLinkAca = async () => {
    await WebBrowser.openBrowserAsync(link);
    await verEstado();
  };

  const verEstado = async () => {
    setProcesando(true);
    try {
      const estado = await consultarEstadoPago(cita.idCitas);
      const descripcion = describirEstadoPago(estado);
      Alert.alert('Estado del pago', descripcion?.texto || '');
      if (estado.pagada) {
        cerrar();
      }
    } catch (error) {
      console.log('Error en get_estado_pago_cita:', error);
      Alert.alert('Error', errorDe(error));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <View style={styles.fila}>
        <Text style={styles.textoSaldo}>
          {cita.pagado > 0 ? 'Saldo: ' : 'A cobrar: '}
          <Text style={styles.monto}>{formatearMonto(cita.saldo)}</Text>
          {enProceso ? '  ·  pago MP en proceso' : ''}
          {!enProceso && cita.medioPagoLocal ? `  ·  paga en el local (${cita.medioPagoLocal})` : ''}
        </Text>
        <Pressable style={styles.botonCobrar} onPress={abrir}>
          <Text style={styles.textoBotonCobrar}>Cobrar</Text>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={styles.fondo}>
          <View style={styles.modal}>
            <Text style={styles.titulo}>Cobrar cita</Text>
            <Text style={styles.subtitulo}>
              {cita.cliente} · {formatearMonto(cita.saldo)}
            </Text>
            {cita.medioPagoLocal && (
              <Text style={styles.textoEleccion}>El cliente eligió pagar en el local con {cita.medioPagoLocal}.</Text>
            )}

            {cargando || procesando ? (
              <ActivityIndicator size="large" color="#000000" style={styles.cargando} />
            ) : link ? (
              <>
                <Text style={styles.textoLink}>Link de pago generado (vence en 24 h).</Text>
                <Pressable style={styles.botonMp} onPress={compartirLink}>
                  <Text style={styles.textoBotonMp}>Enviar link al cliente</Text>
                </Pressable>
                <Pressable style={styles.botonSecundario} onPress={abrirLinkAca}>
                  <Text style={styles.textoSecundario}>Abrir en este celular</Text>
                </Pressable>
                <Pressable style={styles.botonSecundario} onPress={verEstado}>
                  <Text style={styles.textoSecundario}>Ver estado del pago</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.seccion}>En el mostrador</Text>
                {medios.map((medio) => (
                  <Pressable
                    key={medio.idMedios_pago}
                    style={styles.botonMedio}
                    onPress={() => cobrarEnMostrador(medio)}
                  >
                    <Text style={styles.textoMedio}>{medio.medioPago}</Text>
                  </Pressable>
                ))}
                {medios.length === 0 && (
                  <Text style={styles.textoAyuda}>No hay medios de pago cargados (migración 004).</Text>
                )}

                <Text style={styles.seccion}>Online</Text>
                {enProceso ? (
                  <Pressable style={styles.botonSecundario} onPress={verEstado}>
                    <Text style={styles.textoSecundario}>Hay un pago en proceso: ver estado</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.botonMp} onPress={generarLink}>
                    <Text style={styles.textoBotonMp}>Generar link de Mercado Pago</Text>
                  </Pressable>
                )}
              </>
            )}

            <Pressable style={styles.botonCerrar} onPress={cerrar} disabled={procesando}>
              <Text style={styles.textoCerrar}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  textoSaldo: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    marginRight: 8,
  },
  monto: {
    fontWeight: '900',
    color: '#000000',
  },
  botonCobrar: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  textoBotonCobrar: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  subtitulo: {
    fontSize: 14,
    color: '#333333',
    marginTop: 4,
    marginBottom: 8,
  },
  textoEleccion: {
    fontSize: 13,
    color: '#33691E',
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  seccion: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  botonMedio: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 6,
  },
  textoMedio: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  botonMp: {
    backgroundColor: '#009EE3',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 6,
  },
  textoBotonMp: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#009EE3',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 6,
  },
  textoSecundario: {
    color: '#009EE3',
    fontWeight: '700',
  },
  textoLink: {
    fontSize: 13,
    color: '#2E7D32',
    marginVertical: 8,
  },
  textoAyuda: {
    fontSize: 12,
    color: '#666666',
  },
  cargando: {
    marginVertical: 20,
  },
  botonCerrar: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  textoCerrar: {
    color: '#666666',
    fontWeight: '700',
  },
});
