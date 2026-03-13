import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComprasService } from './compras.service';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { ProductClassificationService } from '../product-classification/services/product-classification.service';
import { Repository } from 'typeorm';

describe('ComprasService', () => {
  let service: ComprasService;
  let compraRepository: Repository<Compra>;
  let compraItemRepository: Repository<CompraItem>;
  let produtoRepository: Repository<Produto>;
  let inventarioRepository: Repository<Inventario>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprasService,
        {
          provide: getRepositoryToken(Compra),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CompraItem),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Produto),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Inventario),
          useValue: mockRepository(),
        },
        {
          provide: ProductClassificationService,
          useValue: {
            classificarEmBatch: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<ComprasService>(ComprasService);
    compraRepository = module.get(getRepositoryToken(Compra));
    compraItemRepository = module.get(getRepositoryToken(CompraItem));
    produtoRepository = module.get(getRepositoryToken(Produto));
    inventarioRepository = module.get(getRepositoryToken(Inventario));
  });

  describe('salvarItensCupomNoInventario', () => {
    it('deve salvar itens do cupom no inventário', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        {
          nome: 'Frango',
          quantidade: 2,
          valor: 25.99,
          codigo_barras: '123456789',
        },
        {
          nome: 'Arroz',
          quantidade: 1,
          valor: 18.50,
        },
      ];

      const mockProduto = {
        id: 'prod-123',
        nome: 'Frango',
        codigo_barras: '123456789',
      };

      const mockInventario = {
        id: 'inv-123',
        usuario_id: usuarioId,
        produto_id: 'prod-123',
        quantidade_disponivel: 2,
        unidade: 'un',
        data_validade: new Date(),
        metodo_atualizacao: 'ocr_nota',
      };

      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(produtoRepository, 'create').mockReturnValue(mockProduto as any);
      jest.spyOn(produtoRepository, 'save').mockResolvedValue(mockProduto as any);
      jest.spyOn(inventarioRepository, 'create').mockReturnValue(mockInventario as any);
      jest.spyOn(inventarioRepository, 'save').mockResolvedValue(mockInventario as any);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(result.total).toBe(2);
      expect(result.salvos).toBeGreaterThan(0);
      expect(result.itens).toBeDefined();
    });

    it('deve buscar produtos existentes por código de barras', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        {
          nome: 'Frango',
          quantidade: 2,
          valor: 25.99,
          codigo_barras: '123456789',
        },
      ];

      const mockProdutoExistente = {
        id: 'prod-existente',
        nome: 'Frango',
        codigo_barras: '123456789',
      };

      const mockInventario = {
        id: 'inv-123',
        usuario_id: usuarioId,
        produto_id: 'prod-existente',
        quantidade_disponivel: 2,
      };

      // Primeira chamada retorna o produto (busca por código)
      jest
        .spyOn(produtoRepository, 'findOne')
        .mockResolvedValueOnce(mockProdutoExistente as any);
      jest.spyOn(inventarioRepository, 'create').mockReturnValue(mockInventario as any);
      jest.spyOn(inventarioRepository, 'save').mockResolvedValue(mockInventario as any);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(result.salvos).toBeGreaterThan(0);
      expect(produtoRepository.findOne).toHaveBeenCalledWith({
        where: { codigo_barras: '123456789' },
      });
    });

    it('deve criar novo produto se não existir', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        {
          nome: 'Novo Produto',
          quantidade: 1,
          valor: 10.00,
        },
      ];

      const mockProdutoNovo = {
        id: 'prod-novo',
        nome: 'Novo Produto',
      };

      const mockInventario = {
        id: 'inv-123',
        usuario_id: usuarioId,
        produto_id: 'prod-novo',
        quantidade_disponivel: 1,
      };

      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(produtoRepository, 'create').mockReturnValue(mockProdutoNovo as any);
      jest.spyOn(produtoRepository, 'save').mockResolvedValue(mockProdutoNovo as any);
      jest.spyOn(inventarioRepository, 'create').mockReturnValue(mockInventario as any);
      jest.spyOn(inventarioRepository, 'save').mockResolvedValue(mockInventario as any);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(produtoRepository.create).toHaveBeenCalled();
      expect(produtoRepository.save).toHaveBeenCalled();
      expect(result.salvos).toBeGreaterThan(0);
    });

    it('deve continuar salvando mesmo se um item falhar', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        { nome: 'Produto 1', quantidade: 1, valor: 10.00 },
        { nome: 'Produto 2', quantidade: 1, valor: 20.00 },
      ];

      const mockInventario = {
        id: 'inv-123',
        usuario_id: usuarioId,
        quantidade_disponivel: 1,
      };

      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(produtoRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(produtoRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(inventarioRepository, 'create').mockReturnValue(mockInventario as any);
      // Simular falha na primeira tentativa de save
      jest
        .spyOn(inventarioRepository, 'save')
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce(mockInventario as any);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(result.total).toBe(2);
      expect(result.salvos).toBe(1); // Apenas 1 salvo (o segundo)
    });
  });
});
