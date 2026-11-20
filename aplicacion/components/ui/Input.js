import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';

// Campo de texto con label, foco y error. Acepta todas las props de TextInput.
//   <Input label="Correo" value={correo} onChangeText={setCorreo} error={errorCorreo} />
const Input = forwardRef(function Input(
  { label, error, ayuda, icono, style, inputStyle, onFocus, onBlur, multiline, ...props },
  ref,
) {
  const [enfocado, setEnfocado] = useState(false);

  // Borde gris medio (3.4:1, visible) que pasa a negro y más grueso con el foco:
  // el foco se nota sin agregar color. El error usa el rojo desaturado del tema.
  const colorBorde = error ? colors.error : enfocado ? colors.primary : colors.borderStrong;

  return (
    <View style={[styles.contenedor, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.campo,
          { borderColor: colorBorde },
          enfocado && styles.campoEnfocado,
          multiline && styles.campoMultilinea,
        ]}
      >
        {icono ? (
          <Ionicons name={icono} size={18} color={enfocado ? colors.textPrimary : colors.textSecondary} style={styles.icono} />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, multiline && styles.inputMultilinea, inputStyle]}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.textSecondary}
          multiline={multiline}
          accessibilityLabel={label || props.placeholder}
          onFocus={(e) => {
            setEnfocado(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            onBlur && onBlur(e);
          }}
          {...props}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={styles.ayuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md + 2,
  },
  campoEnfocado: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
  },
  campoMultilinea: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  icono: {
    marginRight: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textStrong,
    paddingVertical: spacing.md,
  },
  inputMultilinea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  ayuda: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default Input;
