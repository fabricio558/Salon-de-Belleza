import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, fuentes } from '../theme';
import { Texto, Boton } from './ui';
import Esqueleto from './perfil/Esqueleto';
import { mensajeDeError } from '../utils/manejoErrores';
import {
  obtenerDisponibilidad,
  parametroServicios,
  partesDia,
  rangoDias,
  formatearDuracion,
  estadoDia,
  primerDiaConLugar,
  paginaSiguiente,
  paginaAnterior,
} from '../utils/agenda';

// Agenda para reservar (CrearCita): días de a 7, y para el día elegido los
// horarios de inicio con su estado y los rangos que ya están reservados.
//   libre      → se puede tocar y elegir
//   reservado  → cae dentro de una cita del estilista
//   corto      → está libre, pero los servicios elegidos no terminan antes de la cita siguiente
// El servidor vuelve a validar al confirmar (crear_cita): esto solo guía.
//
// Props: idEstilistas, servicios ([{ idServicios, cantidad }]), seleccion ({ fecha, hora } o null),
//        onElegir(fecha, hora) (o onElegir(null) si la elección dejó de estar libre),
//        onOtroHorario() para abrir el selector manual.
export default function AgendaDisponibilidad({ idEstilistas, servicios, seleccion, onElegir, onOtroHorario }) {
  const [desde, setDesde] = useState(null); // null = desde hoy
  const [agenda, setAgenda] = useState(null);
  const [diaActivo, setDiaActivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const pedidoActual = useRef(0);
  const textoServicios = parametroServicios(servicios);

  // Otro estilista: volver a la primera semana.
  useEffect(() => {
    setDesde(null);
    setDiaActivo(null);
  }, [idEstilistas]);

  const cargar = async () => {
    if (!idEstilistas) {
      setAgenda(null);
      return;
    }
    const numero = ++pedidoActual.current;
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerDisponibilidad(idEstilistas, servicios, desde);
      if (numero !== pedidoActual.current) {
        return; // llegó tarde: el usuario ya cambió de estilista, servicios o semana
      }
      setAgenda(datos);
      setDiaActivo((actual) =>
        datos.dias.some((d) => d.fecha === actual)
          ? actual
          : datos.dias.some((d) => d.fecha === seleccion?.fecha)
            ? seleccion.fecha
            : primerDiaConLugar(datos.dias),
      );
      // Si al cambiar los servicios el horario elegido ya no entra, se descarta.
      const diaElegido = datos.dias.find((d) => d.fecha === seleccion?.fecha);
      const horario = diaElegido?.horarios.find((h) => h.hora === seleccion?.hora);
      if (horario && horario.estado !== 'libre') {
        onElegir(null);
      }
    } catch (err) {
      if (numero === pedidoActual.current) {
        setError(err.response || err.request ? mensajeDeError(err) : err.message);
      }
    } finally {
      if (numero === pedidoActual.current) {
        setCargando(false);
      }
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstilistas, textoServicios, desde]);

  if (!idEstilistas) {
    return (
      <View style={styles.aviso}>
        <Ionicons name="cut-outline" size={20} color={colors.textSecondary} />
        <Texto variante="bodySmall" color="textSecondary" style={styles.flex}>
          Elegí un estilista para ver sus días y horarios disponibles.
        </Texto>
      </View>
    );
  }

  if (error && !agenda) {
    return (
      <View style={styles.aviso}>
        <Ionicons name="cloud-offline-outline" size={20} color={colors.error} />
        <Texto variante="bodySmall" color="error" style={styles.flex}>
          {error}
        </Texto>
        <Boton titulo="Reintentar" variante="text" tamano="sm" onPress={cargar} />
      </View>
    );
  }

  if (!agenda) {
    return <EsqueletoAgenda />;
  }

  const dia = agenda.dias.find((d) => d.fecha === diaActivo) || agenda.dias[0];
  const enPrimeraPagina = agenda.desde <= agenda.hoy;

  return (
    <View>
      {/* Semana */}
      <View style={styles.navegacion}>
        <BotonFlecha
          icono="chevron-back"
          etiqueta="Semana anterior"
          deshabilitado={enPrimeraPagina || cargando}
          onPress={() => setDesde(paginaAnterior(agenda.desde, agenda.hoy))}
        />
        <Texto variante="label" color="textPrimary" style={styles.rango}>
          {rangoDias(agenda.dias)}
        </Texto>
        <BotonFlecha
          icono="chevron-forward"
          etiqueta="Semana siguiente"
          deshabilitado={cargando}
          onPress={() => setDesde(paginaSiguiente(agenda.desde))}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dias}>
        {agenda.dias.map((d) => (
          <TarjetaDia
            key={d.fecha}
            dia={d}
            activo={d.fecha === dia.fecha}
            tieneSeleccion={d.fecha === seleccion?.fecha}
            onPress={() => setDiaActivo(d.fecha)}
          />
        ))}
      </ScrollView>

      <View style={[styles.cuerpo, cargando && styles.cargando]}>
        <Texto variante="caption" color="textSecondary" style={styles.duracion}>
          {servicios.length > 0
            ? `Tus servicios duran ${formatearDuracion(agenda.duracion)}: te mostramos los horarios en los que entran completos.`
            : `Sin servicios elegidos calculamos ${formatearDuracion(agenda.duracion)}. Elegí tus servicios para ver la disponibilidad exacta.`}
        </Texto>

        <HorariosDelDia dia={dia} seleccion={seleccion} onElegir={onElegir} />

        <Reservados ocupados={dia.ocupados} abierto={dia.abierto} />
      </View>

      <Pressable
        onPress={onOtroHorario}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [styles.otroHorario, pressed && styles.presionado]}
      >
        <Ionicons name="time-outline" size={16} color={colors.textPrimary} />
        <Texto variante="buttonSmall" color="textPrimary">
          Elegir otro horario
        </Texto>
      </Pressable>
    </View>
  );
}

