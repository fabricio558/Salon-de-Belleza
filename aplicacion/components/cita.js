import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Colores por estado_cita.idEstado: 1 Activa, 2 Cancelada, 3 Finalizada, 4 En Curso.
const COLORES_ESTADO = {
  1: { fondo: '#E3F2FD', texto: '#1565C0' },
  2: { fondo: '#FFEBEE', texto: '#C62828' },
  3: { fondo: '#E8F5E9', texto: '#2E7D32' },
  4: { fondo: '#FFF3E0', texto: '#EF6C00' },
};

const pad = (n) => n.toString().padStart(2, '0');

export const horaDesdeTimestamp = (ts) => {
  const fecha = new Date(ts * 1000);
  return `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
};

// item: { fechaHoraTs, cliente, estilista, servicios, idEstado, estado, total }
export default function CardCita({ item }) {
  const colores = COLORES_ESTADO[item.idEstado] || { fondo: '#F5F5F5', texto: '#666666' };

  return (
    <View style={styles.cardCita}>
      <View style={styles.filaSuperior}>
        <Text style={styles.hora}>{horaDesdeTimestamp(item.fechaHoraTs)}</Text>
        <View style={[styles.chipEstado, { backgroundColor: colores.fondo }]}>
          <Text style={[styles.textoEstado, { color: colores.texto }]}>{item.estado}</Text>
        </View>
      </View>

      <Text style={styles.textoCliente}>{item.cliente}</Text>
      <Text style={styles.textoDetalle}>✂️ {item.estilista}</Text>
      <Text style={styles.textoDetalle}>💇 {item.servicios || 'Sin servicios cargados'}</Text>
      {item.total > 0 && (
        <Text style={styles.textoTotal}>${item.total.toLocaleString('es-AR')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardCita: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 2,
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hora: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  chipEstado: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  textoEstado: {
    fontSize: 12,
    fontWeight: '700',
  },
  textoCliente: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  textoDetalle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 3,
  },
  textoTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginTop: 6,
    textAlign: 'right',
  },
});
