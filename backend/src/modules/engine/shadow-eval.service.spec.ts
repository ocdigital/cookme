import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShadowEvalService } from './shadow-eval.service';
import { ShadowEvalAmostra } from './shadow-eval-amostra.entity';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';

/**
 * Shadow eval (PLANO_PRECISAO_ENGINE.md §11 A8): o golden é enviesado (curado
 * a partir dos erros que já vimos). Este serviço amostra ALEATORIAMENTE da KB
 * — sem filtrar por confiança — para dar um número honesto de acurácia, que é
 * o que vai no contrato B2B. Diferente da fila de curadoria (que só pega itens
 * de confiança BAIXA de propósito).
 */
describe('ShadowEvalService', () => {
  let service: ShadowEvalService;
  let amostraRepo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; create: jest.Mock; update: jest.Mock };
  let kbRepo: { query: jest.Mock };

  beforeEach(async () => {
    amostraRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((x) => Promise.resolve({ id: 'nova', ...x })),
      create: jest.fn((x) => x),
      update: jest.fn().mockResolvedValue({}),
    };
    kbRepo = { query: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShadowEvalService,
        { provide: getRepositoryToken(ShadowEvalAmostra), useValue: amostraRepo },
        { provide: getRepositoryToken(ProductKnowledgeBase), useValue: kbRepo },
      ],
    }).compile();

    service = module.get(ShadowEvalService);
  });

  describe('amostrar — sorteio aleatório, sem filtro de confiança', () => {
    it('usa ORDER BY random() no SQL — não filtra por estágio ou confiança', async () => {
      await service.amostrar(30);
      const [sql] = kbRepo.query.mock.calls[0];
      expect(sql).toMatch(/random\(\)/i);
      expect(sql).not.toMatch(/origem_estagio\s*=/i);
      expect(sql).not.toMatch(/confidence_score\s*>/i);
    });

    it('grava cada linha sorteada como amostra do lote da semana corrente', async () => {
      kbRepo.query.mockResolvedValue([
        { product_name: 'QUEIJO PROVOLONE QUATA FAT', canonical_ingredient: 'queijo provolone', origem_estagio: 'regex' },
      ]);
      const resultado = await service.amostrar(30);
      expect(amostraRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao_original: 'QUEIJO PROVOLONE QUATA FAT',
          produto_canonizado: 'queijo provolone',
          origem_estagio: 'regex',
        }),
      );
      expect(resultado.amostradas).toBe(1);
      expect(resultado.lote_semana).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('rotular — humano marca a resposta certa às cegas', () => {
    it('marca acertou=true quando o rótulo bate com o que a Engine respondeu', async () => {
      amostraRepo.findOne.mockResolvedValue({
        id: 'a1', produto_canonizado: 'queijo provolone', rotulo_correto: null, acertou: null,
      });
      await service.rotular('a1', 'queijo provolone');
      expect(amostraRepo.update).toHaveBeenCalledWith('a1', {
        rotulo_correto: 'queijo provolone',
        acertou: true,
      });
    });

    it('marca acertou=false quando o rótulo humano diverge da Engine', async () => {
      amostraRepo.findOne.mockResolvedValue({
        id: 'a1', produto_canonizado: 'queijo', rotulo_correto: null, acertou: null,
      });
      await service.rotular('a1', 'queijo provolone');
      expect(amostraRepo.update).toHaveBeenCalledWith('a1', {
        rotulo_correto: 'queijo provolone',
        acertou: false,
      });
    });
  });

  describe('acuracia — só considera itens já rotulados', () => {
    it('calcula % de acerto sobre os rotulados, ignora pendentes', async () => {
      amostraRepo.find.mockResolvedValue([
        { acertou: true }, { acertou: true }, { acertou: false }, { acertou: null },
      ]);
      const resultado = await service.acuracia('2026-W28');
      expect(resultado.lote_semana).toBe('2026-W28');
      expect(resultado.rotulados).toBe(3);
      expect(resultado.pendentes).toBe(1);
      expect(resultado.acertos).toBe(2);
      expect(resultado.acuracia_pct).toBeCloseTo(66.7, 1);
    });

    it('sem rótulos ainda, retorna acurácia null (não 0 — não inventa número)', async () => {
      amostraRepo.find.mockResolvedValue([{ acertou: null }, { acertou: null }]);
      const resultado = await service.acuracia('2026-W28');
      expect(resultado.acuracia_pct).toBeNull();
      expect(resultado.rotulados).toBe(0);
    });
  });
});
