import { filtrarPedidos } from '../screens/PedidosRecepcion';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  accion: (nombre) => `/index.php?action=${nombre}`,
}));

const pedidos = [
  { idPedido: 11, cliente: 'Fabricio Lautaro Segovia', nombreUsuario: 'fabri_zx', correo: 'fabricio@mail.com' },
  { idPedido: 9, cliente: 'Juan Carlos', nombreUsuario: null, correo: 'jc@gmail.com' },
  { idPedido: 12, cliente: 'María Pérez', nombreUsuario: 'mperez', correo: 'mp@mail.com' },
];

const ids = (busqueda) => filtrarPedidos(pedidos, busqueda).map((p) => p.idPedido);

describe('filtrarPedidos', () => {
  it('sin búsqueda devuelve todos', () => {
    expect(ids('')).toEqual([11, 9, 12]);
    expect(ids('   ')).toEqual([11, 9, 12]);
  });

  it('encuentra por nombre aunque falte el segundo nombre o sobre un espacio', () => {
    expect(ids('Fabricio Segovia')).toEqual([11]);
    expect(ids('segovia ')).toEqual([11]);
    expect(ids('  FABRICIO  ')).toEqual([11]);
  });

  it('encuentra por nombre de usuario y correo', () => {
    expect(ids('fabri_zx')).toEqual([11]);
    expect(ids('jc@gmail')).toEqual([9]);
  });

  it('ignora tildes', () => {
    expect(ids('maria perez')).toEqual([12]);
  });

  it('encuentra por número de pedido, con o sin #', () => {
    expect(ids('#9')).toEqual([9]);
    expect(ids('12')).toEqual([12]);
  });

  it('no encuentra lo que no coincide', () => {
    expect(ids('rodriguez')).toEqual([]);
  });
});
