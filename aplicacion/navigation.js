import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import AgendaDiaria from "./screens/AgendaDiaria";
import AgendaSemanal from "./screens/AgendaSemanal";
import InicioSesion from "./screens/InicioSesion";
import FichaCliente from "./screens/FichaCliente";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MyDrawer() {
  return (
    <Drawer.Navigator
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
      <Drawer.Screen
          name="Agenda Diaria" 
          component={AgendaDiaria} 
          options={{tittle:'AgendaDiaria'}} 
      />

      <Drawer.Screen
          name="Agenda Semanal" 
          component={AgendaSemanal} 
          options={{tittle:'Agenda Semanal'}} 
      />

      <Drawer.Screen
          name="Login" 
          component={InicioSesion} 
          options={{tittle:'Login'}} 
      />
      
      <Drawer.Screen
          name="FichaCliente" 
          component={FichaCliente} 
          options={{tittle:'FichaCliente'}} 
      />
    </Drawer.Navigator>
  );
}

function MyStack() {
  return (
    <Stack.Navigator initialRouteName="InicioSesion" screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="PaginaPricipal" 
        component={AgendaDiaria} 
      />
      <Stack.Screen 
        name="InicioSesion" 
        component={InicioSesion} 
      />
      
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainDrawer" component={MyDrawer}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}