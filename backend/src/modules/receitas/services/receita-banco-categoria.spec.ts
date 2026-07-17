import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReceitaBancoService, CATEGORIAS_CULINARIAS } from './receita-banco.service';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { ReceitaClassificacaoService } from './receita-classificacao.service';

describe('ReceitaBancoService.classificarCategoria', () => {
  let service: ReceitaBancoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitaBancoService,
        { provide: getRepositoryToken(Receita), useValue: {} },
        { provide: getRepositoryToken(ReceitaIngrediente), useValue: {} },
        { provide: getRepositoryToken(Produto), useValue: {} },
        { provide: IngredientNormalizerService, useValue: {} },
        { provide: ReceitaClassificacaoService, useValue: {} },
      ],
    }).compile();
    service = module.get<ReceitaBancoService>(ReceitaBancoService);
  });

  const r = (nome: string, chaves: string[] = []) =>
    ({ nome, ingredientes_chave: chaves } as any);

  it('frango nos ingredientes → aves', () => {
    expect(service.classificarCategoria(r('Xis grelhado', ['frango', 'alho']))).toBe('aves');
  });

  it('picanha → carnes', () => {
    expect(service.classificarCategoria(r('Churrasco', ['picanha', 'sal']))).toBe('carnes');
  });

  it('camarão → peixes', () => {
    expect(service.classificarCategoria(r('Moqueca', ['camarao', 'leite de coco']))).toBe('peixes');
  });

  it('"Bolo de Cenoura" pelo nome → bolos-tortas', () => {
    expect(service.classificarCategoria(r('Bolo de Cenoura', ['cenoura', 'farinha']))).toBe('bolos-tortas');
  });

  it('macarrão → massas', () => {
    expect(service.classificarCategoria(r('Almoço', ['macarrao', 'molho de tomate']))).toBe('massas');
  });

  it('"Salada Tropical" pelo nome → saladas', () => {
    expect(service.classificarCategoria(r('Salada Tropical', ['alface', 'tomate']))).toBe('saladas');
  });

  it('proteína tem precedência sobre massa (frango à parmegiana com macarrão → aves)', () => {
    expect(service.classificarCategoria(r('Frango à parmegiana', ['frango', 'macarrao']))).toBe('aves');
  });

  it('sem match → null', () => {
    expect(service.classificarCategoria(r('Arroz branco', ['arroz', 'sal']))).toBeNull();
  });

  it('CATEGORIAS_CULINARIAS expõe id + label para o grid', () => {
    const aves = CATEGORIAS_CULINARIAS.find((c) => c.id === 'aves');
    expect(aves?.label).toBe('Aves');
  });
});
