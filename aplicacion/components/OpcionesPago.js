import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { mensajeDeError } from '../utils/manejoErrores';
import {
  pagarCita,
  pagarPedido,
  consultarEstadoPago,
  consultarEstadoPagoPedido,
  elegirPagoLocal,
  describirEstadoPago,
  formatearMonto,
  ESTADOS_EN_PROCESO,
} from '../utils/pagos';

// Cómo paga el cliente una cita o un pedido (Mis Citas y Mis Pedidos):
// - en la app, con Mercado Pago (Checkout Pro);
// - en el local, eligiendo Efectivo o Transferencia (elegir_pago_local; solo avisa al salón).
// tipo: 'cita' | 'pedido'.
// item: { id, saldo, pagado, estadoPagoMp, idMedioPagoLocal, medioPagoLocal }.
// mediosLocal: [{ idMedios_pago, medioPago }] (de get_pagos_pendientes). Si está vacío, solo MP.
// onCambio: recargar después de pagar o consultar.
// onElegirLocal: después de elegir pagar en el local (async: recargar y mostrar el resumen).
export default function OpcionesPago({ tipo, item, mediosLocal = [], onCambio, onElegirLocal }) {
  const [procesando, setProcesando] = useState(false);
  const [eligiendoLocal, setEligiendoLocal] = useState(false);
  const enProceso = ESTADOS_EN_PROCESO.includes(item.estadoPagoMp);
  const pagaEnLocal = Boolean(item.medioPagoLocal);
  const nombre = tipo === 'cita' ? 'la cita' : 'el pedido';

  const errorDe = (error) => (error.response ? mensajeDeError(error) : error.message);

  const mostrarResultado = (estado) => {
    const descripcion = describirEstadoPago(estado);
    if (descripcion) {
      Alert.alert(descripcion.tipo === 'ok' ? 'Pago confirmado' : 'Estado del pago', descripcion.texto);
    }
  };

  const pagarEnApp = async () => {
    setProcesando(true);
    try {
      const pagar = tipo === 'cita' ? pagarCita : pagarPedido;
      mostrarResultado(await pagar(item.id));
    } catch (error) {
      console.log(`Error al pagar ${nombre}:`, error);
      Alert.alert('No se pudo pagar', errorDe(error));
    } finally {
      setProcesando(false);
      onCambio?.();
    }
  };

  const actualizar = async () => {
    setProcesando(true);
    try {
      const consultar = tipo === 'cita' ? consultarEstadoPago : consultarEstadoPagoPedido;
      mostrarResultado(await consultar(item.id));
    } catch (error) {
      console.log('Error al consultar el pago:', error);
      Alert.alert('Error', errorDe(error));
    } finally {
      setProcesando(false);
      onCambio?.();
    }
  };

  const elegir = async (idMedios_pago) => {
    setProcesando(true);
    try {
      const respuesta = await elegirPagoLocal(tipo, item.id, idMedios_pago);
      setEligiendoLocal(false);
      if (idMedios_pago !== null && onElegirLocal) {
        await onElegirLocal();
      } else {
        Alert.alert('Listo', respuesta.message);
      }
    } catch (error) {
      console.log('Error en elegir_pago_local:', error);
      Alert.alert('No se pudo guardar', errorDe(error));
    } finally {
      setProcesando(false);
      onCambio?.();
    }
  };

  const renderSelectorLocal = () => (
    <View style={styles.selector}>
      <Text style={styles.textoSelector}>¿Cómo vas a pagar en el local?</Text>
      <View style={styles.fila}>
        {mediosLocal.map((medio) => {
          const elegido = medio.idMedios_pago === item.idMedioPagoLocal;
          return (
            <Pressable
              key={medio.idMedios_pago}
              style={[styles.botonMedio, elegido && styles.botonMedioElegido]}
              onPress={() => elegir(medio.idMedios_pago)}
            >
              <Text style={[styles.textoMedio, elegido && styles.textoMedioElegido]}>
                {medio.medioPago === 'Efectivo' ? '💵 ' : '🏦 '}
                {medio.medioPago}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.filaEnlaces}>
        {pagaEnLocal && (
          <Pressable onPress={() => elegir(null)}>
            <Text style={styles.enlace}>Ya no pagar en el local</Text>
          </Pressable>
        )}
        <Pressable onPress={() => setEligiendoLocal(false)}>
          <Text style={styles.enlace}>Volver</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderOpciones = () => {
    if (enProceso) {
      return (
        <>
          <Text style={styles.textoProceso}>Tenés un pago en proceso con Mercado Pago.</Text>
          <Pressable style={[styles.boton, styles.botonMpSecundario]} onPress={actualizar}>
            <Text style={[styles.textoBoton, styles.textoMpSecundario]}>Actualizar estado del pago</Text>
          </Pressable>
        </>
      );
    }
    if (eligiendoLocal) {
      return renderSelectorLocal();
    }
    return (
      <>
        {pagaEnLocal && (
          <View style={styles.cajaLocal}>
            <Text style={styles.textoLocal}>
              🏪 Vas a pagar en el local con <Text style={styles.negrita}>{item.medioPagoLocal}</Text>.
            </Text>
            <Pressable onPress={() => setEligiendoLocal(true)}>
              <Text style={styles.enlace}>Cambiar</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.fila}>
          <Pressable
            style={({ pressed }) => [styles.boton, styles.botonMp, pressed && styles.presionado]}
            onPress={pagarEnApp}
          >
            <Text style={styles.textoBoton}>{pagaEnLocal ? 'Pagar ahora en la app' : 'Pagar en la app'}</Text>
            <Text style={styles.textoAclaracion}>Mercado Pago</Text>
          </Pressable>
          {!pagaEnLocal && mediosLocal.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.boton, styles.botonLocal, pressed && styles.presionado]}
              onPress={() => setEligiendoLocal(true)}
            >
              <Text style={[styles.textoBoton, styles.textoLocalBoton]}>Pagar en el local</Text>
              <Text style={[styles.textoAclaracion, styles.textoLocalBoton]}>Efectivo o transferencia</Text>
            </Pressable>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.textoSaldo}>
        {item.pagado > 0 ? 'Saldo a pagar: ' : 'A pagar: '}
        <Text style={styles.negrita}>{formatearMonto(item.saldo)}</Text>
      </Text>
      {procesando ? <ActivityIndicator color="#000000" style={styles.indicador} /> : renderOpciones()}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  textoSaldo: {
    fontSize: 13,
    color: '#333333',
    marginBottom: 6,
  },
  negrita: {
    fontWeight: '900',
    color: '#000000',
  },
  textoProceso: {
    fontSize: 12,
    color: '#EF6C00',
    marginBottom: 6,
  },
  fila: {
    flexDirection: 'row',
    marginHorizontal: -3,
  },
  boton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  botonMp: {
    backgroundColor: '#009EE3',
  },
  botonMpSecundario: {
    flex: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#009EE3',
  },
  botonLocal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  presionado: {
    opacity: 0.8,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  textoMpSecundario: {
    color: '#009EE3',
  },
  textoLocalBoton: {
    color: '#000000',
  },
  textoAclaracion: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 1,
  },
  cajaLocal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  textoLocal: {
    flex: 1,
    fontSize: 13,
    color: '#33691E',
    marginRight: 8,
  },
  selector: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 10,
  },
  textoSelector: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  botonMedio: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  botonMedioElegido: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  textoMedio: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  textoMedioElegido: {
    color: '#FFFFFF',
  },
  filaEnlaces: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  enlace: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
    marginLeft: 16,
  },
  indicador: {
    marginVertical: 8,
  },
});
