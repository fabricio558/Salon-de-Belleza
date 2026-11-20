import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatearFecha } from '../utils/fechas';
import { colors, typography, spacing, estiloEstadoCita } from '../theme';
import Tarjeta from './ui/Tarjeta';
import Badge from './ui/Badge';

// item: { fecha, hora, cliente, estilista, servicios, idEstado, estado, total, pagada? }
// `fecha` y `hora` vienen formateadas por el servidor en hora del salón: no se
// calculan desde fechaHoraTs para no depender de la zona horaria del dispositivo.
// mostrarFecha: antepone la fecha a la hora (para listas de varios días).
// mostrarCliente: false en la vista del cliente; el título pasa a ser el estilista.
// children: acciones que se muestran al pie de la tarjeta.
// Los colores de cada estado (estado_cita.idEstado) están en theme/theme.js.
export default function CardCita({ item, mostrarFecha = false, mostrarCliente = true, children }) {
  const estilo = estiloEstadoCita(item.idEstado);
  return (
    <Tarjeta variante="cita" colorBorde={estilo.borde}>
      <View style={styles.filaSuperior}>
        <View style={styles.contenedorHora}>
          {mostrarFecha && (
            <Text style={styles.fecha}>{formatearFecha(item.fecha)}</Text>
          )}
          <Text style={styles.hora}>{item.hora}</Text>
        </View>
        <Badge estado={item.idEstado} texto={item.estado} />
      </View>

      {mostrarCliente ? (
        <>
          <Text style={styles.textoCliente}>{item.cliente}</Text>
          <Detalle icono="cut-outline" texto={item.estilista} />
        </>
      ) : (
        <View style={styles.fila}>
          <Ionicons name="cut-outline" size={16} color={colors.primaryText} />
          <Text style={[styles.textoCliente, styles.textoConIcono]}>{item.estilista}</Text>
        </View>
      )}
      <Detalle icono="sparkles-outline" texto={item.servicios || 'Sin servicios cargados'} />
      {item.total > 0 && (
        <View style={styles.filaTotal}>
          {item.pagada && <Badge tono="success" texto="Pagada" icono="checkmark" style={styles.badgePagada} />}
          <Text style={styles.textoTotal}>${item.total.toLocaleString('es-AR')}</Text>
        </View>
      )}
      {children}
    </Tarjeta>
  );
}

function Detalle({ icono, texto }) {
  return (
    <View style={[styles.fila, styles.detalle]}>
      <Ionicons name={icono} size={15} color={colors.textMuted} />
      <Text style={[styles.textoDetalle, styles.textoConIcono]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contenedorHora: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fecha: {
    ...typography.caption,
    color: colors.primaryText,
    textTransform: 'capitalize',
  },
  hora: {
    ...typography.h2,
    fontSize: 20,
    color: colors.textStrong,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoConIcono: {
    marginLeft: spacing.xs + 2,
    flexShrink: 1,
  },
  textoCliente: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textStrong,
  },
  detalle: {
    marginTop: spacing.xs,
  },
  textoDetalle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  badgePagada: {
    marginRight: spacing.sm,
    alignSelf: 'center',
  },
  textoTotal: {
    ...typography.bodyStrong,
    color: colors.primaryText,
  },
});
