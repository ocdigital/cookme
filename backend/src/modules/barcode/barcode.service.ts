import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ProdutosService } from '../produtos/produtos.service';
import { CreateProdutoDto } from '../produtos/dto/create-produto.dto';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

interface OpenFoodFactsResponse {
  code: string;
  status: number;
  product?: {
    id: string;
    name?: string;
    generic_name?: string;
    brands?: string;
    brands_tags?: string[];
    categories?: string;
    categories_tags?: string[];
    image_url?: string;
    image_front_url?: string;
    image_nutrition_url?: string;
    nutriscore_grade?: string;
    nutriments?: {
      energy_value?: number;
      'energy-kcal'?: number;
      'energy-kcal_unit'?: string;
      proteins?: number;
      carbohydrates?: number;
      sugars?: number;
      fat?: number;
      'saturated-fat'?: number;
      sodium?: number;
      fiber?: number;
      salt?: number;
    };
    allergens?: string;
    allergens_tags?: string[];
    serving_size?: string;
    stores?: string;
  };
}

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger('BarcodeService');
  private axiosInstance: AxiosInstance;

  // URLs de APIs de código de barras
  private readonly OPEN_FOOD_FACTS_URL =
    'https://world.openfoodfacts.org/api/v0/product';
  private readonly OPEN_FOOD_FACTS_BR_URL =
    'https://br.openfoodfacts.org/api/v0/product';

  constructor(private readonly produtosService: ProdutosService) {
    this.axiosInstance = axios.create({
      timeout: 5000,
      headers: {
        'User-Agent': 'CookMe/1.0 (+https://cookme.com)',
      },
    });
  }

  /**
   * Busca produto por código de barras
   * 1. Tenta banco de dados local
   * 2. Tenta Open Food Facts Brasil
   * 3. Tenta Open Food Facts Mundial
   * 4. Se encontrado em API externa, salva localmente
   */
  async buscarPorCodigo(codigo: string): Promise<any> {
    if (!codigo || codigo.trim().length === 0) {
      throw new BadRequestException('Código de barras inválido');
    }

    // Normalizar código (remover espaços)
    const codigoNormalizado = codigo.trim();

    try {
      // 1. Tenta buscar no banco local
      const produtoLocal = await this.produtosService.findByBarcode(
        codigoNormalizado,
      );

      if (produtoLocal) {
        this.logger.log(
          `Código ${codigoNormalizado} encontrado no banco local`,
        );
        return {
          encontrado: true,
          origem: 'local',
          produto: produtoLocal,
          cache: true,
        };
      }

      // 2. Tenta buscar em Open Food Facts Brasil
      let produtoAPI = await this.buscarOpenFoodFacts(
        codigoNormalizado,
        'brasil',
      );

      // 3. Se não encontrar no Brasil, tenta o mundial
      if (!produtoAPI) {
        produtoAPI = await this.buscarOpenFoodFacts(
          codigoNormalizado,
          'mundial',
        );
      }

      if (!produtoAPI) {
        this.logger.warn(`Código ${codigoNormalizado} não encontrado em nenhuma API`);
        return {
          encontrado: false,
          origem: 'none',
          mensagem:
            'Produto não encontrado em nossas bases. Por favor, cadastre manualmente.',
          codigo: codigoNormalizado,
          dica: 'Verifique se o código está correto',
        };
      }

      // 4. Salvar produto encontrado no banco local para cache futuro
      const produtoSalvo = await this.salvarProdutoDoAPI(produtoAPI!);

      return {
        encontrado: true,
        origem: 'openfoodfacts',
        produto: produtoSalvo,
        cache: false,
        mensagem: 'Produto importado de Open Food Facts',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar código ${codigoNormalizado}:`,
        error.message,
      );

      // Em caso de erro, tentar pelo menos o banco local
      const produtoLocal = await this.produtosService.findByBarcode(
        codigoNormalizado,
      ).catch(() => null);

      if (produtoLocal) {
        return {
          encontrado: true,
          origem: 'local',
          produto: produtoLocal,
          aviso: 'APIs externas indisponíveis, usando cache local',
        };
      }

      return {
        encontrado: false,
        origem: 'error',
        mensagem:
          'Erro ao consultar base de dados. Tente novamente em alguns instantes.',
        codigo: codigoNormalizado,
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
  }

  /**
   * Busca em Open Food Facts (Brasil ou Mundial)
   */
  private async buscarOpenFoodFacts(
    codigo: string,
    regiao: 'brasil' | 'mundial',
  ): Promise<OpenFoodFactsResponse['product'] | null> {
    try {
      const baseUrl =
        regiao === 'brasil' ? this.OPEN_FOOD_FACTS_BR_URL : this.OPEN_FOOD_FACTS_URL;
      const url = `${baseUrl}/${codigo}.json`;

      this.logger.log(`Consultando ${regiao}... ${url}`);

      const response = await this.axiosInstance.get<OpenFoodFactsResponse>(url);

      // Verificar se o produto foi encontrado
      if (response.data.status === 1 && response.data.product) {
        this.logger.log(`Produto ${codigo} encontrado em Open Food Facts ${regiao}`);
        return response.data.product;
      }

      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.debug(`Código ${codigo} não encontrado em Open Food Facts ${regiao}`);
        return null;
      }

      // Re-lançar erros reais de rede
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.warn(
          `Timeout ou conexão recusada ao consultar Open Food Facts ${regiao}`,
        );
        return null;
      }

      throw error;
    }
  }

  /**
   * Converte dados da API para o modelo local de Produto
   */
  private async salvarProdutoDoAPI(
    produtoAPI: NonNullable<OpenFoodFactsResponse['product']>,
  ): Promise<any> {
    try {
      // Extrair dados relevantes da API
      const nome = produtoAPI.name || produtoAPI.generic_name || 'Produto sem nome';
      const descricao = this.extrairDescricao(produtoAPI);
      const marca = this.extrairMarca(produtoAPI);
      const categoria = this.extrairCategoria(produtoAPI);
      const imagemUrl = this.extrairImagem(produtoAPI);
      const nutricionais = this.extrairNutricionais(produtoAPI);
      const tags = this.extrairTags(produtoAPI);

      // Buscar ou criar marca
      let marcaId: string | null = null;
      if (marca) {
        const marcaObj = await this.produtosService.findOrCreateMarca(marca);
        marcaId = marcaObj.id;
      }

      // Buscar ou criar categoria
      let categoriaId: string | null = null;
      if (categoria) {
        const categoriaObj = await this.produtosService.findOrCreateCategoria(
          categoria,
        );
        categoriaId = categoriaObj.id;
      }

      // Criar DTO do produto
      const createProdutoDto: CreateProdutoDto = {
        nome,
        codigo_barras: produtoAPI.id,
        unidade_padrao: UnidadeMedida.UN,
        tags,
      };

      if (marcaId) {
        createProdutoDto.marca_id = marcaId;
      }

      if (categoriaId) {
        createProdutoDto.categoria_id = categoriaId;
      }

      // Salvar no banco
      const produtoSalvo = await this.produtosService.create(createProdutoDto);

      this.logger.log(
        `Produto ${produtoAPI.id} salvo localmente com sucesso`,
      );

      return produtoSalvo;
    } catch (error) {
      this.logger.error(
        `Erro ao salvar produto do API: ${produtoAPI.id}`,
        error.message,
      );
      // Não rejeitar a busca se não conseguir salvar
      // Retornar dados da API mesmo assim
      return {
        id: 'temp-' + produtoAPI.id,
        nome: produtoAPI.name || 'Produto',
        codigo_barras: produtoAPI.id,
        imagem_url: this.extrairImagem(produtoAPI),
        origem: 'openfoodfacts',
        temporario: true,
        aviso: 'Dados do produto não foram salvos localmente',
      };
    }
  }

  /**
   * Extrai descrição do produto
   */
  private extrairDescricao(produto: NonNullable<OpenFoodFactsResponse['product']>): string {
    const partes: string[] = [];

    if (produto.generic_name) {
      partes.push(produto.generic_name);
    }

    if (produto.categories) {
      partes.push(`Categorias: ${produto.categories}`);
    }

    if (produto.allergens) {
      partes.push(`Alergênios: ${produto.allergens}`);
    }

    if (produto.stores) {
      partes.push(`Disponível em: ${produto.stores}`);
    }

    return partes.join('\n');
  }

  /**
   * Extrai marca do produto
   */
  private extrairMarca(produto: NonNullable<OpenFoodFactsResponse['product']>): string | null {
    if (produto.brands) {
      return produto.brands.split(',')[0].trim();
    }
    if (produto.brands_tags && produto.brands_tags.length > 0) {
      return produto.brands_tags[0];
    }
    return null;
  }

  /**
   * Extrai categoria principal do produto
   */
  private extrairCategoria(produto: NonNullable<OpenFoodFactsResponse['product']>): string | null {
    if (produto.categories) {
      const categorias = produto.categories.split(',');
      return categorias[0].trim();
    }
    if (produto.categories_tags && produto.categories_tags.length > 0) {
      return produto.categories_tags[0];
    }
    return null;
  }

  /**
   * Extrai imagem do produto (priorizar imagem frontal)
   */
  private extrairImagem(produto: NonNullable<OpenFoodFactsResponse['product']>): string | null {
    if (produto.image_front_url) {
      return produto.image_front_url;
    }
    if (produto.image_url) {
      return produto.image_url;
    }
    return null;
  }

  /**
   * Extrai informações nutricionais
   */
  private extrairNutricionais(produto: NonNullable<OpenFoodFactsResponse['product']>): any {
    if (!produto.nutriments) {
      return null;
    }

    return {
      calorias:
        produto.nutriments['energy-kcal'] ||
        (produto.nutriments.energy_value
          ? Math.round(produto.nutriments.energy_value / 4.184)
          : null),
      proteinas: produto.nutriments.proteins,
      carboidratos: produto.nutriments.carbohydrates,
      gorduras: produto.nutriments.fat,
      fibras: produto.nutriments.fiber,
      sodio: produto.nutriments.sodium,
      acucares: produto.nutriments.sugars,
    };
  }

  /**
   * Extrai tags do produto (vegano, sem-gluten, organico, etc)
   */
  private extrairTags(produto: NonNullable<OpenFoodFactsResponse['product']>): string[] {
    const tags: string[] = [];

    // Tags de alergênios
    if (produto.allergens_tags) {
      tags.push(...produto.allergens_tags);
    }

    // Nutriscore como tag de qualidade
    if (produto.nutriscore_grade) {
      tags.push(`nutriscore-${produto.nutriscore_grade}`);
    }

    // Detectar características comuns
    const descricao = (
      (produto.name || '') +
      (produto.generic_name || '')
    ).toLowerCase();

    if (descricao.includes('vegan')) tags.push('vegano');
    if (descricao.includes('vegetarian')) tags.push('vegetariano');
    if (descricao.includes('gluten-free')) tags.push('sem-gluten');
    if (descricao.includes('organic')) tags.push('organico');
    if (descricao.includes('bio')) tags.push('organico');

    return [...new Set(tags)]; // Remove duplicatas
  }
}
