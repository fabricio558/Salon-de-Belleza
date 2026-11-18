import BASE_URL from '../direcIP/ip';

// Mensaje para mostrar al usuario según el tipo de error de axios.
export const mensajeDeError = (error) => {
  if (error.response) {
    return error.response.data?.message || `El servidor respondió con error (HTTP ${error.response.status})`;
  }
  if (error.request) {
    return `No se pudo conectar con ${BASE_URL}. Revisá que XAMPP esté encendido y que el dispositivo esté en la misma red (o que ngrok esté corriendo, si usás el túnel).`;
  }
  return error.message;
};

// Si PHP tira un error fatal devuelve HTML (status 200), no JSON.
export const esRespuestaValida = (data) => data !== null && typeof data === 'object';
