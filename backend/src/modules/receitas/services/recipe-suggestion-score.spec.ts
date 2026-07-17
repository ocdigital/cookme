import { maiorScore } from './recipe-suggestion.service';

describe('maiorScore — casamento de preferências por chave canônica', () => {
  it('retorna 0 quando não há preferências', () => {
    expect(maiorScore(['frango', 'arroz'], new Map())).toBe(0);
  });

  it('retorna 0 quando nenhuma chave casa', () => {
    const prefs = new Map([['peixe', 0.8]]);
    expect(maiorScore(['frango', 'arroz'], prefs)).toBe(0);
  });

  it('retorna o score do favorito quando a chave casa exatamente', () => {
    const prefs = new Map([['frango', 0.7]]);
    expect(maiorScore(['frango', 'arroz'], prefs)).toBe(0.7);
  });

  it('casa por inclusão mútua (chave contém o valor)', () => {
    const prefs = new Map([['frango', 0.5]]);
    // receita usa "coxas de frango" → contém "frango"
    expect(maiorScore(['coxas de frango'], prefs)).toBe(0.5);
  });

  it('retorna o MAIOR score quando várias preferências casam', () => {
    const prefs = new Map([['frango', 0.4], ['tomate', 0.9]]);
    expect(maiorScore(['frango', 'tomate', 'sal'], prefs)).toBe(0.9);
  });
});
