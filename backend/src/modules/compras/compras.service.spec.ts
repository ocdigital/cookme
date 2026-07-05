import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ComprasService } from './compras.service';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { ProductClassificationService } from '../product-classification/services/product-classification.service';
import { OcrAliasService } from '../product-classification/services/ocr-alias.service';
import { ProductImageService } from '../produtos/services/product-image.service';
import { Repository } from 'typeorm';

describe('ComprasService', () => {
  let service: ComprasService;
  let compraRepository: Repository<Compra>;
  let compraItemRepository: Repository<CompraItem>;
  let produtoRepository: Repository<Produto>;
  let inventarioRepository: Repository<Inventario>;

  const mockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  });

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    query: jest.fn(),
    createQueryBuilder: jest.fn().mockImplementation(() => mockQueryBuilder()),
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
        {
          provide: OcrAliasService,
          useValue: {
            resolverAlias: jest.fn().mockImplementation((nome: string) => Promise.resolve(nome)),
            resolverNomeCanônico: jest.fn().mockImplementation((nome: string) => Promise.resolve(nome)),
          },
        },
        {
          provide: ProductImageService,
          useValue: {
            fetchAndSaveProductImage: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: { save: jest.fn(), findOne: jest.fn() },
            }),
            createQueryBuilder: jest.fn().mockReturnValue({
              insert: jest.fn().mockReturnThis(),
              into: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({}),
            }),
            query: jest.fn().mockResolvedValue([]),
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
    // Helpers: produtos novos ganham id derivado do nome (evita colisão no mapa por nome),
    // save de array devolve o próprio array (comportamento batch do TypeORM)
    const mockCreateProduto = () =>
      jest.spyOn(produtoRepository, 'create').mockImplementation(
        (dto: any) => ({ id: `prod-${dto.nome}`, ...dto }) as any,
      );
    const mockSaveEcoando = (repo: Repository<any>) =>
      jest.spyOn(repo, 'save').mockImplementation((x: any) => Promise.resolve(x));

    it('deve salvar itens do cupom no inventário', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        { nome: 'Frango', quantidade: 2, valor: 25.99, codigo_barras: '123456789' },
        { nome: 'Arroz', quantidade: 1, valor: 18.5 },
      ];

      mockCreateProduto();
      mockSaveEcoando(produtoRepository);
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(inventarioRepository, 'create').mockImplementation((dto: any) => dto as any);
      mockSaveEcoando(inventarioRepository);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(result.total).toBe(2);
      expect(result.salvos).toBe(2);
      expect(result.itens).toBeDefined();
    });

    it('deve reutilizar produto existente encontrado por código de barras (não cria duplicata)', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        { nome: 'Frango Sadia 1kg', quantidade: 2, valor: 25.99, codigo_barras: '123456789' },
      ];

      const mockProdutoExistente = {
        id: 'prod-existente',
        nome: 'Frango Sadia 1kg',
        codigo_barras: '123456789',
      };

      // Busca batch por nome/código retorna o produto já cadastrado
      jest.spyOn(produtoRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProdutoExistente]),
      } as any);
      const createSpy = mockCreateProduto();
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(inventarioRepository, 'create').mockImplementation((dto: any) => dto as any);
      mockSaveEcoando(inventarioRepository);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(result.salvos).toBe(1);
      expect(createSpy).not.toHaveBeenCalled();
      expect(inventarioRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ produto_id: 'prod-existente' }),
      );
    });

    it('deve criar novo produto se não existir', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [{ nome: 'Novo Produto', quantidade: 1, valor: 10.0 }];

      const createSpy = mockCreateProduto();
      const saveSpy = mockSaveEcoando(produtoRepository);
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(inventarioRepository, 'create').mockImplementation((dto: any) => dto as any);
      mockSaveEcoando(inventarioRepository);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(result.salvos).toBe(1);
    });

    it('dois itens novos com o MESMO código de balança não explodem a unique de produtos', async () => {
      // Bug de produção 2026-07-04: cupom com item pesado 2x (código interno
      // 43362) → dois "novos" com mesmo codigo_barras → 23505 no batch insert
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        { nome: 'BANANA PRATA', quantidade: 1, valor: 5.0, codigo_barras: '43362' },
        { nome: 'BANANA PRATA KG', quantidade: 0.8, valor: 4.0, codigo_barras: '43362' },
      ];

      const createSpy = mockCreateProduto();
      const saveSpy = mockSaveEcoando(produtoRepository);
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(inventarioRepository, 'create').mockImplementation((dto: any) => dto as any);
      mockSaveEcoando(inventarioRepository);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      // Batch de produtos novos deve conter UM produto para o código 43362
      const batchSalvo = saveSpy.mock.calls[0][0] as any[];
      const comCodigo = batchSalvo.filter((p) => p.codigo_barras === '43362');
      expect(comCodigo).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('unique violation no batch de produtos não derruba o request (fallback re-consulta)', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [{ nome: 'Banana Nova', quantidade: 1, valor: 5.0, codigo_barras: '43362' }];

      const produtoJaExistente = { id: 'prod-antigo', nome: 'BANANA', codigo_barras: '43362' };

      mockCreateProduto();
      // 1ª tentativa de save explode com unique violation (código já no banco
      // sob outro nome que o lookup inicial não casou)
      jest
        .spyOn(produtoRepository, 'save')
        .mockRejectedValueOnce({ code: '23505', detail: 'Key (codigo_barras)=(43362) already exists.' });
      // Re-consulta acha o produto existente
      jest.spyOn(produtoRepository, 'createQueryBuilder')
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]), // lookup inicial não acha
        } as any)
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([produtoJaExistente]), // fallback acha
        } as any);
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(inventarioRepository, 'create').mockImplementation((dto: any) => dto as any);
      mockSaveEcoando(inventarioRepository);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      // Não explode; usa o produto que já existia
      expect(result.salvos).toBe(1);
      expect(inventarioRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ produto_id: 'prod-antigo' }),
      );
    });

    it('não-ingrediente (sabonete/lustra) NUNCA entra na despensa, mesmo sem classificação IA', async () => {
      // Bug de produção 2026-07-04: sabonete líquido apareceu em "minha despensa".
      // Guard determinístico bloqueia na escrita — não depende de IA/quota.
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        { nome: 'SABONETE LIQUIDO PROTEX', quantidade: 1, valor: 8.0 },
        { nome: 'LUSTRA MOVEIS POLIFLOR', quantidade: 1, valor: 12.0 },
        { nome: 'ARROZ CAMIL 5KG', quantidade: 1, valor: 25.0 },
      ];

      mockCreateProduto();
      mockSaveEcoando(produtoRepository);
      const updateSpy = jest.spyOn(produtoRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      const invCreateSpy = jest
        .spyOn(inventarioRepository, 'create')
        .mockImplementation((dto: any) => dto as any);
      mockSaveEcoando(inventarioRepository);

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      // Só o arroz entra no inventário
      expect(result.salvos).toBe(1);
      const nomesInventario = invCreateSpy.mock.calls.map((c: any) => c[0].produto_id);
      expect(nomesInventario).toEqual(['prod-ARROZ CAMIL 5KG']);
      // Produtos bloqueados aprendem ingrediente_receita=false
      expect(updateSpy).toHaveBeenCalledWith(
        'prod-SABONETE LIQUIDO PROTEX',
        expect.objectContaining({ ingrediente_receita: false }),
      );
    });

    it('deve continuar salvando mesmo se um item falhar', async () => {
      const usuarioId = '123e4567-e89b-12d3-a456-426614174000';
      const itens = [
        { nome: 'Produto 1', quantidade: 1, valor: 10.0 },
        { nome: 'Produto 2', quantidade: 1, valor: 20.0 },
      ];

      mockCreateProduto();
      mockSaveEcoando(produtoRepository);
      jest.spyOn(inventarioRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(inventarioRepository, 'create').mockImplementation((dto: any) => dto as any);
      // Simular falha na primeira tentativa de save do inventário
      jest
        .spyOn(inventarioRepository, 'save')
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockImplementation((x: any) => Promise.resolve(x));

      const result = await service.salvarItensCupomNoInventario(usuarioId, itens);

      expect(result.total).toBe(2);
      expect(result.salvos).toBe(1); // Apenas 1 salvo (o segundo)
    });
  });
});
