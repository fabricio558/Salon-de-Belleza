import React, { useEffect } from "react";
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

import AgendaDiaria from "./screens/AgendaDiaria";
import AgendaSemanal from "./screens/AgendaSemanal";
import InicioSesion from "./screens/InicioSesion";
import FichaCliente from "./screens/FichaCliente";

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
          navigation.replace('Login');
        }
      } catch (error) {
        console.log("Error revisando sesión", error);
        navigation.replace('Login');
      }
    };

    verificarSesion();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e6d3c6' }}>
      <ActivityIndicator size="large" color="#B8838A" />
    </View>
  );
}

function CustomDrawerContent(props) {
  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
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
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#e6d3c6', 
          width: 240,
        },
        drawerActiveTintColor: '#B8838A',
        drawerInactiveTintColor: '#8D8B94',
      }}
    >
      <Drawer.Screen name="Agenda Diaria" component={AgendaDiaria} />
      <Drawer.Screen name="Agenda Semanal" component={AgendaSemanal} />
      <Drawer.Screen name="FichaCliente" component={FichaCliente} options={{ title: 'Ficha Cliente' }} />
    </Drawer.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Cargando" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Cargando" component={PantallaCarga} />
        <Stack.Screen name="Login" component={InicioSesion} />
        <Stack.Screen name="MainDrawer" component={MyDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}