import React, { Children, Fragment } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Texto } from '../ui';
import EtiquetaSeccion from './EtiquetaSeccion';

// Grupo de filas tipo "ajustes": título de sección y filas separadas por una
// línea fina que arranca después del ícono (como iOS), dentro de un borde de 1 px.
//   <GrupoAjustes titulo="Cuenta">
//     <FilaAjuste icono="person-outline" titulo="Datos personales" detalle="..." onPress={...} />
//   </GrupoAjustes>
export function GrupoAjustes({ titulo, children, style }) {
  const filas = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.grupo, style]}>
      {titulo ? <EtiquetaSeccion>{titulo}</EtiquetaSeccion> : null}
      <View style={styles.caja}>
        {filas.map((fila, i) => (
          <Fragment key={fila.key ?? i}>
            {i > 0 ? <View style={styles.separador} /> : null}
            {fila}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

// Fila de ajuste.
//   peligro → texto e ícono en el rojo del tema y sin chevron (acción, no navegación).
//   valor   → texto a la derecha (por ejemplo, el estado de algo).
export function FilaAjuste({ icono, titulo, detalle, valor, peligro = false, onPress, accessibilityLabel }) {
  const colorPrincipal = peligro ? colors.error : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || [titulo, detalle].filter(Boolean).join('. ')}
      android_ripple={{ color: peligro ? colors.errorSoft : colors.surfaceSubtle }}
      style={({ pressed }) => [styles.fila, pressed && (peligro ? styles.presionadaPeligro : styles.presionada)]}
    >
      <View style={[styles.icono, peligro && styles.iconoPeligro]}>
        <Ionicons name={icono} size={18} color={colorPrincipal} />
      </View>
      <View style={styles.textos}>
        <Texto variante="bodyStrong" color={colorPrincipal} numberOfLines={1}>
          {titulo}
        </Texto>
        {detalle ? (
          <Texto variante="caption" color="textSecondary" numberOfLines={1} style={styles.detalle}>
            {detalle}
          </Texto>
        ) : null}
      </View>
      {valor ? (
        <Texto variante="caption" color="textSecondary" style={styles.valor}>
          {valor}
        </Texto>
      ) : null}
      {!peligro && onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

const ANCHO_ICONO = 36;

const styles = StyleSheet.create({
  grupo: {
    marginTop: spacing.seccion,
  },
  caja: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  presionada: {
    backgroundColor: colors.surfaceSubtle,
  },
  presionadaPeligro: {
    backgroundColor: colors.errorSoft,
  },
  icono: {
    width: ANCHO_ICONO,
    height: ANCHO_ICONO,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconoPeligro: {
    borderColor: colors.errorSoft,
    backgroundColor: colors.errorSoft,
  },
  textos: {
    flex: 1,
  },
  detalle: {
    marginTop: 1,
  },
  valor: {
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + ANCHO_ICONO + spacing.md,
  },
});