function BotonFlecha({ icono, etiqueta, deshabilitado, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [styles.flecha, pressed && styles.presionado, deshabilitado && styles.flechaDeshabilitada]}
    >
      <Ionicons name={icono} size={20} color={deshabilitado ? colors.disabledText : colors.textPrimary} />
    </Pressable>
  );
}

function TarjetaDia({ dia, activo, tieneSeleccion, onPress }) {
  const { dia: nombre, numero } = partesDia(dia.fecha, dia.diaSemana);
  const sinLugar = !dia.abierto || dia.libres === 0;
  const colorTexto = activo ? colors.textOnPrimary : sinLugar ? colors.textSecondary : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${nombre} ${numero}: ${estadoDia(dia)}`}
      style={({ pressed }) => [
        styles.dia,
        sinLugar && styles.diaSinLugar,
        activo && styles.diaActivo,
        pressed && !activo && styles.presionado,
      ]}
    >
      <Texto variante="label" style={[styles.diaNombre, { color: colorTexto }]}>
        {nombre}
      </Texto>
      <Texto style={[styles.diaNumero, { color: colorTexto }]}>{numero}</Texto>
      <Texto variante="caption" numberOfLines={1} style={[styles.diaEstado, { color: colorTexto }]}>
        {estadoDia(dia)}
      </Texto>
      {tieneSeleccion ? <View style={[styles.punto, activo && styles.puntoActivo]} /> : null}
    </Pressable>
  );
}

function HorariosDelDia({ dia, seleccion, onElegir }) {
  if (!dia.abierto) {
    return <MensajeDia icono="moon-outline" texto="El local está cerrado este día." />;
  }
  if (dia.horarios.length === 0) {
    return <MensajeDia icono="time-outline" texto="Ya no quedan horarios para hoy. Probá con otro día." />;
  }

  const manana = dia.horarios.filter((h) => h.hora < '13:00');
  const tarde = dia.horarios.filter((h) => h.hora >= '13:00');

  return (
    <View>
      {dia.libres === 0 ? (
        <MensajeDia icono="calendar-clear-outline" texto="Este día está completo. Probá con otro día." />
      ) : null}
      <Leyenda />
      {[
        ['Mañana', manana],
        ['Tarde', tarde],
      ].map(([titulo, horarios]) =>
        horarios.length > 0 ? (
          <View key={titulo} style={styles.franja}>
            <Texto variante="label" color="textSecondary" style={styles.franjaTitulo}>
              {titulo}
            </Texto>
            <View style={styles.grilla}>
              {horarios.map((h) => (
                <Horario
                  key={h.hora}
                  horario={h}
                  elegido={seleccion?.fecha === dia.fecha && seleccion?.hora === h.hora}
                  onPress={() => onElegir(dia.fecha, h.hora)}
                />
              ))}
            </View>
          </View>
        ) : null,
      )}
    </View>
  );
}

const DESCRIPCION_ESTADO = {
  libre: 'disponible',
  reservado: 'reservado',
  corto: 'no alcanza para tus servicios',
};

function Horario({ horario, elegido, onPress }) {
  const libre = horario.estado === 'libre';
  return (
    <Pressable
      onPress={onPress}
      disabled={!libre}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido, disabled: !libre }}
      accessibilityLabel={`${horario.hora}, ${DESCRIPCION_ESTADO[horario.estado]}`}
      style={({ pressed }) => [
        styles.horario,
        horario.estado === 'reservado' && styles.horarioReservado,
        horario.estado === 'corto' && styles.horarioCorto,
        elegido && styles.horarioElegido,
        pressed && libre && !elegido && styles.presionado,
      ]}
    >
      <Texto
        style={[
          styles.horarioTexto,
          !libre && styles.horarioTextoInactivo,
          horario.estado === 'reservado' && styles.tachado,
          elegido && styles.horarioTextoElegido,
        ]}
      >
        {horario.hora}
      </Texto>
    </Pressable>
  );
}

function Leyenda() {
  return (
    <View style={styles.leyenda} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <ItemLeyenda estilo={styles.muestraLibre} texto="Libre" />
      <ItemLeyenda estilo={styles.muestraReservado} texto="Reservado" />
      <ItemLeyenda estilo={styles.muestraCorto} texto="No alcanza" />
    </View>
  );
}

function ItemLeyenda({ estilo, texto }) {
  return (
    <View style={styles.itemLeyenda}>
      <View style={[styles.muestra, estilo]} />
      <Texto variante="caption" color="textSecondary">
        {texto}
      </Texto>
    </View>
  );
}

function Reservados({ ocupados, abierto }) {
  if (!abierto) {
    return null;
  }
  return (
    <View style={styles.reservados}>
      <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} style={styles.iconoReservados} />
      <Texto variante="caption" color="textSecondary" style={styles.flex}>
        {ocupados.length === 0
          ? 'Todavía no hay reservas este día.'
          : `Ya reservado: ${ocupados.map((o) => `${o.desde}–${o.hasta}`).join(' · ')}`}
      </Texto>
    </View>
  );
}

function MensajeDia({ icono, texto }) {
  return (
    <View style={styles.mensajeDia}>
      <Ionicons name={icono} size={18} color={colors.textSecondary} />
      <Texto variante="bodySmall" color="textSecondary" style={styles.flex}>
        {texto}
      </Texto>
    </View>
  );
}

function EsqueletoAgenda() {
  return (
    <View accessibilityLabel="Cargando agenda">
      <Esqueleto alto={20} ancho="50%" style={styles.esqueletoRango} />
      <View style={styles.dias}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Esqueleto key={i} ancho={ANCHO_DIA} alto={78} />
        ))}
      </View>
      <View style={styles.grilla}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Esqueleto key={i} ancho="22%" alto={40} />
        ))}
      </View>
    </View>
  );
}

const ANCHO_DIA = 64;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  navegacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rango: {
    flex: 1,
    textAlign: 'center',
  },
  flecha: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flechaDeshabilitada: {
    borderColor: colors.surfaceSubtle,
  },
  presionado: {
    backgroundColor: colors.surfaceSubtle,
  },
  dias: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dia: {
    width: ANCHO_DIA,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  diaSinLugar: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  diaActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  diaNombre: {
    fontSize: 10,
    lineHeight: 14,
  },
  diaNumero: {
    fontFamily: fuentes.tituloBold,
    fontSize: 22,
    lineHeight: 28,
  },
  diaEstado: {
    fontSize: 10,
    lineHeight: 14,
  },
  // Punto dorado: "acá está tu horario elegido".
  punto: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    marginTop: spacing.xxs,
  },
  puntoActivo: {
    backgroundColor: colors.goldOnDark,
  },
  cuerpo: {
    marginTop: spacing.md,
  },
  cargando: {
    opacity: 0.5,
  },
  duracion: {
    marginBottom: spacing.md,
  },
  leyenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  muestra: {
    width: 14,
    height: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  muestraLibre: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  muestraReservado: {
    borderColor: colors.surfaceSubtle,
    backgroundColor: colors.disabled,
  },
  muestraCorto: {
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceMuted,
  },
  franja: {
    marginTop: spacing.sm,
  },
  franjaTitulo: {
    marginBottom: spacing.xs,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  horario: {
    width: '22%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  horarioReservado: {
    borderColor: colors.surfaceSubtle,
    backgroundColor: colors.disabled,
  },
  horarioCorto: {
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceMuted,
  },
  horarioElegido: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  horarioTexto: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  horarioTextoInactivo: {
    color: colors.textSecondary,
  },
  horarioTextoElegido: {
    color: colors.textOnPrimary,
  },
  tachado: {
    textDecorationLine: 'line-through',
  },
  reservados: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconoReservados: {
    marginTop: 1,
  },
  mensajeDia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  otroHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },
  esqueletoRango: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
});
