import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReceitaBancoService } from './receita-banco.service';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { ReceitaClassificacaoService } from './receita-classificacao.service';

/**
 * calcularCoberturaReceita é a fonte única de cobertura, usada pela listagem e
 * pelo DETALHE. Antes, o detalhe dependia da receita estar na lista de
 * /disponiveis; quando ela era cortada (protagonista faltando), o detalhe caía
 * em cobertura 0 / faltando [] — mostrando todos os ingredientes com ✓ mas com
 * badge 0% e botão "Fiz essa" travado (bug do "Arroz com Abobrinha").
 */
describe('ReceitaBancoService.calcularCoberturaReceita', () => {
  let service: ReceitaBancoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitaBancoService,
        { provide: getRepositoryToken(Receita), useValue: {} },
        { provide: getRepositoryToken(ReceitaIngrediente), useValue: {} },
        { provide: getRepositoryToken(Produto), useValue: {} },
        { provide: IngredientNormalizerService, useValue: { extrairChaves: (x: string[]) => x } },
        { provide: ReceitaClassificacaoService, useValue: {} },
      ],
    }).compile();
    service = module.get<ReceitaBancoService>(ReceitaBancoService);
  });

  const arrozAbobrinha = {
    nome: 'Arroz com Abobrinha',
    ingredientes_chave: ['abobrinha', 'alho', 'arroz', 'cebola'],
    ingredientes: [],
  } as any;

  it('todos os ingredientes presentes → cobertura 100%, disponível, nada faltando', () => {
    const r = service.calcularCoberturaReceita(arrozAbobrinha, ['abobrinha', 'alho', 'arroz', 'cebola']);
    expect(r.disponivel).toBe(true);
    expect(r.faltando).toEqual([]);
    expect(r.cobertura).toBe(1);
  });

  it('protagonista faltando (sem arroz) → NÃO disponível, arroz em faltando, cobertura < 1', () => {
    // exatamente o cenário do bug: usuário tem abobrinha/alho/cebola mas não arroz
    const r = service.calcularCoberturaReceita(arrozAbobrinha, ['abobrinha', 'alho', 'cebola']);
    expect(r.disponivel).toBe(false);
    expect(r.faltando).toContain('arroz');
    expect(r.cobertura).toBeLessThan(1);
  });

  it('inventário vazio → nada disponível, tudo faltando', () => {
    const r = service.calcularCoberturaReceita(arrozAbobrinha, []);
    expect(r.disponivel).toBe(false);
    expect(r.faltando.length).toBeGreaterThan(0);
    expect(r.cobertura).toBe(0);
  });

  it('receita sem chaves → resultado neutro (cobertura 0, não disponível)', () => {
    const r = service.calcularCoberturaReceita({ nome: 'X', ingredientes_chave: [], ingredientes: [] } as any, ['arroz']);
    expect(r.cobertura).toBe(0);
    expect(r.disponivel).toBe(false);
  });
});
