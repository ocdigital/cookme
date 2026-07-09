import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecanonizacaoService } from './recanonizacao.service';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';
import { OcrAliasService } from '../product-classification/services/ocr-alias.service';

/**
 * Re-canonização retroativa (PLANO_PRECISAO_ENGINE.md §11 A9): quando o
 * vocabulário evolui (ex: Camada 1 aprende "provolone"), itens já gravados
 * na KB com o palpite antigo ("queijo") ficam errados para sempre — e pior,
 * são servidos de volta como kb_exato (alta confiança). Este job reprocessa
 * a KB com o vocabulário atual e atualiza só o que mudou, nunca o que foi
 * corrigido manualmente (isso é sagrado — nunca se sobrepõe à correção humana).
 */
describe('RecanonizacaoService', () => {
  let service: RecanonizacaoService;
  let kbRepo: { find: jest.Mock; update: jest.Mock };
  let ocrAlias: { resolverComEstagio: jest.Mock };

  beforeEach(async () => {
    kbRepo = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    };
    ocrAlias = {
      resolverComEstagio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecanonizacaoService,
        { provide: getRepositoryToken(ProductKnowledgeBase), useValue: kbRepo },
        { provide: OcrAliasService, useValue: ocrAlias },
      ],
    }).compile();

    service = module.get(RecanonizacaoService);
  });

  describe('reprocessar — atualiza só o que o vocabulário atual resolve melhor', () => {
    it('nunca busca linhas com corrigido_manual=true (correção humana é sagrada)', async () => {
      await service.reprocessar(50);
      expect(kbRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ corrigido_manual: expect.anything() }),
        }),
      );
      const chamada = kbRepo.find.mock.calls[0][0];
      // TypeORM Not(true) — garante que não é um filtro que aceita true
      expect(JSON.stringify(chamada.where.corrigido_manual)).not.toBe('true');
    });

    it('atualiza quando o novo canonical difere do antigo (vocabulário evoluiu)', async () => {
      kbRepo.find.mockResolvedValue([
        {
          id: 'kb1',
          product_name: 'QUEIJO PROVOLONE QUATA FAT',
          canonical_ingredient: 'queijo',
          origem_estagio: 'regex',
          corrigido_manual: false,
        },
      ]);
      ocrAlias.resolverComEstagio.mockResolvedValue({
        canonical: 'queijo provolone',
        estagio: 'regex',
        nucleo: 'queijo',
        especificador: 'provolone',
      });

      const resultado = await service.reprocessar(50);

      expect(kbRepo.update).toHaveBeenCalledWith('kb1', expect.objectContaining({
        canonical_ingredient: 'queijo provolone',
        origem_estagio: 'regex',
      }));
      expect(resultado).toEqual({ processadas: 1, atualizadas: 1, erros: 0 });
    });

    it('NÃO atualiza quando o resultado novo é igual ao antigo', async () => {
      kbRepo.find.mockResolvedValue([
        {
          id: 'kb1',
          product_name: 'ARROZ BRANCO CAMIL',
          canonical_ingredient: 'arroz branco',
          origem_estagio: 'regex',
          corrigido_manual: false,
        },
      ]);
      ocrAlias.resolverComEstagio.mockResolvedValue({
        canonical: 'arroz branco',
        estagio: 'regex',
      });

      const resultado = await service.reprocessar(50);

      expect(kbRepo.update).not.toHaveBeenCalled();
      expect(resultado).toEqual({ processadas: 1, atualizadas: 0, erros: 0 });
    });

    it('NÃO piora: não sobrescreve um estágio forte com um resultado de estágio mais fraco', async () => {
      kbRepo.find.mockResolvedValue([
        {
          id: 'kb1',
          product_name: 'X ESPECIAL',
          canonical_ingredient: 'produto correto',
          origem_estagio: 'regex',
          corrigido_manual: false,
        },
      ]);
      // vocabulário atual, sem essa regra específica, cairia no fallback (mais fraco)
      ocrAlias.resolverComEstagio.mockResolvedValue({
        canonical: 'produto diferente',
        estagio: 'fallback',
      });

      const resultado = await service.reprocessar(50);

      expect(kbRepo.update).not.toHaveBeenCalled();
      expect(resultado).toEqual({ processadas: 1, atualizadas: 0, erros: 0 });
    });

    it('erro em uma linha não interrompe o lote — contabiliza e segue', async () => {
      kbRepo.find.mockResolvedValue([
        { id: 'kb1', product_name: 'A', canonical_ingredient: 'a', origem_estagio: 'regex', corrigido_manual: false },
        { id: 'kb2', product_name: 'B', canonical_ingredient: 'b', origem_estagio: 'regex', corrigido_manual: false },
      ]);
      ocrAlias.resolverComEstagio
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ canonical: 'b melhor', estagio: 'regex' });

      const resultado = await service.reprocessar(50);

      expect(resultado).toEqual({ processadas: 2, atualizadas: 1, erros: 1 });
    });
  });
});
