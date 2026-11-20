import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import Header from "../components/header";
import { colors, typography, spacing, radius } from '../theme';
import { Tarjeta, EstadoVacio, Titulo, Texto } from '../components/ui';

export default function FichaCliente({ navigation }) {
  const route = useRoute();
  const idClientes = route.params?.id_clientes ?? route.params?.id_clientes;

  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarCliente = async () => {
    try {
      const response = await api.get(`/index.php?action=get_clientes&id=${idClientes}`);
      if (response.data.success) {
        setCliente(response.data.data);
      } else {
        console.log("No se encontró el cliente:", response.data.message);
      }
    } catch (error) {
      console.log("Error al cargar el cliente:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (idClientes) {
      cargarCliente();
    } else {
      setCargando(false);
    }
  }, [idClientes]);

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Titulo nivel="h1" style={styles.titulo}>Ficha del cliente</Titulo>

        {cargando ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.cargando} />
        ) : !cliente ? (
          <EstadoVacio
            icono="person-circle-outline"
            titulo="Ningún cliente seleccionado"
            mensaje="Por favor seleccione un cliente desde la Agenda para ver su ficha."
          />
        ) : (
          <>
            <Tarjeta style={styles.tarjetaPerfil}>
              <View style={styles.avatar}>
                <Text style={styles.iniciales}>
                  {(cliente.nombres || '?').charAt(0)}{(cliente.apellido || '').charAt(0)}
                </Text>
              </View>
              <View style={styles.datosPerfil}>
                <Texto variante="h3" color="textStrong">{cliente.nombres} {cliente.apellido}</Texto>
                <Campo icono="mail-outline" etiqueta="Correo" valor={cliente.correo} />
                <Campo icono="gift-outline" etiqueta="Fecha de nacimiento" valor={cliente.fechaNacimiento} />
              </View>
            </Tarjeta>

            <Tarjeta variante="suave">
              <Nota icono="alert-circle-outline" etiqueta="Alergias" valor={cliente.notaAlergias ?? 'Ninguna'} />
              <View style={styles.separador} />
              <Nota icono="heart-outline" etiqueta="Preferencias" valor={cliente.notaPreferencias ?? 'Ninguna'} />
            </Tarjeta>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({ icono, etiqueta, valor }) {
  return (
    <View style={styles.campo} accessible accessibilityLabel={`${etiqueta}: ${valor || ''}`}>
      <Ionicons name={icono} size={15} color={colors.textMuted} />
      <Text style={styles.valorCampo}>{valor}</Text>
    </View>
  );
}

function Nota({ icono, etiqueta, valor }) {
  return (
    <View>
      <View style={styles.encabezadoNota}>
        <Ionicons name={icono} size={18} color={colors.primaryText} />
        <Text style={styles.etiqueta}>{etiqueta}</Text>
      </View>
      <Text style={styles.valorNota}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.pantalla,
  },
  titulo: {
    marginBottom: spacing.lg,
  },
  cargando: {
    marginTop: spacing.xl,
  },
  tarjetaPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  iniciales: {
    ...typography.h2,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  datosPerfil: {
    flex: 1,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  valorCampo: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginLeft: spacing.xs + 2,
    flexShrink: 1,
  },
  encabezadoNota: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  etiqueta: {
    ...typography.caption,
    color: colors.primaryText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.sm,
  },
  valorNota: {
    ...typography.body,
    color: colors.text,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
