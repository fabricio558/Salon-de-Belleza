import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../direcIP/ip';

// Cliente HTTP de la app. Usalo en lugar de axios + BASE_URL:
//   api.get(accion('get_servicios'))
//   api.post(accion('crear_cita'), datos)
// - Agrega el token de sesión (header X-Session-Token) que devolvió el login.
// - Manda `ngrok-skip-browser-warning` para que el túnel de ngrok no devuelva su
//   página de advertencia en lugar del JSON.
// - Si el servidor responde 401 con `sesionInvalida`, borra la sesión y avisa
//   (navigation.js vuelve a la pantalla de bienvenida).

export const CLAVE_SESION = 'user_session';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'ngrok-skip-browser-warning': '1' },
});

export const accion = (nombre) => `/index.php?action=${nombre}`;

export const leerSesion = async () => {
  try {
    const sesion = await AsyncStorage.getItem(CLAVE_SESION);
    return sesion ? JSON.parse(sesion) : null;
  } catch (error) {
    return null;
  }
};

api.interceptors.request.use(async (config) => {
  const sesion = await leerSesion();
  if (sesion?.token) {
    config.headers['X-Session-Token'] = sesion.token;
  }
  return config;
});

let alExpirarSesion = null;

// navigation.js registra acá qué hacer cuando la sesión deja de ser válida.
export const registrarAlExpirarSesion = (callback) => {
  alExpirarSesion = callback;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.response.data?.sesionInvalida) {
      try {
        await AsyncStorage.removeItem(CLAVE_SESION);
      } catch (e) {
        // Sin AsyncStorage no hay sesión que borrar.
      }
      if (alExpirarSesion) {
        alExpirarSesion();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
