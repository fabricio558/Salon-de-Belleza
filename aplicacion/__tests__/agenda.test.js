import {
  parametroServicios,
  partesDia,
  rangoDias,
  formatearDuracion,
  estadoDia,
  primerDiaConLugar,
  paginaSiguiente,
  paginaAnterior,
} from '../utils/agenda';

describe('agenda', () => {
  it('arma el parámetro de servicios', () => {
    expect(parametroServicios([{ idServicios: 3, cantidad: 2 }, { idServicios: 5 }])).toBe('3:2,5:1');
    expect(parametroServicios([])).toBe('');
  });

  it('separa el día para el selector', () => {
    expect(partesDia('2026-11-20', 5)).toEqual({ dia: 'VIE', numero: 20, mes: 'nov' });
  });

  it('muestra el rango de la semana', () => {
    expect(rangoDias([{ fecha: '2026-11-20', diaSemana: 5 }, { fecha: '2026-11-26', diaSemana: 4 }])).toBe('20 – 26 nov');
    expect(rangoDias([{ fecha: '2026-11-28', diaSemana: 6 }, { fecha: '2026-12-04', diaSemana: 5 }])).toBe(
      '28 nov – 4 dic',
    );
  });

  it('formatea la duración', () => {
    expect(formatearDuracion(45)).toBe('45 min');
    expect(formatearDuracion(120)).toBe('2 h');
    expect(formatearDuracion(90)).toBe('1 h 30 min');
  });

  it('describe el estado del día', () => {
    expect(estadoDia({ abierto: false, horarios: [], libres: 0 })).toBe('Cerrado');
    expect(estadoDia({ abierto: true, horarios: [], libres: 0 })).toBe('Sin horarios');
    expect(estadoDia({ abierto: true, horarios: [{}], libres: 0 })).toBe('Completo');
    expect(estadoDia({ abierto: true, horarios: [{}], libres: 4 })).toBe('4 libres');
  });

  it('abre en el primer día con lugar', () => {
    const dias = [
      { fecha: '2026-11-19', libres: 0 },
      { fecha: '2026-11-20', libres: 3 },
    ];
    expect(primerDiaConLugar(dias)).toBe('2026-11-20');
    expect(primerDiaConLugar([{ fecha: '2026-11-22', libres: 0 }])).toBe('2026-11-22');
    expect(primerDiaConLugar([])).toBeNull();
  });

  it('pagina de a 7 días sin volver antes de hoy', () => {
    expect(paginaSiguiente('2026-11-19')).toBe('2026-11-26');
    expect(paginaAnterior('2026-11-26', '2026-11-19')).toBe('2026-11-19');
    expect(paginaAnterior('2026-11-22', '2026-11-19')).toBe('2026-11-19');
  });
});
