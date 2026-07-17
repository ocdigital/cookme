import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReceitaBancoService } from './receita-banco.service';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { ReceitaClassificacaoService } from './receita-classificacao.service';

/**
 * Fase 2 — o ranking de /disponiveis respeita o perfil aprendido: entre receitas
 * de mesma cobertura, a que contém um ingrediente favorito sobe; a com aversão desce.
 * Sem preferências, a ordem é idêntica à anterior (não regride).
 */
describe('ReceitaBancoService.listarDisponiveisParaUsuario — ranking por preferência', () => {
  let service: ReceitaBancoService;

  // Duas receitas com a MESMA cobertura (ambas 100% cobertas pelos ingredientes).
  const receitaFrango = {
    id: 'aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa',
    nome: 'Frango grelhado',
    ingredientes_chave: ['frango', 'tomate'],
    status_moderacao: 'ok',
    ingredientes: [],
  } as any;
  const receitaPeixe = {
    id: 'bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb',
    nome: 'Peixe grelhado',
    ingredientes_chave: ['peixe', 'tomate'],
    status_moderacao: 'ok',
    ingredientes: [],
  } as any;

  function makeQB(receitas: any[]) {
    const qb: any = {};
    for (const m of ['leftJoinAndSelect', 'where', 'andWhere', 'orderBy', 'addOrderBy', 'limit']) {
      qb[m] = jest.fn().mockReturnValue(qb);
    }
    qb.getMany = jest.fn().mockResolvedValue(receitas);
    return qb;
  }

  async function build(receitas: any[]) {
    // 1ª query = receitas públicas (retorna as receitas); 2ª = importadas do
    // usuário (autor_id) → vazio. Sem isso o mock duplica as receitas.
    let chamada = 0;
    const receitaRepo = {
      createQueryBuilder: jest.fn(() => makeQB(chamada++ === 0 ? receitas : [])),
    };
    const normalizer = { extrairChaves: (x: string[]) => x };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitaBancoService,
        { provide: getRepositoryToken(Receita), useValue: receitaRepo },
        { provide: getRepositoryToken(ReceitaIngrediente), useValue: {} },
        { provide: getRepositoryToken(Produto), useValue: {} },
        { provide: IngredientNormalizerService, useValue: normalizer },
        { provide: ReceitaClassificacaoService, useValue: {} },
      ],
    }).compile();
    return module.get<ReceitaBancoService>(ReceitaBancoService);
  }

  const inventario = ['frango', 'peixe', 'tomate'];

  it('sem preferências: ambas presentes, ordem estável (não regride)', async () => {
    service = await build([receitaFrango, receitaPeixe]);
    const r = await service.listarDisponiveisParaUsuario(inventario, 50);
    expect(r.map((x) => x.receita.id)).toHaveLength(2);
    // ambas disponíveis (cobertura cheia)
    expect(r.every((x) => x.disponivel)).toBe(true);
  });

  it('frango favorito → Frango grelhado rankeia acima do Peixe', async () => {
    service = await build([receitaPeixe, receitaFrango]); // ordem de entrada inversa
    const prefs = { favoritos: new Map([['frango', 0.8]]), aversoes: new Map<string, number>() };
    const r = await service.listarDisponiveisParaUsuario(inventario, 50, 'user', prefs);
    expect(r[0].receita.id).toBe(receitaFrango.id);
  });

  it('peixe aversão → Peixe grelhado rankeia abaixo do Frango', async () => {
    service = await build([receitaPeixe, receitaFrango]);
    const prefs = { favoritos: new Map<string, number>(), aversoes: new Map([['peixe', 0.9]]) };
    const r = await service.listarDisponiveisParaUsuario(inventario, 50, 'user', prefs);
    expect(r[0].receita.id).toBe(receitaFrango.id);
    expect(r[1].receita.id).toBe(receitaPeixe.id);
  });
});
