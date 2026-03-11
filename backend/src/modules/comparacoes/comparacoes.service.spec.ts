import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ComparacoesService } from './comparacoes.service';
import { Compra } from '@modules/compras/entities/compra.entity';
import { CompraItem } from '@modules/compras/entities/compra-item.entity';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

describe('ComparacoesService', () => {
  let service: ComparacoesService;
  let compraRepository: jest.Mocked<Repository<Compra>>;
  let compraItemRepository: jest.Mocked<Repository<CompraItem>>;
  let produtoRepository: jest.Mocked<Repository<Produto>>;

  const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
  const produtoId = '123e4567-e89b-12d3-a456-426614174001';

  const mockProduto = {
    id: produtoId,
    nome: 'Arroz Integral',
    unidade_padrao: UnidadeMedida.KG,
  } as unknown as Produto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComparacoesService,
        {
          provide: getRepositoryToken(Compra),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompraItem),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Produto),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ComparacoesService>(ComparacoesService);
    compraRepository = module.get(getRepositoryToken(Compra));
    compraItemRepository = module.get(getRepositoryToken(CompraItem));
    produtoRepository = module.get(getRepositoryToken(Produto));
  });

  describe('getHistoricoPrecosProduto', () => {
    it('deve retornar histórico vazio se produto não tem compras', async () => {
      // ARRANGE
      (produtoRepository.findOne as jest.Mock).mockResolvedValue(mockProduto);

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getHistoricoPrecosProduto(usuarioId, {
        produto_id: produtoId,
      });

      // ASSERT
      expect(resultado).toEqual({
        produto_id: produtoId,
        produto_nome: 'Arroz Integral',
        unidade_padrao: UnidadeMedida.KG,
        preco_medio: 0,
        preco_minimo: 0,
        preco_maximo: 0,
        total_compras: 0,
        historico: [],
      });
    });

    it('deve lançar NotFoundException se produto não existe', async () => {
      // ARRANGE
      (produtoRepository.findOne as jest.Mock).mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.getHistoricoPrecosProduto(usuarioId, {
          produto_id: 'id-inexistente',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve calcular estatísticas corretas (média, min, max)', async () => {
      // ARRANGE
      (produtoRepository.findOne as jest.Mock).mockResolvedValue(mockProduto);

      const mockCompras = [
        {
          item_preco_unitario: 5.0,
          item_quantidade: 1,
          item_unidade: UnidadeMedida.KG,
          compra_data_compra: new Date('2025-01-15'),
          compra_local_compra: 'Supermercado A',
          compra_id: 'compra-1',
        },
        {
          item_preco_unitario: 6.0,
          item_quantidade: 1,
          item_unidade: UnidadeMedida.KG,
          compra_data_compra: new Date('2025-01-20'),
          compra_local_compra: 'Supermercado B',
          compra_id: 'compra-2',
        },
        {
          item_preco_unitario: 4.0,
          item_quantidade: 1,
          item_unidade: UnidadeMedida.KG,
          compra_data_compra: new Date('2025-01-25'),
          compra_local_compra: 'Supermercado C',
          compra_id: 'compra-3',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockCompras),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getHistoricoPrecosProduto(usuarioId, {
        produto_id: produtoId,
      });

      // ASSERT
      expect(resultado.preco_medio).toBe(5.0); // (5 + 6 + 4) / 3
      expect(resultado.preco_minimo).toBe(4.0);
      expect(resultado.preco_maximo).toBe(6.0);
      expect(resultado.total_compras).toBe(3);
    });

    it('deve normalizar preços corretamente usando UnitConverter', async () => {
      // ARRANGE
      (produtoRepository.findOne as jest.Mock).mockResolvedValue(mockProduto);

      const mockCompras = [
        {
          item_preco_unitario: 5.0,
          item_quantidade: 500, // 500g
          item_unidade: UnidadeMedida.G, // em gramas
          compra_data_compra: new Date('2025-01-15'),
          compra_local_compra: 'Supermercado A',
          compra_id: 'compra-1',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockCompras),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getHistoricoPrecosProduto(usuarioId, {
        produto_id: produtoId,
      });

      // ASSERT
      // 500g = 0.5kg, então R$5 / 0.5 = R$10/kg
      expect(resultado.historico[0].preco_unitario_normalizado).toBe(10.0);
      expect(resultado.preco_medio).toBe(10.0);
    });

    it('deve filtrar por data_inicio e data_fim', async () => {
      // ARRANGE
      (produtoRepository.findOne as jest.Mock).mockResolvedValue(mockProduto);

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      const dataInicio = new Date('2025-01-01');
      const dataFim = new Date('2025-01-31');

      // ACT
      await service.getHistoricoPrecosProduto(usuarioId, {
        produto_id: produtoId,
        data_inicio: dataInicio,
        data_fim: dataFim,
      });

      // ASSERT
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'compra.data_compra >= :dataInicio',
        { dataInicio },
      );
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'compra.data_compra <= :dataFim',
        { dataFim },
      );
    });

    it('deve ordenar histórico por data_compra ASC', async () => {
      // ARRANGE
      (produtoRepository.findOne as jest.Mock).mockResolvedValue(mockProduto);

      const mockCompras = [
        {
          item_preco_unitario: 5.0,
          item_quantidade: 1,
          item_unidade: UnidadeMedida.KG,
          compra_data_compra: new Date('2025-01-15'),
          compra_local_compra: 'Supermercado A',
          compra_id: 'compra-1',
        },
        {
          item_preco_unitario: 6.0,
          item_quantidade: 1,
          item_unidade: UnidadeMedida.KG,
          compra_data_compra: new Date('2025-01-10'),
          compra_local_compra: 'Supermercado B',
          compra_id: 'compra-2',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockCompras),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      await service.getHistoricoPrecosProduto(usuarioId, {
        produto_id: produtoId,
      });

      // ASSERT
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
        'compra.data_compra',
        'ASC',
      );
    });
  });

  describe('getComparacaoLocais', () => {
    it('deve agrupar corretamente por local_compra', async () => {
      // ARRANGE
      const mockResult = [
        {
          local: 'Supermercado A',
          preco_medio: '12.50',
          total_compras: '15',
          total_gasto: '187.50',
        },
        {
          local: 'Supermercado B',
          preco_medio: '14.80',
          total_compras: '8',
          total_gasto: '118.40',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getComparacaoLocais(usuarioId, {});

      // ASSERT
      expect(resultado.locais).toHaveLength(2);
      expect(resultado.locais[0].local_compra).toBe('Supermercado A');
      expect(resultado.locais[1].local_compra).toBe('Supermercado B');
    });

    it('deve calcular economia_vs_media corretamente', async () => {
      // ARRANGE
      const mockResult = [
        {
          local: 'Supermercado Barato',
          preco_medio: '10.00',
          total_compras: '10',
          total_gasto: '100.00',
        },
        {
          local: 'Supermercado Caro',
          preco_medio: '14.00',
          total_compras: '10',
          total_gasto: '140.00',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getComparacaoLocais(usuarioId, {});

      // ASSERT
      // Média: (10 + 14) / 2 = 12
      // Barato: 12 - 10 = +2 (economiza R$2)
      // Caro: 12 - 14 = -2 (paga R$2 a mais)
      expect(resultado.locais[0].economia_vs_media).toBe(2.0);
      expect(resultado.locais[1].economia_vs_media).toBe(-2.0);
    });

    it('deve retornar array vazio se não há dados', async () => {
      // ARRANGE
      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getComparacaoLocais(usuarioId, {});

      // ASSERT
      expect(resultado.locais).toEqual([]);
    });

    it('deve aplicar filtro por produto_id se fornecido', async () => {
      // ARRANGE
      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      await service.getComparacaoLocais(usuarioId, { produto_id: produtoId });

      // ASSERT
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'item.produto_id = :produtoId',
        { produtoId },
      );
    });
  });

  describe('getGastosPorCategoria', () => {
    it('deve agrupar por categoria corretamente', async () => {
      // ARRANGE
      const mockResult = [
        {
          categoria_id: 'cat-1',
          categoria_nome: 'Carnes',
          total_gasto: '450.00',
          total_compras: '12',
        },
        {
          categoria_id: 'cat-2',
          categoria_nome: 'Frutas',
          total_gasto: '320.00',
          total_compras: '20',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getGastosPorCategoria(usuarioId, {});

      // ASSERT
      expect(resultado.categorias).toHaveLength(2);
      expect(resultado.categorias[0].categoria_nome).toBe('Carnes');
      expect(resultado.categorias[1].categoria_nome).toBe('Frutas');
    });

    it('deve calcular percentuais corretos', async () => {
      // ARRANGE
      const mockResult = [
        {
          categoria_id: 'cat-1',
          categoria_nome: 'Carnes',
          total_gasto: '400.00',
          total_compras: '10',
        },
        {
          categoria_id: 'cat-2',
          categoria_nome: 'Frutas',
          total_gasto: '600.00',
          total_compras: '30',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getGastosPorCategoria(usuarioId, {});

      // ASSERT
      // Total: 400 + 600 = 1000
      // Carnes: 400 / 1000 = 40%
      // Frutas: 600 / 1000 = 60%
      expect(resultado.categorias[0].percentual_total).toBe(40);
      expect(resultado.categorias[1].percentual_total).toBe(60);
      expect(resultado.total_gasto).toBe(1000);
    });

    it('deve calcular ticket_medio corretamente', async () => {
      // ARRANGE
      const mockResult = [
        {
          categoria_id: 'cat-1',
          categoria_nome: 'Carnes',
          total_gasto: '400.00',
          total_compras: '10',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      const resultado = await service.getGastosPorCategoria(usuarioId, {});

      // ASSERT
      // 400 / 10 = 40
      expect(resultado.categorias[0].ticket_medio).toBe(40);
    });

    it('deve respeitar limite de categorias (limit)', async () => {
      // ARRANGE
      const mockResult = [
        {
          categoria_id: 'cat-1',
          categoria_nome: 'Categoria 1',
          total_gasto: '100.00',
          total_compras: '5',
        },
      ];

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResult),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      await service.getGastosPorCategoria(usuarioId, { limit: 5 });

      // ASSERT
      expect(queryBuilderMock.limit).toHaveBeenCalledWith(5);
    });

    it('deve ordenar por total_gasto DESC', async () => {
      // ARRANGE
      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      (compraItemRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      // ACT
      await service.getGastosPorCategoria(usuarioId, {});

      // ASSERT
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
        'SUM(item.preco_total)',
        'DESC',
      );
    });
  });
});
