import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AprendizadoService } from './aprendizado.service';
import { ReceitaBancoService } from './receita-banco.service';
import { PreferenciaAprendida, TipoPreferencia } from '../../usuarios/entities/preferencia-aprendida.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';

/**
 * Fonte de verdade: derivarPreferencias lê `receitas_executadas` avaliadas JOIN
 * `receitas`, usando `ingredientes_chave` (array canônico, 100% das receitas) —
 * NÃO mais receita_ingredientes/produtos.nome (sujo, 61% cobertura).
 *
 * O serviço recebe as linhas já achatadas (uma por ingrediente_chave × avaliação)
 * via DataSource.query. Mockamos esse retorno para testar a consolidação.
 */
describe('AprendizadoService.derivarPreferencias — fonte canônica e consolidação', () => {
  let service: AprendizadoService;
  let prefRepo: any;
  let dataSource: { query: jest.Mock };
  const USER = 'user-1';

  // guarda o que foi "salvo" para inspeção
  let salvos: PreferenciaAprendida[];

  beforeEach(async () => {
    salvos = [];
    prefRepo = {
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn((x: any) => x),
      save: jest.fn((x: any) => {
        const arr = Array.isArray(x) ? x : [x];
        salvos.push(...arr);
        return Promise.resolve(x);
      }),
      find: jest.fn().mockResolvedValue([]),
    };
    dataSource = { query: jest.fn() };
    const noop = { count: jest.fn().mockResolvedValue(0) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AprendizadoService,
        { provide: getRepositoryToken(PreferenciaAprendida), useValue: prefRepo },
        { provide: getRepositoryToken(ReceitaExecutada), useValue: noop },
        { provide: DataSource, useValue: dataSource },
        // reusa a normalização real do matching
        { provide: ReceitaBancoService, useValue: new (class {
          normalizar(t: string) {
            return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
          }
        })() },
      ],
    }).compile();

    service = module.get<AprendizadoService>(AprendizadoService);
  });

  function pref(tipo: TipoPreferencia) {
    return salvos.filter((s) => s.tipo === tipo).map((s) => s.valor);
  }

  it('ingrediente só em receitas nota alta → favorito (nunca aversão)', async () => {
    dataSource.query.mockResolvedValue([
      { avaliacao: 5, ingrediente_chave: 'frango', tags_dieta: 'fitness' },
      { avaliacao: 4, ingrediente_chave: 'frango', tags_dieta: 'fitness' },
    ]);

    await service.derivarPreferencias(USER);

    expect(pref(TipoPreferencia.INGREDIENTE_FAVORITO)).toContain('frango');
    expect(pref(TipoPreferencia.INGREDIENTE_AVERSAO)).not.toContain('frango');
  });

  it('ingrediente em nota alta E baixa → resolve pelo saldo, nunca nas duas listas', async () => {
    dataSource.query.mockResolvedValue([
      { avaliacao: 5, ingrediente_chave: 'jilo', tags_dieta: null },
      { avaliacao: 5, ingrediente_chave: 'jilo', tags_dieta: null },
      { avaliacao: 1, ingrediente_chave: 'jilo', tags_dieta: null },
    ]);

    await service.derivarPreferencias(USER);

    const fav = pref(TipoPreferencia.INGREDIENTE_FAVORITO);
    const ave = pref(TipoPreferencia.INGREDIENTE_AVERSAO);
    // saldo positivo (2 altas vs 1 baixa) → favorito; jamais nos dois
    expect(fav.includes('jilo') && ave.includes('jilo')).toBe(false);
    expect(fav).toContain('jilo');
  });

  it('auxiliares (sal, agua, oleo) nunca viram preferência', async () => {
    dataSource.query.mockResolvedValue([
      { avaliacao: 5, ingrediente_chave: 'sal', tags_dieta: null },
      { avaliacao: 5, ingrediente_chave: 'agua', tags_dieta: null },
      { avaliacao: 5, ingrediente_chave: 'oleo', tags_dieta: null },
      { avaliacao: 5, ingrediente_chave: 'frango', tags_dieta: null },
    ]);

    await service.derivarPreferencias(USER);

    const fav = pref(TipoPreferencia.INGREDIENTE_FAVORITO);
    expect(fav).toContain('frango');
    expect(fav).not.toContain('sal');
    expect(fav).not.toContain('agua');
    expect(fav).not.toContain('oleo');
  });

  it('limpa preferências derivadas antes de regravar (idempotente, sem contradição acumulada)', async () => {
    dataSource.query.mockResolvedValue([
      { avaliacao: 5, ingrediente_chave: 'tomate', tags_dieta: null },
    ]);

    await service.derivarPreferencias(USER);

    // apaga as 4 dimensões derivadas por avaliação (preserva RECEITA_URL_IGNORADA)
    expect(prefRepo.delete).toHaveBeenCalledWith({ usuario_id: USER, tipo: TipoPreferencia.INGREDIENTE_FAVORITO });
    expect(prefRepo.delete).toHaveBeenCalledWith({ usuario_id: USER, tipo: TipoPreferencia.INGREDIENTE_AVERSAO });
    expect(prefRepo.delete).toHaveBeenCalledWith({ usuario_id: USER, tipo: TipoPreferencia.CATEGORIA_FAVORITA });
    expect(prefRepo.delete).toHaveBeenCalledWith({ usuario_id: USER, tipo: TipoPreferencia.CATEGORIA_AVERSAO });
  });

  it('score reflete intensidade (mais reforço → score maior, capped em 1)', async () => {
    // tomate e abobrinha NÃO são auxiliares (cebola/alho seriam filtrados)
    dataSource.query.mockResolvedValue([
      { avaliacao: 5, ingrediente_chave: 'tomate', tags_dieta: null },
      { avaliacao: 5, ingrediente_chave: 'tomate', tags_dieta: null },
      { avaliacao: 5, ingrediente_chave: 'tomate', tags_dieta: null },
      { avaliacao: 4, ingrediente_chave: 'abobrinha', tags_dieta: null },
    ]);

    await service.derivarPreferencias(USER);

    const tomate = salvos.find((s) => s.valor === 'tomate' && s.tipo === TipoPreferencia.INGREDIENTE_FAVORITO);
    const abobrinha = salvos.find((s) => s.valor === 'abobrinha' && s.tipo === TipoPreferencia.INGREDIENTE_FAVORITO);
    expect(tomate!.score).toBeGreaterThan(abobrinha!.score);
    expect(tomate!.score).toBeLessThanOrEqual(1);
  });

  it('categoria consolidada nunca aparece como favorita E aversão', async () => {
    dataSource.query.mockResolvedValue([
      { avaliacao: 5, ingrediente_chave: 'frango', tags_dieta: 'fitness' },
      { avaliacao: 5, ingrediente_chave: 'arroz', tags_dieta: 'fitness' },
      { avaliacao: 1, ingrediente_chave: 'bolo', tags_dieta: 'fitness' },
    ]);

    await service.derivarPreferencias(USER);

    const favCat = pref(TipoPreferencia.CATEGORIA_FAVORITA);
    const aveCat = pref(TipoPreferencia.CATEGORIA_AVERSAO);
    expect(favCat.includes('fitness') && aveCat.includes('fitness')).toBe(false);
  });
});
