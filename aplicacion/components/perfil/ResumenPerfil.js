import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, fuentes } from '../../theme';
import { Texto } from '../ui';
import Esqueleto from './Esqueleto';
import EtiquetaSeccion from './EtiquetaSeccion';

// Resumen del perfil (lo arma utils/perfil.js según el rol):
//   - una tarjeta destacada negra (próxima cita) o, si no hay, un aviso vacío con acción;
//   - una fila de métricas compactas. Todo es tocable y lleva a su pantalla.
// Si `resumen` es null (el servidor no respondió) la sección no se muestra:
// el perfil sigue siendo usable sin ella.
export default function ResumenPerfil({ resumen, cargando, onIr }) {
  if (cargando) {
    return (
      <View style={styles.seccion}>
        <EtiquetaSeccion>Resumen</EtiquetaSeccion>
        <Esqueleto alto={88} />
        <View style={styles.filaMetricas}>
          <Esqueleto alto={84} style={styles.metricaEsqueleto} />
          <Esqueleto alto={84} style={styles.metricaEsqueleto} />
        </View>
      </View>
    );
  }

  if (!resumen) {
    return null;
  }

  const { destacada, vacio, metricas } = resumen;

  return (
    <View style={styles.seccion}>
      <EtiquetaSeccion>Resumen</EtiquetaSeccion>

      {destacada ? <TarjetaDestacada {...destacada} onPress={() => onIr(destacada.destino)} /> : null}
      {vacio ? <AvisoVacio {...vacio} onPress={() => onIr(vacio.destino)} /> : null}

      <View style={styles.filaMetricas}>
        {metricas.map((m) => (
          <TarjetaMetrica key={m.clave} {...m} onPress={() => onIr(m.destino)} />
        ))}
      </View>
    </View>
  );
}

function TarjetaDestacada({ etiqueta, titulo, detalle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}: ${titulo}. ${detalle || ''}`}
      style={({ pressed }) => [styles.destacada, pressed && styles.destacadaPresionada]}
    >
      <View style={styles.destacadaTexto}>
        <Texto variante="label" color="goldOnDark">
          {etiqueta}
        </Texto>
        <Texto style={styles.destacadaTitulo} color="textOnPrimary">
          {titulo}
        </Texto>
        {detalle ? (
          <Texto variante="bodySmall" color="textOnPrimary" numberOfLines={2} style={styles.destacadaDetalle}>
            {detalle}
          </Texto>
        ) : null}
      </View>
      <Ionicons name="arrow-forward" size={20} color={colors.goldOnDark} />
    </Pressable>
  );
}

function AvisoVacio({ mensaje, accion, onPress }) {
  return (
    <View style={styles.vacio}>
      <Texto variante="bodySmall" color="textSecondary" style={styles.vacioTexto}>
        {mensaje}
      </Texto>
      <Pressable
        onPress={onPress}
        hitSlop={10}
        accessibilityRole="button"
        style={({ pressed }) => [styles.vacioAccion, pressed && styles.vacioAccionPresionada]}
      >
        <Texto variante="buttonSmall" color="textPrimary">
          {accion}
        </Texto>
        <Ionicons name="arrow-forward" size={14} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

function TarjetaMetrica({ etiqueta, valor, icono, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}: ${valor}`}
      style={({ pressed }) => [styles.metrica, pressed && styles.metricaPresionada]}
    >
      <Ionicons name={icono} size={18} color={colors.textSecondary} />
      <Texto style={[styles.metricaValor, valor === 0 && styles.metricaValorCero]}>{valor}</Texto>
      <Texto variante="label" color="textSecondary" numberOfLines={1} style={styles.metricaEtiqueta}>
        {etiqueta}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seccion: {
    marginTop: spacing.xl,
  },
  destacada: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg + 2,
  },
  destacadaPresionada: {
    backgroundColor: colors.primaryPressed,
  },
  destacadaTexto: {
    flex: 1,
    marginRight: spacing.md,
  },
  destacadaTitulo: {
    fontFamily: fuentes.titulo,
    fontSize: 22,
    lineHeight: 30,
    marginTop: spacing.xs,
  },
  destacadaDetalle: {
    opacity: 0.85,
    marginTop: spacing.xxs,
  },
  vacio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  vacioTexto: {
    flex: 1,
    marginRight: spacing.md,
  },
  vacioAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  vacioAccionPresionada: {
    backgroundColor: colors.surfaceSubtle,
  },
  filaMetricas: {
    flexDirection: 'row',
    gap: spacing.entreTarjetas,
    marginTop: spacing.entreTarjetas,
  },
  metrica: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 84,
  },
  metricaPresionada: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderStrong,
  },
  metricaEsqueleto: {
    flex: 1,
  },
  metricaValor: {
    ...typography.subtitle,
    fontFamily: fuentes.tituloBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  // Un cero no es una alerta: se muestra atenuado para no competir con lo que sí hay.
  metricaValorCero: {
    color: colors.textSecondary,
  },
  metricaEtiqueta: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
