import {
  validarPrefixosUnicos,
  resolverNucleoEspecificador,
} from './especificadores';

/**
 * Checagem de qualidade do dicionário de especificadores (Camada 1.5).
 * Roda em CI: se alguém adicionar um especificador cujo prefixo de 4 chars
 * colide com outro do mesmo grupo, o truncamento do cupom (A4) fica ambíguo
 * e o teste falha — força escolher um prefixo maior ou desambiguar na hora
 * do cadastro, não em produção.
 */
describe('especificadores — qualidade do dicionário', () => {
  it('nenhum prefixo de 4 chars colide dentro do mesmo grupo', () => {
    const problemas = validarPrefixosUnicos();
    expect(problemas).toEqual([]);
  });

  it('resolverNucleoEspecificador retorna null quando não há núcleo cadastrado no texto', () => {
    expect(resolverNucleoEspecificador('arroz branco camil 5kg')).toBeNull();
  });

  it('composição preserva o especificador com acento correto', () => {
    const r = resolverNucleoEspecificador('queijo parmesao ralado quata');
    expect(r?.canonical).toBe('queijo parmesão ralado');
  });
});
