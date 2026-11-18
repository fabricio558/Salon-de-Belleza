import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { agruparPagoLocal, formatearMonto, INSTRUCCIONES_PAGO_LOCAL } from '../utils/pagos';
import { formatearFecha } from '../utils/fechas';

const ICONOS = { Efectivo: '💵', Transferencia: '🏦' };

const describirItem = (item) =>
  item.tipo === 'cita'
    ? {
        titulo: `Cita del ${formatearFecha(item.fecha)} · ${item.hora}`,
        detalle: [item.servicios, item.estilista].filter(Boolean).join(' · '),
      }
    : {
        titulo: `Pedido #${item.idPedido}`,
        detalle: `Retiralo antes del ${formatearFecha(item.fechaVence)} a las ${item.horaVence}`,
      };

// Citas y pedidos pendientes que el cliente eligió pagar en el local, agrupados por medio
// (Efectivo / Transferencia), con el total y cómo se abona cada uno.
// pendientes: lo que devuelve obtenerPagosPendientes(). No muestra nada si no hay ninguno.
export default function ResumenPagoLocal({ pendientes, titulo = 'A pagar en el local' }) {
  const grupos = agruparPagoLocal(pendientes);
  if (grupos.length === 0) {
    return null;
  }
  const total = grupos.reduce((suma, grupo) => suma + grupo.total, 0);

  return (
    <View style={styles.tarjeta}>
      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>🏪 {titulo}</Text>
        <Text style={styles.total}>{formatearMonto(total)}</Text>
      </View>
      {grupos.map((grupo) => (
        <View key={grupo.medioPago} style={styles.grupo}>
          <View style={styles.filaTitulo}>
            <Text style={styles.medio}>
              {ICONOS[grupo.medioPago] || '•'} {grupo.medioPago}
            </Text>
            <Text style={styles.subtotal}>{formatearMonto(grupo.total)}</Text>
          </View>
          {INSTRUCCIONES_PAGO_LOCAL[grupo.medioPago] && (
            <Text style={styles.instruccion}>{INSTRUCCIONES_PAGO_LOCAL[grupo.medioPago]}</Text>
          )}
          {grupo.items.map((item) => {
            const { titulo: tituloItem, detalle } = describirItem(item);
            return (
              <View key={`${item.tipo}-${item.id}`} style={styles.item}>
                <View style={styles.textoItem}>
                  <Text style={styles.tituloItem}>{tituloItem}</Text>
                  {detalle ? <Text style={styles.detalleItem}>{detalle}</Text> : null}
                </View>
                <Text style={styles.montoItem}>{formatearMonto(item.saldo)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// El mismo resumen en un modal, para mostrarlo apenas el cliente elige pagar en el local.
export function ModalResumenPagoLocal({ visible, pendientes, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fondo}>
        <View style={styles.modal}>
          <Text style={styles.tituloModal}>Listo, lo pagás en el local</Text>
          <Text style={styles.subtituloModal}>
            Esto es lo que tenés pendiente para abonar en el salón y cómo lo vas a pagar:
          </Text>
          <ScrollView style={styles.scroll}>
            <ResumenPagoLocal pendientes={pendientes} titulo="Total a pagar en el local" />
          </ScrollView>
          <Pressable style={styles.botonCerrar} onPress={onClose}>
            <Text style={styles.textoCerrar}>Entendido</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '900',
    color: '#33691E',
  },
  total: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
  },
  grupo: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCEDC8',
  },
  medio: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  instruccion: {
    fontSize: 12,
    color: '#558B2F',
    marginTop: 3,
    marginBottom: 6,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  textoItem: {
    flex: 1,
    marginRight: 8,
  },
  tituloItem: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  detalleItem: {
    fontSize: 12,
    color: '#666666',
    marginTop: 1,
  },
  montoItem: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
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
    maxHeight: '85%',
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  subtituloModal: {
    fontSize: 13,
    color: '#555555',
    marginTop: 4,
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  botonCerrar: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  textoCerrar: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
