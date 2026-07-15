import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { ProdutosService } from './produtos.service';
import { Produto } from './entities/produto.entity';
import { Marca } from './entities/marca.entity';
import { Categoria } from './entities/categoria.entity';
import { EngineClientService } from '../engine-client/engine-client.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProdutosService — busca por código de barras (Open Food Facts)', () => {
  let service: ProdutosService;

  beforeEach(async () => {
    const repoMock = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        { provide: getRepositoryToken(Produto), useValue: repoMock },
        { provide: getRepositoryToken(Marca), useValue: repoMock },
        { provide: getRepositoryToken(Categoria), useValue: repoMock },
        { provide: EngineClientService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
    jest.clearAllMocks();
  });

  it('retorna produto formatado quando o EAN existe no Open Food Facts', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        status: 1,
        product: { product_name: 'Nescau', brands: 'Nestlé, Nescau', quantity: '400 g' },
      },
    });

    const r = await service.buscarOpenFoodFacts('7891000053508');

    expect(r).toHaveLength(1);
    expect(r[0].titulo).toBe('Nescau Nestlé 400 g');
  });

  it('prefere product_name_pt quando disponível', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        status: 1,
        product: { product_name: 'Sugar', product_name_pt: 'Açúcar Refinado', brands: 'União', quantity: '1 kg' },
      },
    });

    const r = await service.buscarOpenFoodFacts('7891910000197');

    expect(r[0].titulo).toBe('Açúcar Refinado União 1 kg');
  });

  it('não duplica a marca quando ela já está no nome', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        status: 1,
        product: { product_name: 'Refrigerante Coca-Cola 2Lt', brands: 'Coca-Cola', quantity: '2l' },
      },
    });

    const r = await service.buscarOpenFoodFacts('7894900011517');

    // "Coca-Cola" já está no nome → não repete; quantidade entra
    expect(r[0].titulo).toBe('Refrigerante Coca-Cola 2Lt 2l');
  });

  it('retorna [] quando o produto não é encontrado (status 0)', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 0 } });
    const r = await service.buscarOpenFoodFacts('0000000000000');
    expect(r).toEqual([]);
  });

  it('retorna [] em caso de erro de rede (não propaga exceção)', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('timeout'));
    const r = await service.buscarOpenFoodFacts('7891000053508');
    expect(r).toEqual([]);
  });

  it('buscarPorBarcode retorna [] para código vazio sem chamar a rede', async () => {
    const r = await service.buscarPorBarcode('   ');
    expect(r).toEqual([]);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});
