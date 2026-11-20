import { buscarServicios } from '../utils/servicios';

const servicios = [
  { idServicios: 1, servicio: 'Manicura' },
  { idServicios: 2, servicio: 'Corte de dama' },
  { idServicios: 3, servicio: 'Coloración' },
  { idServicios: 4, servicio: 'Corte de caballero' },
  { idServicios: 5, servicio: 'Alisado con corte' },
];

const nombres = (lista) => lista.map((s) => s.servicio);

describe('buscarServicios', () => {
  it('sin texto no devuelve nada', () => {
    expect(buscarServicios(servicios, '   ')).toEqual([]);
  });

  it('ignora tildes y mayúsculas', () => {
    expect(nombres(buscarServicios(servicios, 'COLORACION'))).toEqual(['Coloración']);
  });

  it('pone primero los que empiezan con lo buscado', () => {
    expect(nombres(buscarServicios(servicios, 'corte'))).toEqual([
      'Corte de caballero',
      'Corte de dama',
      'Alisado con corte',
    ]);
  });

  it('con varias palabras exige todas', () => {
    expect(nombres(buscarServicios(servicios, 'corte dama'))).toEqual(['Corte de dama']);
  });

  it('respeta el máximo', () => {
    expect(buscarServicios(servicios, 'corte', 2)).toHaveLength(2);
  });
});
