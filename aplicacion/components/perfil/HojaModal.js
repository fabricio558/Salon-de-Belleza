import React from 'react';
import { Modal, View, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Titulo, Texto, Boton } from '../ui';

// Hoja inferior (bottom sheet) para los formularios del perfil: entra desde
// abajo, se cierra tocando el fondo, la X o el botón atrás de Android, y sube
// con el teclado. Pie fijo con Cancelar + acción principal.
export default function HojaModal({
  visible,
  titulo,
  subtitulo,
  onCerrar,
  textoAccion = 'Guardar',
  onAccion,
  cargando = false,
  children,
}) {
  const cerrar = cargando ? undefined : onCerrar;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cerrar} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.fondo} onPress={cerrar} accessibilityLabel="Cerrar" accessibilityRole="button" />
        <View style={styles.hoja}>
          <View style={styles.asa} />
          <View style={styles.encabezado}>
            <View style={styles.encabezadoTexto}>
              <Titulo nivel="h2">{titulo}</Titulo>
              {subtitulo ? (
                <Texto variante="bodySmall" color="textSecondary" style={styles.subtitulo}>
                  {subtitulo}
                </Texto>
              ) : null}
            </View>
            <Pressable
              onPress={cerrar}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              style={({ pressed }) => [styles.cerrar, pressed && styles.cerrarPresionado]}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cuerpo}>
            {children}
          </ScrollView>

          <View style={styles.pie}>
            <Boton titulo="Cancelar" variante="secondary" onPress={onCerrar} deshabilitado={cargando} style={styles.botonPie} />
            <Boton titulo={textoAccion} onPress={onAccion} cargando={cargando} style={styles.botonPie} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  fondo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  hoja: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl * 2,
    borderTopRightRadius: radius.xl * 2,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  asa: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.disabled,
    marginTop: spacing.sm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.pantalla,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  encabezadoTexto: {
    flex: 1,
  },
  subtitulo: {
    marginTop: spacing.xxs,
  },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  cerrarPresionado: {
    backgroundColor: colors.surfaceSubtle,
  },
  cuerpo: {
    paddingHorizontal: spacing.pantalla,
    paddingTop: spacing.sm,
  },
  pie: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.pantalla,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  botonPie: {
    flex: 1,
  },
});
