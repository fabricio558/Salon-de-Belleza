import {
  iniciales,
  formatearFechaInput,
  validarDatosPerfil,
  validarContrasenas,
  resumenCliente,
  resumenEstilista,
  resumenRecepcion,
  configPerfil,
  datosDesdeRespuesta,
} from '../utils/perfil';

describe('iniciales', () => {
  it('toma la primera letra de nombre y apellido', () => {
    expect(iniciales('fabricio', 'segovia')).toBe('FS');
  });
  it('nunca queda vacío', () => {
    expect(iniciales('', '')).toBe('·');
    expect(iniciales(null, undefined)).toBe('·');
  });
});

describe('formatearFechaInput', () => {
  it('agrega los guiones mientras se escribe', () => {
    expect(formatearFechaInput('2000')).toBe('2000');
    expect(formatearFechaInput('20001')).toBe('2000-1');
    expect(formatearFechaInput('20001231')).toBe('2000-12-31');
    expect(formatearFechaInput('2000-12-3199')).toBe('2000-12-31');
  });
});

describe('validarDatosPerfil', () => {
  const validos = { nombres: 'Ana', apellido: 'Paz', correo: 'ana@mail.com', fechaNacimiento: '' };
  it('acepta datos completos', () => {
    expect(validarDatosPerfil(validos)).toEqual({});
  });
  it('marca vacíos, correo y fecha inválidos', () => {
    const errores = validarDatosPerfil({ nombres: ' ', apellido: '', correo: 'ana', fechaNacimiento: '2000-1' });
    expect(Object.keys(errores).sort()).toEqual(['apellido', 'correo', 'fechaNacimiento', 'nombres']);
  });
});

describe('validarContrasenas', () => {
  it('pide 6 caracteres y que sea distinta', () => {
    expect(validarContrasenas('abc123', '123').nueva).toBeDefined();
    expect(validarContrasenas('abc123', 'abc123').nueva).toBeDefined();
    expect(validarContrasenas('', 'nueva123').actual).toBeDefined();
    expect(validarContrasenas('abc123', 'nueva123')).toEqual({});
  });
});

describe('resumenCliente', () => {
  it('destaca la próxima cita más cercana y cuenta pedidos y visitas', () => {
    const citas = [
      { idEstado: 1, proxima: 1, fechaHoraTs: 200, fecha: '2026-11-25', hora: '15:00', servicios: 'Corte', estilista: 'Lu' },
      { idEstado: 1, proxima: 1, fechaHoraTs: 100, fecha: '2026-11-20', hora: '10:30', servicios: 'Color', estilista: 'Mia' },
      { idEstado: 3, proxima: 0, fechaHoraTs: 50 },
    ];
    const pedidos = [{ estado: 'pendiente' }, { estado: 'entregado' }];
    const r = resumenCliente(citas, pedidos);
    expect(r.destacada.titulo).toBe('20 nov · 10:30 h');
    expect(r.destacada.detalle).toBe('Color · con Mia');
    expect(r.vacio).toBeNull();
    expect(r.metricas.find((m) => m.clave === 'pedidos').valor).toBe(1);
    expect(r.metricas.find((m) => m.clave === 'realizadas').valor).toBe(1);
  });
  it('sin citas próximas ofrece reservar', () => {
    const r = resumenCliente([], []);
    expect(r.destacada).toBeNull();
    expect(r.vacio.destino).toBe('Reservar Cita');
  });
});

describe('resumenEstilista', () => {
  it('prioriza la cita en curso y no cuenta canceladas', () => {
    const r = resumenEstilista([
      { idEstado: 3, hora: '09:00' },
      { idEstado: 2, hora: '10:00' },
      { idEstado: 1, hora: '12:00', nombres: 'Ana', apellido: 'Paz' },
      { idEstado: 4, hora: '11:00', nombres: 'Leo', apellido: 'Gil', servicios: 'Corte' },
    ]);
    expect(r.destacada.etiqueta).toBe('En curso');
    expect(r.destacada.detalle).toBe('Leo Gil · Corte');
    expect(r.metricas.find((m) => m.clave === 'hoy').valor).toBe(3);
    expect(r.metricas.find((m) => m.clave === 'finalizadas').valor).toBe(1);
  });
});

describe('resumenRecepcion', () => {
  it('cuenta citas sin pagar y pedidos pendientes', () => {
    const r = resumenRecepcion(
      [
        { idEstado: 1, total: 1000, pagada: false },
        { idEstado: 1, total: 1000, pagada: true },
        { idEstado: 2, total: 1000, pagada: false },
        { idEstado: 1, total: 0, pagada: false },
      ],
      [{}, {}],
    );
    expect(r.metricas.map((m) => m.valor)).toEqual([3, 1, 2]);
  });
});

describe('configPerfil', () => {
  it('usa la configuración del rol y solo el cliente tiene notas', () => {
    expect(configPerfil(1).tieneNotas).toBe(true);
    expect(configPerfil('2').nombreRol).toBe('Estilista');
    expect(configPerfil(3).tieneNotas).toBe(false);
  });
  it('arma los datos con strings vacíos en lugar de null', () => {
    const datos = datosDesdeRespuesta(configPerfil(2), { nombres: 'Ana', apellido: null, otro: 'x' });
    expect(datos).toEqual({ nombres: 'Ana', apellido: '', correo: '', fechaNacimiento: '' });
  });
});
