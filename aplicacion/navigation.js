import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { 
  createDrawerNavigator, 
  DrawerContentScrollView, 
  DrawerItemList, 
  DrawerItem 
} from "@react-navigation/drawer";
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeEstilista from "./screens/HomeEstilista";
import AgendaSemanal from "./screens/AgendaSemanal";
import InicioSesion from "./screens/InicioSesion";
import BienvenidaCliente from "./screens/BienvenidaCliente";
import HomeCliente from "./screens/HomeCliente"; 
import FichaCliente from "./screens/FichaCliente";
import CrearCita from "./screens/CrearCita";
import GestionPerfil from "./screens/GestionPerfil";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function PantallaCarga({ navigation }) {
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session !== null) {
          navigation.replace('MainDrawer');
        } else {
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

function CustomDrawerContent(props) {
  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Bienvenida' }],
      });
    } catch (error) {
      console.log("Error al cerrar sesión", error);
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem 
        label="Cerrar Sesión" 
        onPress={cerrarSesion}
        labelStyle={{ color: '#d9534f', fontWeight: 'bold' }} 
      />
    </DrawerContentScrollView>
  );
}

function MyDrawer() {
  const [rol, setRol] = useState(null);
  const [cargandoRol, setCargandoRol] = useState(true);

  useEffect(() => {
    const obtenerRol = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session) {
          const userData = JSON.parse(session);
          setRol(userData.idRol);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#FFFFFF', 
          width: 240,
        },
        drawerActiveTintColor: '#000000',
        drawerInactiveTintColor: '#666666',
      }}
    >
      {rol === 2 && (
        <>
          <Drawer.Screen name="Inicio" component={HomeEstilista} />
          <Drawer.Screen name="Agenda Semanal" component={AgendaSemanal} />
          <Drawer.Screen name="FichaCliente" component={FichaCliente} options={{ title: 'Ficha Cliente' }} />
        </>
      )}

      {rol === 1 && (
        <>
          <Drawer.Screen name="Inicio" component={HomeCliente} />
          <Drawer.Screen name="Reservar Cita" component={CrearCita} />
          <Drawer.Screen name="Mi Perfil" component={GestionPerfil} />
        </>
      )}
    </Drawer.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Cargando" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Cargando" component={PantallaCarga} />
        <Stack.Screen name="Bienvenida" component={BienvenidaCliente} />
        <Stack.Screen name="Login" component={InicioSesion} />
        <Stack.Screen name="MainDrawer" component={MyDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}