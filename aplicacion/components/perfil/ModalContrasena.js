import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { Input, Texto } from '../ui';
import HojaModal from './HojaModal';
import AvisoError from './AvisoError';
import { validarContrasenas } from '../../utils/perfil';

// Cambio de contraseña. La actual la verifica el servidor (update_contrasena).
// onGuardar(actual, nueva) devuelve una promesa con { ok, message }.
export default function ModalContrasena({ visible, onCerrar, onGuardar }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const refNueva = useRef(null);

  // Al abrir, todo vacío: las contraseñas no quedan en memoria entre aperturas.
  useEffect(() => {
    if (visible) {
      setActual('');
      setNueva('');
      setMostrar(false);
      setErrores({});
      setErrorServidor(null);
    }
  }, [visible]);

  const guardar = async () => {
    const nuevosErrores = validarContrasenas(actual, nueva);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }
    setGuardando(true);
    setErrorServidor(null);
    const resultado = await onGuardar(actual, nueva);
    setGuardando(false);
    if (!resultado.ok) {
      setErrorServidor(resultado.message);
    }
  };

  return (
    <HojaModal
      visible={visible}
      titulo="Contraseña"
      subtitulo="Ingresá la actual y elegí una nueva."
      onCerrar={onCerrar}
      onAccion={guardar}
      cargando={guardando}
      textoAccion="Actualizar"
    >
      <AvisoError mensaje={errorServidor} />
      <Input
        label="Contraseña actual"
        icono="lock-closed-outline"
        value={actual}
        onChangeText={(t) => {
          setActual(t);
          setErrores((e) => ({ ...e, actual: undefined }));
        }}
        error={errores.actual}
        secureTextEntry={!mostrar}
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="next"
        onSubmitEditing={() => refNueva.current?.focus()}
      />
      <Input
        ref={refNueva}
        label="Nueva contraseña"
        icono="key-outline"
        value={nueva}
        onChangeText={(t) => {
          setNueva(t);
          setErrores((e) => ({ ...e, nueva: undefined }));
        }}
        error={errores.nueva}
        ayuda="Mínimo 6 caracteres."
        secureTextEntry={!mostrar}
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={guardar}
      />
      <Pressable
        onPress={() => setMostrar((m) => !m)}
        hitSlop={8}
        accessibilityRole="switch"
        accessibilityState={{ checked: mostrar }}
        style={styles.mostrar}
      >
        <Ionicons name={mostrar ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textPrimary} />
        <Texto variante="buttonSmall" color="textPrimary">
          {mostrar ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
        </Texto>
      </Pressable>
    </HojaModal>
  );
}

const styles = StyleSheet.create({
  mostrar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: 44,
    marginBottom: spacing.sm,
  },
});
