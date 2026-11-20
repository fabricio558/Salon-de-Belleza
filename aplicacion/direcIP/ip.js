// URL base de la API. Es el único lugar con IPs o dominios: no los hardcodees en otro lado.
//
// ENTORNO:
// - 'local': XAMPP en la red local (el celular o emulador tiene que estar en la misma red).
// - 'ngrok': túnel HTTPS (`ngrok start salon`). Hace falta para Mercado Pago, porque las
//   back_urls y el webhook necesitan una URL pública con HTTPS.
const ENTORNO = 'local';

const IP_LOCAL = '192.168.1.86';
// Dominio fijo que ngrok le asigna a la cuenta (dashboard → Domains). No es secreto.
const NGROK_URL = 'https://open-prude-curse.ngrok-free.dev';

const RUTA_API = '/salonBelleza/api_proyecto';

const BASES = {
  local: `http://${IP_LOCAL}${RUTA_API}`,
  ngrok: `${NGROK_URL}${RUTA_API}`,
};

const BASE_URL = BASES[ENTORNO];

export default BASE_URL;
