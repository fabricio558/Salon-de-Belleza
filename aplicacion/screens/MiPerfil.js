import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, SafeAreaView, RefreshControl, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/header';
import { Titulo, Texto, Boton, EstadoVacio } from '../components/ui';
import {
  CabeceraPerfil,
  ResumenPerfil,
  GrupoAjustes,
  FilaAjuste,
  ModalEditarPerfil,
  ModalContrasena,
  AvisoFlotante,
} from '../components/perfil';
import { colors, spacing } from '../theme';
import { CLAVE_SESION, leerSesion } from '../utils/api';
import { esRespuestaValida, mensajeDeError } from '../utils/manejoErrores';
import { cerrarSesion } from '../utils/sesion';
import {
  configPerfil,
  datosDesdeRespuesta,
  iniciales,
  cambiarContrasena,
} from '../utils/perfil';

// "Mi Perfil" de los tres roles. Lo que cambia por rol (endpoints, campos y
// resumen) está en CONFIG_PERFIL de utils/perfil.js; acá solo está la UI.
//
// Estructura: cabecera (avatar, nombre, rol, editar) → resumen tocable →
// grupos de ajustes (cuenta, preferencias del cliente) → cerrar sesión, aparte.
// Editar abre hojas inferiores, así la pantalla sigue siendo una vista limpia.
export default function MiPerfil({ navigation }) {
  const [sesion, setSesion] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [resumen, setResumen] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [modal, setModal] = useState(null); // 'datos' | 'notas' | 'contrasena'
  const [aviso, setAviso] = useState(null);

  const config = configPerfil(sesion?.idRol);
  const sesionRef = useRef(null);

  const cargarResumen = useCallback(async (sesionActual) => {
    if (!sesionActual) {
      return;
    }
    const nuevo = await configPerfil(sesionActual.idRol).resumen(sesionActual);
    setResumen(nuevo);
    setCargandoResumen(false);
  }, []);

  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const sesionActual = await leerSesion();
      if (!sesionActual?.idUsuarios) {
        setError('No se encontró tu sesión. Volvé a iniciar sesión.');
        return;
      }
      sesionRef.current = sesionActual;
      setSesion(sesionActual);
      const cfg = configPerfil(sesionActual.idRol);
      const perfil = await cfg.cargar(sesionActual);
      setDatos(datosDesdeRespuesta(cfg, perfil));
      cargarResumen(sesionActual);
    } catch (err) {
      console.log('Error cargando el perfil:', err);
      setError(err.response || err.request ? mensajeDeError(err) : err.message);
    } finally {
      setCargando(false);
    }
  }, [cargarResumen]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Al volver a la pantalla (por ejemplo, después de reservar) se actualiza el
  // resumen sin esqueleto: los números cambian en el lugar.
  useFocusEffect(
    useCallback(() => {
      cargarResumen(sesionRef.current);
    }, [cargarResumen]),
  );

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([
      cargarResumen(sesionRef.current),
      (async () => {
        try {
          const perfil = await config.cargar(sesionRef.current);
          setDatos(datosDesdeRespuesta(config, perfil));
        } catch (err) {
          console.log('Error refrescando el perfil:', err);
        }
      })(),
    ]);
    setRefrescando(false);
  };

  const guardarDatos = async (borrador) => {
    try {
      const response = await config.guardar(sesion, borrador);
      if (!esRespuestaValida(response.data)) {
        return { ok: false, message: 'Respuesta inválida del servidor.' };
      }
      if (!response.data.success) {
        return { ok: false, message: response.data.message || 'No se pudieron guardar los cambios.' };
      }
      const guardados = { ...borrador, nombres: borrador.nombres.trim(), apellido: borrador.apellido.trim(), correo: borrador.correo.trim() };
      setDatos(guardados);
      // Otras pantallas saludan con el nombre de la sesión: se mantiene al día.
      const nuevaSesion = { ...sesion, nombres: guardados.nombres, apellido: guardados.apellido };
      setSesion(nuevaSesion);
      sesionRef.current = nuevaSesion;
      AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(nuevaSesion)).catch(() => {});
      setModal(null);
      setAviso(modal === 'notas' ? 'Notas guardadas' : 'Datos actualizados');
      return { ok: true };
    } catch (err) {
      return { ok: false, message: mensajeDeError(err) };
    }
  };

  const guardarContrasena = async (actual, nueva) => {
    try {
      const response = await cambiarContrasena(actual, nueva);
      if (!esRespuestaValida(response.data)) {
        return { ok: false, message: 'Respuesta inválida del servidor.' };
      }
      if (!response.data.success) {
        return { ok: false, message: response.data.message || 'No se pudo cambiar la contraseña.' };
      }
      setModal(null);
      setAviso('Contraseña actualizada');
      return { ok: true };
    } catch (err) {
      return { ok: false, message: mensajeDeError(err) };
    }
  };

  const confirmarCierre = () => {
    Alert.alert('Cerrar sesión', '¿Querés salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => cerrarSesion(navigation) },
    ]);
  };

  const ocultarAviso = useCallback(() => setAviso(null), []);

  const nombreCompleto = datos ? `${datos.nombres} ${datos.apellido}`.trim() : '';
  const resumenNotas = datos
    ? [datos.notaAlergias && `Alergias: ${datos.notaAlergias}`, datos.notaPreferencias && `Preferencias: ${datos.notaPreferencias}`]
        .filter(Boolean)
        .join(' · ')
    : '';

  const contenido = () => {
    if (error) {
      return (
        <EstadoVacio icono="cloud-offline-outline" titulo="No pudimos cargar tu perfil" mensaje={error} style={styles.error}>
          <Boton titulo="Reintentar" icono="refresh" onPress={cargarPerfil} anchoCompleto />
        </EstadoVacio>
      );
    }

    return (
      <>
        <CabeceraPerfil
          cargando={cargando}
          iniciales={iniciales(datos?.nombres, datos?.apellido)}
          nombre={nombreCompleto}
          correo={datos?.correo}
          rol={config.nombreRol}
          iconoRol={config.icono}
          onEditar={() => setModal('datos')}
        />

        <ResumenPerfil
          resumen={resumen}
          cargando={cargando || cargandoResumen}
          onIr={(destino) => navigation.navigate(destino)}
        />

        {!cargando ? (
          <>
            <GrupoAjustes titulo="Cuenta">
              <FilaAjuste
                icono="person-outline"
                titulo="Datos personales"
                detalle="Nombre, correo y fecha de nacimiento"
                onPress={() => setModal('datos')}
              />
              <FilaAjuste
                icono="lock-closed-outline"
                titulo="Contraseña"
                detalle="Cambiala cuando quieras"
                valor="••••••"
                onPress={() => setModal('contrasena')}
              />
            </GrupoAjustes>

            {config.tieneNotas ? (
              <GrupoAjustes titulo="Preferencias">
                <FilaAjuste
                  icono="leaf-outline"
                  titulo="Notas para tu estilista"
                  detalle={resumenNotas || 'Alergias y preferencias: sin cargar'}
                  onPress={() => setModal('notas')}
                />
              </GrupoAjustes>
            ) : null}

            <GrupoAjustes titulo="Sesión">
              <FilaAjuste icono="log-out-outline" titulo="Cerrar sesión" peligro onPress={confirmarCierre} />
            </GrupoAjustes>

            <Texto variante="label" color="textSecondary" centrado style={styles.pie}>
              Mandala · Salón de belleza
            </Texto>
          </>
        ) : null}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          datos ? (
            <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined
        }
      >
        <Titulo style={styles.titulo}>Mi perfil</Titulo>
        {contenido()}
      </ScrollView>

      {datos ? (
        <>
          <ModalEditarPerfil
            visible={modal === 'datos' || modal === 'notas'}
            seccion={modal === 'notas' ? 'notas' : 'datos'}
            datos={datos}
            onCerrar={() => setModal(null)}
            onGuardar={guardarDatos}
          />
          <ModalContrasena visible={modal === 'contrasena'} onCerrar={() => setModal(null)} onGuardar={guardarContrasena} />
        </>
      ) : null}

      <AvisoFlotante mensaje={aviso} onOcultar={ocultarAviso} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.pantalla,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  titulo: {
    marginBottom: spacing.xs,
  },
  error: {
    marginTop: spacing.xl,
  },
  pie: {
    marginTop: spacing.xxl,
  },
});
