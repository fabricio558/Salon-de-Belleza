import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { 
  createDrawerNavigator, 
  DrawerContentScrollView, 
  DrawerItemList, 
  DrawerItem 
} from "@react-navigation/drawer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from './theme';

import HomeEstilista from "./screens/HomeEstilista";
import AgendaSemanal from "./screens/AgendaSemanal";
import InicioSesion from "./screens/InicioSesion";
import BienvenidaCliente from "./screens/BienvenidaCliente";
import HomeCliente from "./screens/HomeCliente"; 
import FichaCliente from "./screens/FichaCliente";
import CrearCita from "./screens/CrearCita";
import MiPerfil from "./screens/MiPerfil";
import HomeRecepcionista from './screens/HomeRecepcionista';
import AgendaRecepcion from './screens/AgendaRecepcion';
import GestionUsuarios from './screens/GestionUsuarios';
import Registro from './screens/Registro';
import MisCitas from './screens/MisCitas';
import Productos from './screens/Productos';
import Carrito from './screens/Carrito';
import MisPedidos from './screens/MisPedidos';
import PedidosRecepcion from './screens/PedidosRecepcion';
import { CarritoProvider } from './context/CarritoContext';
import { CLAVE_SESION, leerSesion, registrarAlExpirarSesion } from './utils/api';
import { cerrarSesion } from './utils/sesion';

const ROL_CLIENTE = 1;

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const navigationRef = createNavigationContainerRef();

// Si el servidor rechaza el token (vencido o revocado), utils/api.js borra la sesión y llama acá.
let avisandoSesionExpirada = false;
registrarAlExpirarSesion(() => {
  if (!navigationRef.isReady() || avisandoSesionExpirada) {
    return;
  }
  avisandoSesionExpirada = true;
  navigationRef.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
  Alert.alert('Sesión expirada', 'Volvé a iniciar sesión.', [
    { text: 'OK', onPress: () => { avisandoSesionExpirada = false; } },
  ]);
});

function PantallaCarga({ navigation }) {
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const sesion = await leerSesion();
        if (sesion?.token) {
          navigation.replace('MainDrawer');
        } else {
          // Las sesiones guardadas antes de usar tokens no sirven: hay que volver a iniciar sesión.
          await AsyncStorage.removeItem(CLAVE_SESION);
          navigation.replace('Bienvenida');
        }
      } catch (error) {
        console.log("Error revisando sesión", error);
        navigation.replace('Bienvenida');
      }
    };

    verificarSesion();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function CustomDrawerContent(props) {
  const salir = () => cerrarSesion(props.navigation);

  // Drawer de marca: logo arriba con una línea fina, ítems en mayúsculas
  // espaciadas y "Cerrar sesión" separado al final, en el rojo desaturado del tema.
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={estilosDrawer.contenido}>
      <View style={estilosDrawer.marca}>
        <Text style={estilosDrawer.logo}>MANDALA</Text>
        <View style={estilosDrawer.filete} />
        <Text style={estilosDrawer.lema}>Salón de belleza</Text>
      </View>
      <DrawerItemList {...props} />
      <View style={estilosDrawer.separador} />
      <DrawerItem
        label="Cerrar Sesión"
        onPress={salir}
        labelStyle={[estilosDrawer.etiqueta, { color: colors.error }]}
        style={estilosDrawer.item}
        icon={({ size }) => <Ionicons name="log-out-outline" size={size} color={colors.error} />}
      />
    </DrawerContentScrollView>
  );
}

// Estilos del drawer (fuera de los componentes para no recrearlos en cada render).
const estilosDrawer = StyleSheet.create({
  contenido: {
    paddingTop: 0,
  },
  marca: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    ...typography.logo,
    color: colors.textPrimary,
  },
  // Filete dorado corto entre logo y lema: el único detalle de color de la marca.
  filete: {
    width: 28,
    height: 1,
    backgroundColor: colors.gold,
    marginTop: spacing.sm,
  },
  lema: {
    ...typography.label,
    color: colors.goldText,
    marginTop: spacing.sm,
  },
  // Ítems rectos, de 48 de alto (más que los 44 mínimos) y en mayúsculas.
  item: {
    borderRadius: radius.md,
    minHeight: 48,
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  },
  etiqueta: {
    ...typography.button,
    fontSize: 12,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    marginHorizontal: spacing.xl,
  },
});

function MyDrawer() {
  const [rol, setRol] = useState(null);
  const [idUsuario, setIdUsuario] = useState(null);
  const [cargandoRol, setCargandoRol] = useState(true);

  useEffect(() => {
    const obtenerRol = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session) {
          const userData = JSON.parse(session);
          setRol(userData.idRol);
          setIdUsuario(userData.idUsuarios);
        }
      } catch (error) {
        console.log("Error leyendo el rol en el Drawer", error);
      } finally {
        setCargandoRol(false);
      }
    };

    obtenerRol();
  }, []);

  if (cargandoRol) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <CarritoProvider idUsuario={idUsuario} habilitado={rol === ROL_CLIENTE}>
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 280,
        },
        // Ítem activo: negro sólido con texto champagne (9.5:1): el dorado marca "dónde estás".
        drawerActiveTintColor: colors.goldOnDark,
        drawerActiveBackgroundColor: colors.primary,
        drawerLabelStyle: estilosDrawer.etiqueta,
        drawerItemStyle: estilosDrawer.item,
        drawerInactiveTintColor: colors.textPrimary,
        overlayColor: colors.overlay,
      }}
    >
      {rol === 2 && (
        <>
          <Drawer.Screen name="Inicio" component={HomeEstilista} />
          <Drawer.Screen name="Agenda Semanal" component={AgendaSemanal} />
          <Drawer.Screen name="FichaCliente" component={FichaCliente} options={{ title: 'Ficha Cliente' }} />
          <Drawer.Screen name="Mi Perfil" component={MiPerfil} />
        </>
      )}

      {rol === 1 && (
        <>
          <Drawer.Screen name="Inicio" component={HomeCliente} />
          <Drawer.Screen name="Reservar Cita" component={CrearCita} />
          <Drawer.Screen name="Mis Citas" component={MisCitas} />
          <Drawer.Screen name="Productos" component={Productos} />
          <Drawer.Screen name="Mi Carrito" component={Carrito} />
          <Drawer.Screen name="Mis Pedidos" component={MisPedidos} />
          <Drawer.Screen name="Mi Perfil" component={MiPerfil} />
        </>
      )}

      {rol === 3 && (
        <>
          <Drawer.Screen name="Inicio" component={HomeRecepcionista} />
          <Drawer.Screen name="Agenda Semanal" component={AgendaRecepcion} />
          <Drawer.Screen name="Agendar Cita" component={CrearCita} />
          <Drawer.Screen name="Pedidos" component={PedidosRecepcion} />
          <Drawer.Screen name="Usuarios" component={GestionUsuarios} />
          <Drawer.Screen name="Mi Perfil" component={MiPerfil} />
        </>
      )}
    </Drawer.Navigator>
    </CarritoProvider>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Cargando" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Cargando" component={PantallaCarga} />
        <Stack.Screen name="Bienvenida" component={BienvenidaCliente} />
        <Stack.Screen name="Login" component={InicioSesion} />
        <Stack.Screen name="Registro" component={Registro} />
        <Stack.Screen name="MainDrawer" component={MyDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}