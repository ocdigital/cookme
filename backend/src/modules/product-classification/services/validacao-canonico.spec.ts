import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ProductClassificationService } from './product-classification.service';
import { ProductKnowledgeBase } from '../entities/product-knowledge-base.entity';
import { ProductValidation } from '../entities/product-validation.entity';
import { AIClassificationLog } from '../entities/ai-classification-log.entity';
import { NotificacaoTriggersService } from '../../notificacoes/services/notificacao-triggers.service';
import { FoodCategory } from '../entities/product-knowledge-base.entity';

/**
 * Loop de correção do usuário: validação manual grava de volta na KB
 * (canonical_ingredient e EAN) — cada correção vira acerto permanente
 * para todos os usuários.
 */
describe('ProductClassificationService — correção do usuário fecha o loop', () => {
  let service: ProductClassificationService;
  let kbRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let validationRepo: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    kbRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto: any) => ({
        total_validacoes: 0,
        validacoes_alimento: 0,
        validacoes_nao_alimento: 0,
        ...dto,
      })),
      save: jest.fn().mockImplementation((x: any) => Promise.resolve(x)),
    };
    validationRepo = {
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn().mockImplementation((x: any) => Promise.resolve(x)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductClassificationService,
        { provide: getRepositoryToken(ProductKnowledgeBase), useValue: kbRepo },
        { provide: getRepositoryToken(ProductValidation), useValue: validationRepo },
        { provide: getRepositoryToken(AIClassificationLog), useValue: { save: jest.fn(), create: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('') } },
        { provide: NotificacaoTriggersService, useValue: { notificar: jest.fn() } },
      ],
    }).compile();

    service = module.get(ProductClassificationService);
  });

  it('correção de nome canônico sobrescreve a KB (usuário é a verdade)', async () => {
    kbRepo.findOne.mockResolvedValue({
      id: 'kb1',
      product_name: 'CR LEITE ITALAC 200GR',
      normalized_name: 'cr leite italac 200gr',
      canonical_ingredient: 'leite', // errado — usuário corrige
      categoria: FoodCategory.ALIMENTO,
      total_validacoes: 1,
      validacoes_alimento: 1,
      validacoes_nao_alimento: 0,
    });

    await service.registrarValidacaoUsuario(
      'CR LEITE ITALAC 200GR',
      'user-1',
      FoodCategory.ALIMENTO,
      undefined,
      'creme de leite',
      '7891234567890',
    );

    const salvo = kbRepo.save.mock.calls[0][0];
    expect(salvo.canonical_ingredient).toBe('creme de leite');
    expect(salvo.codigo_barras).toBe('7891234567890');
  });

  it('validação sem correção de canônico não mexe no canônico existente', async () => {
    kbRepo.findOne.mockResolvedValue({
      id: 'kb1',
      product_name: 'Arroz Camil 1Kg',
      normalized_name: 'arroz camil 1kg',
      canonical_ingredient: 'arroz',
      categoria: FoodCategory.ALIMENTO,
      total_validacoes: 2,
      validacoes_alimento: 2,
      validacoes_nao_alimento: 0,
    });

    await service.registrarValidacaoUsuario('Arroz Camil 1Kg', 'user-1', FoodCategory.ALIMENTO);

    const salvo = kbRepo.save.mock.calls[0][0];
    expect(salvo.canonical_ingredient).toBe('arroz');
    expect(salvo.total_validacoes).toBe(3);
  });
});
