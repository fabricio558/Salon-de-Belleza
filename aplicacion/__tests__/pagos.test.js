import api from '../utils/api';
import * as WebBrowser from 'expo-web-browser';
import {
  pagarCita,
  pagarPedido,
  elegirPagoLocal,
  agruparPagoLocal,
  describirEstadoPago,
  formatearMonto,
} from '../utils/pagos';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  accion: (nombre) => `/index.php?action=${nombre}`,
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'exp://192.168.0.10:8081/--/pago'),
}));

const estado = (datos) => ({ data: { success: true, data: datos } });

describe('pagarCita', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({
      data: { success: true, data: { idPagoMp: 7, initPoint: 'https://mp/checkout', monto: 1500 } },
    });
  });

  it('crea la preferencia con la URL de retorno y abre el checkout', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    api.get.mockResolvedValue(estado({ pagada: false, ultimoPagoMp: { estado: 'creada' } }));

    await pagarCita(12);

    expect(api.post).toHaveBeenCalledWith('/index.php?action=crear_preferencia_cita', {
      idCitas: 12,
      urlRetorno: 'exp://192.168.0.10:8081/--/pago',
    });
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://mp/checkout',
      'exp://192.168.0.10:8081/--/pago'
    );
  });

  it('si el usuario cierra el navegador consulta el estado una sola vez', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    api.get.mockResolvedValue(estado({ pagada: false, ultimoPagoMp: { estado: 'creada' } }));

    const resultado = await pagarCita(12, { intervaloMs: 0 });

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/index.php?action=get_estado_pago_cita&idCitas=12');
    expect(resultado.pagada).toBe(false);
  });

  it('si volvió a la app reconsulta hasta que el webhook confirma el pago', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'success' });
    api.get
      .mockResolvedValueOnce(estado({ pagada: false, ultimoPagoMp: { estado: 'creada' } }))
      .mockResolvedValueOnce(estado({ pagada: false, ultimoPagoMp: { estado: 'pending' } }))
      .mockResolvedValueOnce(estado({ pagada: true, ultimoPagoMp: { estado: 'approved' } }));

    const resultado = await pagarCita(12, { intervaloMs: 0 });

    expect(api.get).toHaveBeenCalledTimes(3);
    expect(resultado.pagada).toBe(true);
  });

  it('no abre el checkout si el servidor rechaza la preferencia', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'La cita ya está pagada.' } });

    await expect(pagarCita(12)).rejects.toThrow('La cita ya está pagada.');
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });
});

describe('describirEstadoPago', () => {
  it('distingue pagada, en proceso, rechazada y sin pago', () => {
    expect(describirEstadoPago({ pagada: true }).tipo).toBe('ok');
    expect(describirEstadoPago({ pagada: false, ultimoPagoMp: { estado: 'in_process' } }).tipo).toBe('pendiente');
    expect(describirEstadoPago({ pagada: false, ultimoPagoMp: { estado: 'rejected' } }).tipo).toBe('error');
    expect(describirEstadoPago({ pagada: false, ultimoPagoMp: null }).tipo).toBe('info');
  });
});

describe('formatearMonto', () => {
  it('formatea en pesos', () => {
    expect(formatearMonto(0)).toBe('$0');
    expect(formatearMonto(1500)).toMatch(/^\$1.?500$/);
  });
});

describe('pagarPedido', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({
      data: { success: true, data: { idPagoMp: 8, initPoint: 'https://mp/pedido', monto: 2500 } },
    });
  });

  it('usa los endpoints de pedidos', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    api.get.mockResolvedValue(estado({ pagada: false, ultimoPagoMp: { estado: 'creada' } }));

    await pagarPedido(20);

    expect(api.post).toHaveBeenCalledWith('/index.php?action=crear_preferencia_pedido', {
      idPedido: 20,
      urlRetorno: 'exp://192.168.0.10:8081/--/pago',
    });
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://mp/pedido',
      'exp://192.168.0.10:8081/--/pago'
    );
    expect(api.get).toHaveBeenCalledWith('/index.php?action=get_estado_pago_pedido&idPedido=20');
  });
});

describe('elegirPagoLocal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('manda tipo, id y medio, y devuelve el mensaje del servidor', async () => {
    api.post.mockResolvedValue({
      data: { success: true, message: 'Listo', data: { idMedios_pago: 1, medioPago: 'Efectivo' } },
    });

    const respuesta = await elegirPagoLocal('pedido', 20, 1);

    expect(api.post).toHaveBeenCalledWith('/index.php?action=elegir_pago_local', {
      tipo: 'pedido',
      id: 20,
      idMedios_pago: 1,
    });
    expect(respuesta.message).toBe('Listo');
  });

  it('lanza el mensaje si el servidor lo rechaza', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'La cita está cancelada.' } });

    await expect(elegirPagoLocal('cita', 11, 1)).rejects.toThrow('La cita está cancelada.');
  });
});

describe('agruparPagoLocal', () => {
  const pendientes = {
    mediosLocal: [
      { idMedios_pago: 1, medioPago: 'Efectivo' },
      { idMedios_pago: 2, medioPago: 'Transferencia' },
    ],
    citas: [
      { idCitas: 10, saldo: 3000, medioPagoLocal: 'Transferencia' },
      { idCitas: 13, saldo: 1000, medioPagoLocal: null },
    ],
    pedidos: [
      { idPedido: 20, saldo: 2500, medioPagoLocal: 'Efectivo' },
      { idPedido: 23, saldo: 500, medioPagoLocal: 'Efectivo' },
    ],
  };

  it('agrupa por medio, en el orden de mediosLocal, y deja afuera lo que no eligió pagar en el local', () => {
    const grupos = agruparPagoLocal(pendientes);

    expect(grupos.map((g) => g.medioPago)).toEqual(['Efectivo', 'Transferencia']);
    expect(grupos[0].total).toBe(3000);
    expect(grupos[0].items.map((i) => `${i.tipo}-${i.id}`)).toEqual(['pedido-20', 'pedido-23']);
    expect(grupos[1].items.map((i) => `${i.tipo}-${i.id}`)).toEqual(['cita-10']);
  });

  it('devuelve una lista vacía sin datos', () => {
    expect(agruparPagoLocal(null)).toEqual([]);
    expect(agruparPagoLocal({ mediosLocal: [], citas: [], pedidos: [] })).toEqual([]);
  });
});
