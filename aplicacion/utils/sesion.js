import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { accion, CLAVE_SESION } from './api';

// Cierra la sesión: revoca el token en el servidor (si no hay conexión, igual se
// cierra la local), borra user_session y vuelve a Bienvenida. Sirve con la
// navigation de cualquier pantalla del drawer: el reset sube al stack principal.
export const cerrarSesion = async (navigation) => {
  try {
    await api.post(accion('logout')).catch((error) => console.log('Error en logout:', error.message));
    await AsyncStorage.removeItem(CLAVE_SESION);
    navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
  } catch (error) {
    console.log('Error al cerrar sesión', error);
  }
};
