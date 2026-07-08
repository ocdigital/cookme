import { separarReceitaLegado } from './receita-legado.util';

/**
 * Caso real (Fritura de Milho Verde, seed groq_seed 2026-07): a lista de
 * ingredientes ficou embutida no modo_preparo, causando duplicação e listas
 * divergentes na tela de detalhe.
 */
describe('separarReceitaLegado', () => {
  const modoLegadoReal =
    'INGREDIENTES:\n' +
    '• 1 xícara de milho verde em conserva\n' +
    '• 1 xícara de farinha de trigo\n' +
    '• 1/2 xícara de leite integral\n' +
    '• 1 ovo\n' +
    '• Óleo de soja para fritar\n' +
    '• Sal a gosto\n' +
    '\n' +
    'MODO DE PREPARO:\n' +
    'Passo 1. Misture o milho verde, farinha de trigo, leite integral e ovo em uma tigela. Passo 2. Aqueça o óleo de soja e frite.';

  it('extrai os 6 ingredientes reais do bloco embutido', () => {
    const r = separarReceitaLegado(modoLegadoReal);
    expect(r.tinhaBlocoEmbutido).toBe(true);
    expect(r.ingredientesTexto).toEqual([
      '1 xícara de milho verde em conserva',
      '1 xícara de farinha de trigo',
      '1/2 xícara de leite integral',
      '1 ovo',
      'Óleo de soja para fritar',
      'Sal a gosto',
    ]);
  });

  it('remove o bloco INGREDIENTES: do modo de preparo (só passos ficam)', () => {
    const r = separarReceitaLegado(modoLegadoReal);
    expect(r.modoPreparoLimpo).toContain('Passo 1');
    expect(r.modoPreparoLimpo).not.toMatch(/INGREDIENTES/i);
    expect(r.modoPreparoLimpo).not.toContain('• 1 ovo');
  });

  it('receita SEM bloco embutido (fluxo atual) fica inalterada', () => {
    const modoNormal = 'Passo 1. Bata os ovos. Passo 2. Frite em óleo quente.';
    const r = separarReceitaLegado(modoNormal);
    expect(r.tinhaBlocoEmbutido).toBe(false);
    expect(r.ingredientesTexto).toEqual([]);
    expect(r.modoPreparoLimpo).toBe(modoNormal);
  });

  it('aceita marcadores variados (-, *, 1.) e cabeçalho sem acento/dois-pontos', () => {
    const modo = 'Ingredientes\n- arroz\n* feijão\n1. cebola\n\nmodo de preparo\nCozinhe tudo junto.';
    const r = separarReceitaLegado(modo);
    expect(r.ingredientesTexto).toEqual(['arroz', 'feijão', 'cebola']);
    expect(r.modoPreparoLimpo).toBe('Cozinhe tudo junto.');
  });

  it('bloco sem seção MODO DE PREPARO: extrai ingredientes, preparo vazio', () => {
    const r = separarReceitaLegado('INGREDIENTES:\n• leite\n• açúcar');
    expect(r.ingredientesTexto).toEqual(['leite', 'açúcar']);
    expect(r.modoPreparoLimpo).toBe('');
  });

  it('null/undefined não quebra', () => {
    expect(separarReceitaLegado(null).tinhaBlocoEmbutido).toBe(false);
    expect(separarReceitaLegado(undefined).ingredientesTexto).toEqual([]);
  });

  it('cabeçalho INGREDIENTES: sem itens não é tratado como bloco', () => {
    const r = separarReceitaLegado('INGREDIENTES:\n\nMODO DE PREPARO:\nFaça algo.');
    expect(r.tinhaBlocoEmbutido).toBe(false);
  });
});
