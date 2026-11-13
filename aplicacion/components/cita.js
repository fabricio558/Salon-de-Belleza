import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatearFecha } from '../utils/fechas';

// Colores por estado_cita.idEstado: 1 Activa, 2 Cancelada, 3 Finalizada, 4 En Curso.
const COLORES_ESTADO = {
  1: { fondo: '#E3F2FD', texto: '#1565C0' },
  2: { fondo: '#FFEBEE', texto: '#C62828' },
  3: { fondo: '#E8F5E9', texto: '#2E7D32' },
  4: { fondo: '#FFF3E0', texto: '#EF6C00' },
};

// item: { fecha, hora, cliente, estilista, servicios, idEstado, estado, total }
// `fecha` y `hora` vienen formateadas por el servidor en hora del salón: no se
// calculan desde fechaHoraTs para no depender de la zona horaria del dispositivo.
// mostrarFecha: antepone la fecha a la hora (para listas de varios días).
// mostrarCliente: false en la vista del cliente; el título pasa a ser el estilista.
// children: acciones que se muestran al pie de la tarjeta.
export default function CardCita({ item, mostrarFecha = false, mostrarCliente = true, children }) {
  const colores = COLORES_ESTADO[item.idEstado] || { fondo: '#F5F5F5', texto: '#666666' };
  return (
    <View style={styles.cardCita}>
      <View style={styles.filaSuperior}>
        <View style={styles.contenedorHora}>
          {mostrarFecha && (
            <Text style={styles.fecha}>{formatearFecha(item.fecha)}</Text>
          )}
          <Text style={styles.hora}>{item.hora}</Text>
        </View>
        <View style={[styles.chipEstado, { backgroundColor: colores.fondo }]}>
          <Text style={[styles.textoEstado, { color: colores.texto }]}>{item.estado}</Text>
        </View>
      </View>

      {mostrarCliente ? (
        <>
          <Text style={styles.textoCliente}>{item.cliente}</Text>
          <Text style={styles.textoDetalle}>✂️ {item.estilista}</Text>
        </>
      ) : (
        <Text style={styles.textoCliente}>✂️ {item.estilista}</Text>
      )}
      <Text style={styles.textoDetalle}>💇 {item.servicios || 'Sin servicios cargados'}</Text>
      {item.total > 0 && (
        <Text style={styles.textoTotal}>${item.total.toLocaleString('es-AR')}</Text>
      )}
      {children}
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
  contenedorHora: {
    flex: 1,
    marginRight: 8,
  },
  fecha: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    textTransform: 'capitalize',
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
