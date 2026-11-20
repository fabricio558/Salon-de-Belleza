import { normalizarTexto } from './texto';

// Busca servicios por nombre, sin tildes ni mayúsculas. Con varias palabras tienen
// que estar todas ("corte dama" encuentra "Corte de dama"). Primero los que empiezan
// con lo buscado, después el resto, cada grupo en orden alfabético.
export const buscarServicios = (servicios = [], texto = '', maximo = Infinity) => {
  const palabras = normalizarTexto(texto.trim()).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) {
    return [];
  }
  const busqueda = palabras.join(' ');
  return servicios
    .map((s) => ({ servicio: s, nombre: normalizarTexto(s.servicio) }))
    .filter(({ nombre }) => palabras.every((p) => nombre.includes(p)))
    .sort((a, b) => {
      const empiezaA = a.nombre.startsWith(busqueda) ? 0 : 1;
      const empiezaB = b.nombre.startsWith(busqueda) ? 0 : 1;
      return empiezaA - empiezaB || a.nombre.localeCompare(b.nombre);
    })
    .slice(0, maximo)
    .map(({ servicio }) => servicio);
};
