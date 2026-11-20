import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, fuentes, radius } from '../../theme';
import { Texto, Titulo, Badge, Boton } from '../ui';
import Esqueleto from './Esqueleto';

// Cabecera de "Mi Perfil": avatar con iniciales (aro fino doble, como un sello),
// nombre en Playfair, correo, insignia del rol y el acceso a editar.
export default function CabeceraPerfil({ iniciales, nombre, correo, rol, iconoRol, cargando, onEditar }) {
  if (cargando) {
    return (
      <View style={styles.contenedor} accessibilityLabel="Cargando perfil">
        <View style={styles.fila}>
          <Esqueleto circulo alto={TAMANO_AVATAR + 8} />
          <View style={styles.datos}>
            <Esqueleto ancho="75%" alto={20} />
            <Esqueleto ancho="55%" alto={12} style={styles.separacion} />
            <Esqueleto ancho={72} alto={20} style={styles.separacion} />
          </View>
        </View>
        <Esqueleto alto={40} style={styles.boton} />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        <View style={styles.aro} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.avatar}>
            <Texto style={styles.iniciales} color="textOnPrimary">
              {iniciales}
            </Texto>
          </View>
        </View>

        <View style={styles.datos}>
          <Titulo nivel="h2" numberOfLines={2}>
            {nombre || 'Sin nombre'}
          </Titulo>
          {correo ? (
            <Texto variante="bodySmall" color="textSecondary" numberOfLines={1} style={styles.correo}>
              {correo}
            </Texto>
          ) : null}
          <Badge tono="dorado" icono={iconoRol} texto={rol} style={styles.badge} />
        </View>
      </View>

      <Boton
        titulo="Editar perfil"
        icono="create-outline"
        variante="secondary"
        tamano="sm"
        anchoCompleto
        onPress={onEditar}
        style={styles.boton}
        accessibilityLabel="Editar datos personales"
      />
    </View>
  );
}

const TAMANO_AVATAR = 76;

const styles = StyleSheet.create({
  contenedor: {
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Aro dorado fino + espacio blanco + avatar negro: como un sello.
  aro: {
    width: TAMANO_AVATAR + 8,
    height: TAMANO_AVATAR + 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: TAMANO_AVATAR,
    height: TAMANO_AVATAR,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: {
    fontFamily: fuentes.titulo,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 2,
  },
  datos: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  correo: {
    marginTop: spacing.xxs,
  },
  badge: {
    marginTop: spacing.sm,
  },
  separacion: {
    marginTop: spacing.sm,
  },
  boton: {
    marginTop: spacing.xl,
  },
});
