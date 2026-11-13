// Sin tildes y en minúsculas, para que buscar "maria" encuentre "María".
// Si el motor JS no trae normalize() se busca igual, solo que distingue tildes.
export const normalizarTexto = (texto) => {
  const minusculas = (texto || '').toLowerCase();
  return typeof minusculas.normalize === 'function'
    ? minusculas.normalize('NFD').replace(/[̀-ͯ]/g, '')
    : minusculas;
};
