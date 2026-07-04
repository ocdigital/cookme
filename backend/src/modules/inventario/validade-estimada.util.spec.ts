import { estimarValidadeDias, estimarDataValidade } from './validade-estimada.util';

describe('validade-estimada.util', () => {
  it('carne resfriada estima 3 dias', () => {
    expect(estimarValidadeDias('Peito de Frango Sadia Kg')).toBe(3);
    expect(estimarValidadeDias('carne moída patinho')).toBe(3);
  });

  it('leite e laticínios frescos estimam 7 dias', () => {
    expect(estimarValidadeDias('Leite Italac Integral 1L')).toBe(7);
    expect(estimarValidadeDias('iogurte morango')).toBe(7);
  });

  it('congelados estimam 90 dias e vencem carne (congelado > resfriado)', () => {
    expect(estimarValidadeDias('frango congelado')).toBe(3); // ordem: carne casa primeiro
    expect(estimarValidadeDias('polpa de açaí congelada')).toBe(90);
  });

  it('grãos e enlatados estimam 365 dias', () => {
    expect(estimarValidadeDias('Arroz Camil 5Kg')).toBe(365);
    expect(estimarValidadeDias('atum em lata')).toBe(365);
  });

  it('sem regra → default conservador 30 dias', () => {
    expect(estimarValidadeDias('produto desconhecido xyz')).toBe(30);
  });

  it('validade_padrao_dias do produto tem precedência sobre a heurística', () => {
    expect(estimarValidadeDias('Arroz Camil 5Kg', 10)).toBe(10);
  });

  it('estimarDataValidade soma os dias à data da compra', () => {
    const compra = new Date('2026-07-01T12:00:00Z');
    const validade = estimarDataValidade('Leite Integral', compra);
    expect(validade.toISOString().slice(0, 10)).toBe('2026-07-08');
  });
});
