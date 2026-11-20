import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { Input, Texto } from './ui';
import { buscarServicios } from '../utils/servicios';
import { formatearMonto } from '../utils/pagos';

const MAX_RESULTADOS = 8;

// Elección de servicios en CrearCita, con buscador en lugar de la lista completa.
//   - Arriba, "Tu selección": lo elegido, con cantidad y botón para quitar.
//   - Abajo, el buscador: al escribir aparecen hasta 8 coincidencias; tocar una la
//     agrega (o la quita si ya estaba) sin borrar lo escrito, para elegir varias seguidas.
//   - Sin búsqueda, "Ver todos" despliega el catálogo completo.
// Props: servicios (catálogo de get_servicios), seleccionados ([{ idServicios, servicio, precio, cantidad }]),
//        onAlternar(servicio), onCambiarCantidad(idServicios, delta).
export default function BuscadorServicios({ servicios, seleccionados, onAlternar, onCambiarCantidad }) {
  const [busqueda, setBusqueda] = useState('');
  const [verTodos, setVerTodos] = useState(false);

  const hayBusqueda = busqueda.trim() !== '';
  const resultados = hayBusqueda ? buscarServicios(servicios, busqueda, MAX_RESULTADOS) : verTodos ? servicios : [];
  const totalCoincidencias = hayBusqueda ? buscarServicios(servicios, busqueda).length : 0;
  const estaSeleccionado = (id) => seleccionados.some((s) => s.idServicios === id);

  return (
    <View>
      {seleccionados.length > 0 ? (
        <View style={styles.seleccion}>
          <Texto variante="label" color="textSecondary" style={styles.etiqueta}>
            Tu selección ({seleccionados.length})
          </Texto>
          {seleccionados.map((s) => (
            <View key={s.idServicios} style={styles.filaSeleccion}>
              <View style={styles.flex}>
                <Texto variante="bodyStrong" color="textPrimary" numberOfLines={1}>
                  {s.servicio}
                </Texto>
                <Texto variante="caption" color="textSecondary">
                  {formatearMonto(s.precio)}
                  {s.cantidad > 1 ? ` × ${s.cantidad}` : ''}
                </Texto>
              </View>
              <View style={styles.controlCantidad}>
                <BotonIcono
                  icono="remove"
                  etiqueta={`Restar uno a ${s.servicio}`}
                  deshabilitado={s.cantidad <= 1}
                  onPress={() => onCambiarCantidad(s.idServicios, -1)}
                />
                <Texto style={styles.cantidad}>{s.cantidad}</Texto>
                <BotonIcono
                  icono="add"
                  etiqueta={`Sumar uno a ${s.servicio}`}
                  onPress={() => onCambiarCantidad(s.idServicios, 1)}
                />
              </View>
              <BotonIcono icono="close" etiqueta={`Quitar ${s.servicio}`} onPress={() => onAlternar(s)} />
            </View>
          ))}
        </View>
      ) : null}

      <View>
        <Input
          icono="search-outline"
          placeholder="Buscar servicio (corte, color, manicura...)"
          accessibilityLabel="Buscar servicio"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.buscador}
          inputStyle={styles.inputBuscador}
        />
        {hayBusqueda ? (
          <Pressable
            onPress={() => setBusqueda('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            style={styles.borrar}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {resultados.map((servicio) => (
        <FilaResultado
          key={servicio.idServicios}
          servicio={servicio}
          seleccionado={estaSeleccionado(servicio.idServicios)}
          onPress={() => onAlternar(servicio)}
        />
      ))}

      {hayBusqueda && resultados.length === 0 ? (
        <Texto variante="bodySmall" color="textSecondary" style={styles.ayuda}>
          No encontramos servicios con “{busqueda.trim()}”. Probá con otra palabra o mirá el catálogo completo.
        </Texto>
      ) : null}
      {hayBusqueda && totalCoincidencias > resultados.length ? (
        <Texto variante="caption" color="textSecondary" style={styles.ayuda}>
          Mostramos {resultados.length} de {totalCoincidencias}. Escribí algo más para afinar.
        </Texto>
      ) : null}

      {!hayBusqueda ? (
        <View style={styles.pie}>
          <Texto variante="caption" color="textSecondary" style={styles.flex}>
            {servicios.length} {servicios.length === 1 ? 'servicio disponible' : 'servicios disponibles'}.
            {verTodos ? '' : ' Escribí para buscar.'}
          </Texto>
          <Pressable
            onPress={() => setVerTodos((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [styles.verTodos, pressed && styles.presionado]}
          >
            <Texto variante="buttonSmall" color="textPrimary">
              {verTodos ? 'Ocultar' : 'Ver todos'}
            </Texto>
            <Ionicons name={verTodos ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textPrimary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function FilaResultado({ servicio, seleccionado, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: seleccionado }}
      accessibilityLabel={`${servicio.servicio}, ${formatearMonto(servicio.precio)}`}
      style={({ pressed }) => [styles.resultado, seleccionado && styles.resultadoElegido, pressed && styles.presionado]}
    >
      <View style={styles.flex}>
        <Texto variante="bodyStrong" color="textPrimary" numberOfLines={1}>
          {servicio.servicio}
        </Texto>
        <Texto variante="caption" color="textSecondary">
          {formatearMonto(servicio.precio)}
        </Texto>
      </View>
      <View style={[styles.marca, seleccionado && styles.marcaElegida]}>
        <Ionicons
          name={seleccionado ? 'checkmark' : 'add'}
          size={18}
          color={seleccionado ? colors.textOnPrimary : colors.textPrimary}
        />
      </View>
    </Pressable>
  );
}

function BotonIcono({ icono, etiqueta, deshabilitado = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [styles.botonIcono, pressed && styles.presionado]}
    >
      <Ionicons name={icono} size={18} color={deshabilitado ? colors.disabledText : colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  seleccion: {
    marginBottom: spacing.lg,
  },
  etiqueta: {
    marginBottom: spacing.sm,
  },
  filaSeleccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  controlCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cantidad: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  botonIcono: {
    width: spacing.toqueMinimo,
    height: spacing.toqueMinimo,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buscador: {
    marginBottom: spacing.sm,
  },
  inputBuscador: {
    paddingRight: spacing.xl, // lugar para el botón de borrar
  },
  // Sobre el campo, a la derecha (Input no tiene accesorio derecho). El campo mide 48.
  borrar: {
    position: 'absolute',
    right: spacing.md,
    top: 14,
    height: 20,
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  resultadoElegido: {
    borderColor: colors.primary,
  },
  presionado: {
    backgroundColor: colors.surfaceSubtle,
  },
  marca: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  marcaElegida: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ayuda: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  verTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
});
