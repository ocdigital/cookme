import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  ProductKnowledgeBase,
  FoodCategory,
} from '../entities/product-knowledge-base.entity';
import { ProductValidation } from '../entities/product-validation.entity';
import { AIClassificationLog, APIStatus } from '../entities/ai-classification-log.entity';

@Injectable()
export class ProductClassificationService {
  private readonly logger = new Logger(ProductClassificationService.name);
  private claudeApiKey: string;
  private readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly MODEL = 'claude-3-5-sonnet-20241022';
  private readonly CONFIDENCE_THRESHOLD = 0.75;

  constructor(
    @InjectRepository(ProductKnowledgeBase)
    private productKnowledgeRepository: Repository<ProductKnowledgeBase>,
    @InjectRepository(ProductValidation)
    private productValidationRepository: Repository<ProductValidation>,
    @InjectRepository(AIClassificationLog)
    private aiClassificationLogRepository: Repository<AIClassificationLog>,
    private configService: ConfigService,
  ) {
    this.claudeApiKey = this.configService.get<string>('CLAUDE_API_KEY') || '';
  }

  /**
   * Classifica um produto como alimento ou não-alimento
   * Utiliza cache local (ProductKnowledgeBase) antes de chamar API
   */
  async classificarProduto(
    productName: string,
    usuarioId?: string,
  ): Promise<{
    categoria: FoodCategory;
    confidence: number;
    fromCache: boolean;
    descricao: string;
  }> {
    if (!productName || productName.trim().length === 0) {
      throw new BadRequestException('Nome do produto não pode estar vazio');
    }

    const normalizedName = this.normalizarNome(productName);

    // Verifica cache local
    const cached = await this.productKnowledgeRepository.findOne({
      where: { normalized_name: normalizedName, is_active: true },
    });

    if (
      cached &&
      cached.confidence_score >= this.CONFIDENCE_THRESHOLD &&
      cached.categoria !== FoodCategory.INDEFINIDO
    ) {
      this.logger.log(
        `Produto encontrado em cache: ${productName} → ${cached.categoria}`,
      );

      // Log cache hit
      await this.aiClassificationLogRepository.save({
        product_name: productName,
        model_used: this.MODEL,
        api_status: APIStatus.SUCESSO,
        confidence_score: cached.confidence_score,
        categoria_classificada: cached.categoria,
        tempo_requisicao_ms: 0,
        from_cache: true,
      });

      return {
        categoria: cached.categoria,
        confidence: cached.confidence_score,
        fromCache: true,
        descricao: cached.descricao_classificacao || '',
      };
    }

    // Se não está em cache ou baixa confiança, chama Claude
    return await this.classificarComClaude(productName, normalizedName);
  }

  /**
   * Classifica múltiplos produtos em UMA ÚNICA CHAMADA (muito mais econômico)
   * Retorna array com resultado de cada produto
   */
  async classificarEmBatch(
    productNames: string[],
    usuarioId?: string,
  ): Promise<
    Array<{
      produto: string;
      categoria: FoodCategory;
      confidence: number;
      fromCache: boolean;
      descricao?: string;
    }>
  > {
    const startTime = Date.now();
    const results: Array<{
      produto: string;
      categoria: FoodCategory;
      confidence: number;
      fromCache: boolean;
      descricao?: string;
    }> = [];

    // Verifica quais produtos estão em cache
    const cachedResults: typeof results = [];
    const productsToClassify: string[] = [];

    for (const productName of productNames) {
      const normalizedName = this.normalizarNome(productName);
      const cached = await this.productKnowledgeRepository.findOne({
        where: { normalized_name: normalizedName, is_active: true },
      });

      if (
        cached &&
        cached.confidence_score >= this.CONFIDENCE_THRESHOLD &&
        cached.categoria !== FoodCategory.INDEFINIDO
      ) {
        cachedResults.push({
          produto: productName,
          categoria: cached.categoria,
          confidence: cached.confidence_score,
          fromCache: true,
          descricao: cached.descricao_classificacao,
        });
      } else {
        productsToClassify.push(productName);
      }
    }

    // Se houver produtos para classificar, faz UMA ÚNICA chamada ao Claude
    if (productsToClassify.length > 0) {
      const newResults = await this.classificarEmBatchNoClaudeAPI(
        productsToClassify,
      );
      results.push(...newResults);
    }

    // Combina resultados do cache + novos
    results.push(...cachedResults);

    return results;
  }

  /**
   * Chama Claude API UMA VEZ com múltiplos produtos
   * Muito mais econômico que chamar por produto
   */
  private async classificarEmBatchNoClaudeAPI(
    productNames: string[],
  ): Promise<
    Array<{
      produto: string;
      categoria: FoodCategory;
      confidence: number;
      fromCache: boolean;
      descricao?: string;
    }>
  > {
    const startTime = Date.now();

    try {
      // Cria prompt com todos os produtos
      const productsListFormatted = productNames
        .map((name, i) => `${i + 1}. ${name}`)
        .join('\n');

      const prompt = `Classifique os seguintes produtos como "alimento" ou "não-alimento".
Responda em JSON com um array, onde cada item tem o nome exato do produto e a classificação:

Produtos:
${productsListFormatted}

Responda APENAS com um JSON válido no formato:
[
  {"nome": "nome do produto", "categoria": "alimento" ou "nao_alimento", "confidence": 0.0-1.0, "descricao": "motivo breve"},
  ...
]`;

      // MODO MOCK ATIVADO: Desativado temporariamente a chamada real à API
      // Quando pronto, mude USE_MOCK_CLASSIFICATION para false
      const USE_MOCK_CLASSIFICATION = true;

      let data: any;
      if (USE_MOCK_CLASSIFICATION) {
        this.logger.log('🎭 MODO MOCK: Validando produtos com simulação de Claude API');
        data = this.mockClassificacaoBatch(productNames);
      } else {
        const response = await fetch(this.CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.MODEL,
            max_tokens: 512,
            system: `Você é um classificador de produtos especializado em identificar se produtos são alimentos ou não.
IMPORTANTE: Responda SEMPRE com um JSON válido em formato de array.`,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        const requestTime = Date.now() - startTime;

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Claude API Error: ${error.error?.message || 'Unknown error'}`,
          );
        }

        data = await response.json();
      }

      const requestTime = Date.now() - startTime;

      // Parse resposta do Claude
      let classificacoes: Array<any>;
      try {
        const content = data.content[0].text;
        // Trata caso do Claude envolver em markdown
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        classificacoes = JSON.parse(jsonStr);
      } catch {
        throw new Error('Failed to parse Claude batch response');
      }

      // Processa e salva cada produto no cache
      const results: Array<{
        produto: string;
        categoria: FoodCategory;
        confidence: number;
        fromCache: boolean;
        descricao?: string;
      }> = [];

      for (const clf of classificacoes) {
        const categoria =
          clf.categoria === 'alimento'
            ? FoodCategory.ALIMENTO
            : FoodCategory.NAO_ALIMENTO;

        const confidence = clf.confidence || 0.5;
        const normalizedName = this.normalizarNome(clf.nome);

        // Salva no cache
        let knowledgeBase = await this.productKnowledgeRepository.findOne({
          where: { normalized_name: normalizedName },
        });

        if (!knowledgeBase) {
          knowledgeBase = this.productKnowledgeRepository.create({
            product_name: clf.nome,
            normalized_name: normalizedName,
            categoria,
            confidence_score: confidence,
            descricao_classificacao: clf.descricao,
            classification_metadata: {
              source: 'claude_batch',
              last_classified_by: 'claude',
            },
            total_validacoes: 1,
            validacoes_alimento: categoria === FoodCategory.ALIMENTO ? 1 : 0,
            validacoes_nao_alimento:
              categoria === FoodCategory.NAO_ALIMENTO ? 1 : 0,
          } as unknown as ProductKnowledgeBase);
        } else {
          knowledgeBase.categoria = categoria;
          knowledgeBase.confidence_score = confidence;
          knowledgeBase.descricao_classificacao = clf.descricao;
          knowledgeBase.ultima_classificacao = new Date();
        }

        await this.productKnowledgeRepository.save(knowledgeBase);

        results.push({
          produto: clf.nome,
          categoria,
          confidence,
          fromCache: false,
          descricao: clf.descricao,
        });
      }

      // Log da chamada em batch
      await this.aiClassificationLogRepository.save({
        product_name: `Batch de ${productNames.length} produtos`,
        model_used: this.MODEL,
        api_status: APIStatus.SUCESSO,
        tempo_requisicao_ms: requestTime,
        tokens_utilizados:
          (data.usage?.input_tokens || 0) +
          (data.usage?.output_tokens || 0),
        custo_estimado_usd: this.estimarCustoEntropico(data.usage),
        request_metadata: {
          prompt_tokens: data.usage?.input_tokens,
          completion_tokens: data.usage?.output_tokens,
          total_tokens:
            (data.usage?.input_tokens || 0) +
            (data.usage?.output_tokens || 0),
          batch_size: productNames.length,
        },
        from_cache: false,
      });

      this.logger.log(
        `Batch de ${productNames.length} produtos classificados via Claude em ${requestTime}ms`,
      );

      return results;
    } catch (error) {
      const requestTime = Date.now() - startTime;

      await this.aiClassificationLogRepository.save({
        product_name: `Batch de ${productNames.length} produtos (ERRO)`,
        model_used: this.MODEL,
        api_status: APIStatus.ERRO,
        tempo_requisicao_ms: requestTime,
        erro_mensagem: error.message,
        from_cache: false,
      });

      this.logger.error(`Erro ao classificar batch:`, error);

      // Retorna todos como indefinido em caso de erro
      return productNames.map((name) => ({
        produto: name,
        categoria: FoodCategory.INDEFINIDO,
        confidence: 0,
        fromCache: false,
      }));
    }
  }

  /**
   * Mock: Simula a resposta da Claude API para demonstração e testes
   * Classifica produtos baseado em regras simples
   */
  private mockClassificacaoBatch(productNames: string[]): any {
    const mockClassifications = {
      // Alimentos
      'maçã': { nome: 'maçã', categoria: 'alimento', confidence: 0.99, descricao: 'Fruta vermelha, alimento' },
      'banana': { nome: 'banana', categoria: 'alimento', confidence: 0.99, descricao: 'Fruta amarela, alimento' },
      'pão': { nome: 'pão', categoria: 'alimento', confidence: 0.98, descricao: 'Produto de panificação, alimento' },
      'leite': { nome: 'leite', categoria: 'alimento', confidence: 0.99, descricao: 'Bebida láctea, alimento' },
      'queijo': { nome: 'queijo', categoria: 'alimento', confidence: 0.98, descricao: 'Derivado de leite, alimento' },
      'arroz': { nome: 'arroz', categoria: 'alimento', confidence: 0.99, descricao: 'Cereal, alimento' },
      'feijão': { nome: 'feijão', categoria: 'alimento', confidence: 0.99, descricao: 'Legume, alimento' },
      'frango': { nome: 'frango', categoria: 'alimento', confidence: 0.99, descricao: 'Carne branca, alimento' },
      'carne': { nome: 'carne', categoria: 'alimento', confidence: 0.99, descricao: 'Proteína animal, alimento' },
      'tomate': { nome: 'tomate', categoria: 'alimento', confidence: 0.99, descricao: 'Fruta/vegetal, alimento' },
      'cebola': { nome: 'cebola', categoria: 'alimento', confidence: 0.99, descricao: 'Vegetal, alimento' },
      'alho': { nome: 'alho', categoria: 'alimento', confidence: 0.99, descricao: 'Tempero, alimento' },
      'azeite': { nome: 'azeite', categoria: 'alimento', confidence: 0.98, descricao: 'Óleo alimentar, alimento' },
      'sal': { nome: 'sal', categoria: 'alimento', confidence: 0.97, descricao: 'Tempero, alimento' },
      'açúcar': { nome: 'açúcar', categoria: 'alimento', confidence: 0.99, descricao: 'Adoçante, alimento' },
      'chocolate': { nome: 'chocolate', categoria: 'alimento', confidence: 0.99, descricao: 'Doce, alimento' },
      'café': { nome: 'café', categoria: 'alimento', confidence: 0.99, descricao: 'Bebida, alimento' },
      'chá': { nome: 'chá', categoria: 'alimento', confidence: 0.99, descricao: 'Bebida, alimento' },
      'suco': { nome: 'suco', categoria: 'alimento', confidence: 0.99, descricao: 'Bebida, alimento' },
      'água': { nome: 'água', categoria: 'alimento', confidence: 0.95, descricao: 'Bebida, alimento' },

      // Não-alimentos
      'detergente': { nome: 'detergente', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Produto de limpeza, não-alimento' },
      'sabonete': { nome: 'sabonete', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Higiene pessoal, não-alimento' },
      'shampoo': { nome: 'shampoo', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Higiene pessoal, não-alimento' },
      'papel higiênico': { nome: 'papel higiênico', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Artigo de higiene, não-alimento' },
      'desinfetante': { nome: 'desinfetante', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Produto de limpeza, não-alimento' },
      'esponja': { nome: 'esponja', categoria: 'nao_alimento', confidence: 0.98, descricao: 'Artigo de limpeza, não-alimento' },
      'pano': { nome: 'pano', categoria: 'nao_alimento', confidence: 0.95, descricao: 'Artigo de limpeza, não-alimento' },
      'toalha': { nome: 'toalha', categoria: 'nao_alimento', confidence: 0.95, descricao: 'Artigo têxtil, não-alimento' },
      'vela': { nome: 'vela', categoria: 'nao_alimento', confidence: 0.98, descricao: 'Artigo decorativo/iluminação, não-alimento' },
      'vaso': { nome: 'vaso', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de decoração, não-alimento' },
      'prato': { nome: 'prato', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento' },
      'copo': { nome: 'copo', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento' },
      'colher': { nome: 'colher', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento' },
      'faca': { nome: 'faca', categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento' },
    };

    const clasificacoes = productNames.map((name) => {
      const normalized = name.toLowerCase().trim();
      const found = mockClassifications[normalized];

      if (found) {
        this.logger.log(`🎭 MOCK: "${name}" → ${found.categoria} (confidence: ${found.confidence})`);
        return found;
      }

      // Se não encontrar, tenta uma classificação heurística
      const keywords = {
        alimentos: ['fruta', 'verdura', 'legume', 'carne', 'peixe', 'frango', 'arroz', 'feijão', 'alimento', 'comida', 'bebida', 'suco', 'leite', 'queijo', 'pão', 'macarrão', 'biscoito', 'chocolate', 'doce'],
        nao_alimentos: ['detergente', 'sabão', 'sabonete', 'shampoo', 'limpeza', 'higiene', 'desinfetante', 'papel', 'toalha', 'pano', 'esponja', 'vela', 'utensílio', 'prato', 'copo', 'colher', 'faca'],
      };

      const isAlimento = keywords.alimentos.some(kw => normalized.includes(kw));
      const isNaoAlimento = keywords.nao_alimentos.some(kw => normalized.includes(kw));

      if (isAlimento && !isNaoAlimento) {
        return {
          nome: name,
          categoria: 'alimento',
          confidence: 0.75,
          descricao: 'Classificado como alimento por heurística',
        };
      } else if (isNaoAlimento) {
        return {
          nome: name,
          categoria: 'nao_alimento',
          confidence: 0.75,
          descricao: 'Classificado como não-alimento por heurística',
        };
      }

      // Padrão: indefinido
      return {
        nome: name,
        categoria: 'indefinido',
        confidence: 0.5,
        descricao: 'Classificação incerta - requer validação manual',
      };
    });

    // Retorna no formato que o código espera (simula resposta da API)
    return {
      content: [
        {
          text: JSON.stringify(clasificacoes),
        },
      ],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    };
  }

  /**
   * Mock: Simula resposta da Claude API para classificação de um único produto
   */
  private mockClassificacaoIndividual(productName: string): {
    categoria: string;
    confidence: number;
    descricao: string;
    keywords: string[];
  } {
    const mockClassifications = {
      // Alimentos
      'maçã': { categoria: 'alimento', confidence: 0.99, descricao: 'Fruta vermelha, alimento natural', keywords: ['fruta', 'alimento', 'natural'] },
      'banana': { categoria: 'alimento', confidence: 0.99, descricao: 'Fruta amarela, alimento natural', keywords: ['fruta', 'alimento', 'natural'] },
      'pão': { categoria: 'alimento', confidence: 0.98, descricao: 'Produto de panificação, alimento processado', keywords: ['alimento', 'pão', 'trigo'] },
      'leite': { categoria: 'alimento', confidence: 0.99, descricao: 'Bebida láctea, alimento animal', keywords: ['alimento', 'bebida', 'lácteo'] },
      'queijo': { categoria: 'alimento', confidence: 0.98, descricao: 'Derivado de leite, alimento animal', keywords: ['alimento', 'lácteo', 'queijo'] },
      'arroz': { categoria: 'alimento', confidence: 0.99, descricao: 'Cereal, alimento natural', keywords: ['cereal', 'alimento', 'grão'] },
      'feijão': { categoria: 'alimento', confidence: 0.99, descricao: 'Legume, alimento natural', keywords: ['legume', 'alimento', 'proteína'] },
      'frango': { categoria: 'alimento', confidence: 0.99, descricao: 'Carne branca, alimento animal', keywords: ['carne', 'alimento', 'proteína'] },
      'carne': { categoria: 'alimento', confidence: 0.99, descricao: 'Proteína animal, alimento', keywords: ['carne', 'alimento', 'proteína'] },
      'tomate': { categoria: 'alimento', confidence: 0.99, descricao: 'Fruta/vegetal, alimento natural', keywords: ['vegetal', 'alimento', 'natural'] },
      'cebola': { categoria: 'alimento', confidence: 0.99, descricao: 'Vegetal, alimento natural', keywords: ['vegetal', 'alimento', 'tempero'] },
      'alho': { categoria: 'alimento', confidence: 0.99, descricao: 'Tempero, alimento natural', keywords: ['tempero', 'alimento', 'vegetal'] },
      'azeite': { categoria: 'alimento', confidence: 0.98, descricao: 'Óleo alimentar, alimento natural', keywords: ['óleo', 'alimento', 'natural'] },
      'sal': { categoria: 'alimento', confidence: 0.97, descricao: 'Tempero, alimento mineral', keywords: ['tempero', 'alimento', 'mineral'] },
      'açúcar': { categoria: 'alimento', confidence: 0.99, descricao: 'Adoçante, alimento processado', keywords: ['alimento', 'adoçante', 'doce'] },
      'chocolate': { categoria: 'alimento', confidence: 0.99, descricao: 'Doce, alimento processado', keywords: ['alimento', 'doce', 'processado'] },
      'café': { categoria: 'alimento', confidence: 0.99, descricao: 'Bebida, alimento natural', keywords: ['bebida', 'alimento', 'café'] },
      'chá': { categoria: 'alimento', confidence: 0.99, descricao: 'Bebida, alimento natural', keywords: ['bebida', 'alimento', 'chá'] },
      'suco': { categoria: 'alimento', confidence: 0.99, descricao: 'Bebida, alimento natural', keywords: ['bebida', 'alimento', 'suco'] },
      'água': { categoria: 'alimento', confidence: 0.95, descricao: 'Bebida, alimento essencial', keywords: ['bebida', 'alimento', 'água'] },

      // Não-alimentos
      'detergente': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Produto de limpeza, não-alimento', keywords: ['limpeza', 'não-alimento', 'químico'] },
      'sabonete': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Higiene pessoal, não-alimento', keywords: ['higiene', 'não-alimento', 'pessoal'] },
      'shampoo': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Higiene pessoal, não-alimento', keywords: ['higiene', 'não-alimento', 'cabelo'] },
      'papel higiênico': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Artigo de higiene, não-alimento', keywords: ['higiene', 'não-alimento', 'papel'] },
      'desinfetante': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Produto de limpeza, não-alimento', keywords: ['limpeza', 'não-alimento', 'químico'] },
      'esponja': { categoria: 'nao_alimento', confidence: 0.98, descricao: 'Artigo de limpeza, não-alimento', keywords: ['limpeza', 'não-alimento', 'utensílio'] },
      'pano': { categoria: 'nao_alimento', confidence: 0.95, descricao: 'Artigo de limpeza, não-alimento', keywords: ['limpeza', 'não-alimento', 'têxtil'] },
      'toalha': { categoria: 'nao_alimento', confidence: 0.95, descricao: 'Artigo têxtil, não-alimento', keywords: ['têxtil', 'não-alimento', 'higiene'] },
      'vela': { categoria: 'nao_alimento', confidence: 0.98, descricao: 'Artigo decorativo/iluminação, não-alimento', keywords: ['decoração', 'não-alimento', 'iluminação'] },
      'vaso': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de decoração, não-alimento', keywords: ['decoração', 'não-alimento', 'utensílio'] },
      'prato': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento', keywords: ['utensílio', 'não-alimento', 'cozinha'] },
      'copo': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento', keywords: ['utensílio', 'não-alimento', 'cozinha'] },
      'colher': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento', keywords: ['utensílio', 'não-alimento', 'cozinha'] },
      'faca': { categoria: 'nao_alimento', confidence: 0.99, descricao: 'Utensílio de cozinha, não-alimento', keywords: ['utensílio', 'não-alimento', 'cozinha'] },
    };

    const normalized = productName.toLowerCase().trim();
    const found = mockClassifications[normalized];

    if (found) {
      return found;
    }

    // Se não encontrar, tenta uma classificação heurística
    const keywords = {
      alimentos: ['fruta', 'verdura', 'legume', 'carne', 'peixe', 'frango', 'arroz', 'feijão', 'alimento', 'comida', 'bebida', 'suco', 'leite', 'queijo', 'pão', 'macarrão', 'biscoito', 'chocolate', 'doce'],
      nao_alimentos: ['detergente', 'sabão', 'sabonete', 'shampoo', 'limpeza', 'higiene', 'desinfetante', 'papel', 'toalha', 'pano', 'esponja', 'vela', 'utensílio', 'prato', 'copo', 'colher', 'faca'],
    };

    const isAlimento = keywords.alimentos.some(kw => normalized.includes(kw));
    const isNaoAlimento = keywords.nao_alimentos.some(kw => normalized.includes(kw));

    if (isAlimento && !isNaoAlimento) {
      return {
        categoria: 'alimento',
        confidence: 0.75,
        descricao: 'Classificado como alimento por heurística de palavras-chave',
        keywords: ['heurística', 'alimento'],
      };
    } else if (isNaoAlimento) {
      return {
        categoria: 'nao_alimento',
        confidence: 0.75,
        descricao: 'Classificado como não-alimento por heurística de palavras-chave',
        keywords: ['heurística', 'não-alimento'],
      };
    }

    // Padrão: indefinido
    return {
      categoria: 'indefinido',
      confidence: 0.5,
      descricao: 'Classificação incerta - requer validação manual ou análise adicional',
      keywords: ['incerto', 'validação-manual'],
    };
  }

  /**
   * Chama Claude API para classificação
   */
  private async classificarComClaude(
    productName: string,
    normalizedName: string,
  ): Promise<{
    categoria: FoodCategory;
    confidence: number;
    fromCache: boolean;
    descricao: string;
  }> {
    const startTime = Date.now();

    try {
      // MODO MOCK ATIVADO: Desativado temporariamente a chamada real à API
      // Quando pronto, mude USE_MOCK_CLASSIFICATION para false
      const USE_MOCK_CLASSIFICATION = true;

      let classificationResult;

      if (USE_MOCK_CLASSIFICATION) {
        this.logger.log(`🎭 MODO MOCK: Validando produto "${productName}"`);
        classificationResult = this.mockClassificacaoIndividual(productName);
      } else {
        const prompt = this.construirPromptClassificacao(productName);

        const response = await fetch(this.CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.MODEL,
            max_tokens: 256,
            system: `Você é um classificador de produtos especializado em identificar se um produto é um alimento ou não.
Responda sempre em JSON válido com a seguinte estrutura:
{
  "categoria": "alimento" ou "nao_alimento",
  "confidence": número entre 0 e 1,
  "descricao": "breve descrição do por quê",
  "keywords": ["palavra-chave1", "palavra-chave2"]
}`,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        const requestTime = Date.now() - startTime;

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Claude API Error: ${error.error?.message || 'Unknown error'}`,
          );
        }

        const data: any = await response.json();

        // Extract response content from Claude
        try {
          const content = data.content[0].text;
          // Claude pode envolver JSON em markdown, então vamos tratar isso
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          classificationResult = JSON.parse(jsonStr);
        } catch {
          throw new Error('Failed to parse Claude response');
        }
      }

      const requestTime = Date.now() - startTime;

      const categoria =
        classificationResult.categoria === 'alimento'
          ? FoodCategory.ALIMENTO
          : FoodCategory.NAO_ALIMENTO;

      const confidence = classificationResult.confidence || 0.5;

      // Salva resultado no banco (cache)
      let knowledgeBase = await this.productKnowledgeRepository.findOne({
        where: { normalized_name: normalizedName },
      });

      if (!knowledgeBase) {
        knowledgeBase = this.productKnowledgeRepository.create({
          product_name: productName,
          normalized_name: normalizedName,
          categoria,
          confidence_score: confidence,
          descricao_classificacao: classificationResult.descricao,
          classification_metadata: {
            keywords: classificationResult.keywords || [],
            source: 'claude',
            last_classified_by: 'claude',
          },
          total_validacoes: 1,
          validacoes_alimento: categoria === FoodCategory.ALIMENTO ? 1 : 0,
          validacoes_nao_alimento:
            categoria === FoodCategory.NAO_ALIMENTO ? 1 : 0,
        } as unknown as ProductKnowledgeBase);
      } else {
        // Atualiza com nova classificação
        knowledgeBase.categoria = categoria;
        knowledgeBase.confidence_score = confidence;
        knowledgeBase.descricao_classificacao =
          classificationResult.descricao;
        knowledgeBase.ultima_classificacao = new Date();
      }

      await this.productKnowledgeRepository.save(knowledgeBase);

      // Log da classificação
      const tokens_input = USE_MOCK_CLASSIFICATION ? 50 : 0;
      const tokens_output = USE_MOCK_CLASSIFICATION ? 30 : 0;

      await this.aiClassificationLogRepository.save({
        product_name: productName,
        model_used: this.MODEL,
        api_status: APIStatus.SUCESSO,
        confidence_score: confidence,
        categoria_classificada: categoria,
        tempo_requisicao_ms: requestTime,
        tokens_utilizados: tokens_input + tokens_output,
        custo_estimado_usd: this.estimarCustoEntropico({
          input_tokens: tokens_input,
          output_tokens: tokens_output,
        }),
        request_metadata: {
          prompt_tokens: tokens_input,
          completion_tokens: tokens_output,
          total_tokens: tokens_input + tokens_output,
          source: USE_MOCK_CLASSIFICATION ? 'mock' : 'api',
        },
        from_cache: false,
      });

      this.logger.log(
        `Produto classificado via Claude: ${productName} → ${categoria}`,
      );

      return {
        categoria,
        confidence,
        fromCache: false,
        descricao: classificationResult.descricao || '',
      };
    } catch (error) {
      const requestTime = Date.now() - startTime;

      // Log erro
      await this.aiClassificationLogRepository.save({
        product_name: productName,
        model_used: this.MODEL,
        api_status: APIStatus.ERRO,
        tempo_requisicao_ms: requestTime,
        erro_mensagem: error.message,
        from_cache: false,
      });

      this.logger.error(
        `Erro ao classificar produto ${productName} via Claude:`,
        error,
      );

      // Retorna categoria indefinida em caso de erro
      return {
        categoria: FoodCategory.INDEFINIDO,
        confidence: 0,
        fromCache: false,
        descricao: `Erro na classificação: ${error.message}`,
      };
    }
  }

  /**
   * Registra validação do usuário e atualiza confiança da classificação
   */
  async registrarValidacaoUsuario(
    productName: string,
    usuarioId: string,
    validacao: FoodCategory,
    comentario?: string,
  ): Promise<ProductValidation> {
    const normalizedName = this.normalizarNome(productName);

    let knowledgeBase = await this.productKnowledgeRepository.findOne({
      where: { normalized_name: normalizedName },
    });

    if (!knowledgeBase) {
      knowledgeBase = this.productKnowledgeRepository.create({
        product_name: productName,
        normalized_name: normalizedName,
        categoria: validacao,
        confidence_score: 0.5,
      });
    }

    // Atualiza contadores
    knowledgeBase.total_validacoes += 1;
    if (validacao === FoodCategory.ALIMENTO) {
      knowledgeBase.validacoes_alimento += 1;
    } else if (validacao === FoodCategory.NAO_ALIMENTO) {
      knowledgeBase.validacoes_nao_alimento += 1;
    }

    // Recalcula confidence score baseado em validações
    const totalValidacoes = knowledgeBase.total_validacoes;
    const confianca = Math.max(
      knowledgeBase.validacoes_alimento,
      knowledgeBase.validacoes_nao_alimento,
    ) / totalValidacoes;

    knowledgeBase.confidence_score = confianca;

    // Define categoria com base na maioria das validações
    if (knowledgeBase.validacoes_alimento > knowledgeBase.validacoes_nao_alimento) {
      knowledgeBase.categoria = FoodCategory.ALIMENTO;
    } else if (
      knowledgeBase.validacoes_nao_alimento >
      knowledgeBase.validacoes_alimento
    ) {
      knowledgeBase.categoria = FoodCategory.NAO_ALIMENTO;
    }

    await this.productKnowledgeRepository.save(knowledgeBase);

    // Salva validação
    const productValidation = this.productValidationRepository.create({
      product_knowledge_id: knowledgeBase.id,
      usuario_id: usuarioId,
      validacao_do_usuario: validacao,
      comentario_usuario: comentario,
      ia_confidence_score: knowledgeBase.confidence_score,
      ia_categoria_sugerida: knowledgeBase.categoria,
      concordou_com_ia:
        knowledgeBase.categoria === validacao ||
        knowledgeBase.categoria === FoodCategory.INDEFINIDO,
    });

    await this.productValidationRepository.save(productValidation);

    this.logger.log(
      `Validação registrada: ${productName} - Usuário: ${usuarioId} - Validação: ${validacao}`,
    );

    return productValidation;
  }

  /**
   * Obtém estatísticas de classificação
   */
  async obterEstatisticas(): Promise<{
    total_produtos_classificados: number;
    total_validacoes_usuario: number;
    taxa_acerto_ia: number;
    produtos_por_categoria: {
      alimento: number;
      nao_alimento: number;
      indefinido: number;
    };
    custo_total_api_usd: number;
    cache_hit_rate: number;
  }> {
    const totalProdutos = await this.productKnowledgeRepository.count();

    const alimentos = await this.productKnowledgeRepository.count({
      where: { categoria: FoodCategory.ALIMENTO },
    });

    const naoAlimentos = await this.productKnowledgeRepository.count({
      where: { categoria: FoodCategory.NAO_ALIMENTO },
    });

    const indefinidos = await this.productKnowledgeRepository.count({
      where: { categoria: FoodCategory.INDEFINIDO },
    });

    const totalValidacoes =
      await this.productValidationRepository.count();

    const custoTotal = await this.aiClassificationLogRepository
      .createQueryBuilder('log')
      .select('SUM(log.custo_estimado_usd)', 'total')
      .getRawOne();

    const logs = await this.aiClassificationLogRepository.count();
    const cacheHits = await this.aiClassificationLogRepository.count({
      where: { from_cache: true },
    });

    const cacheHitRate = logs > 0 ? (cacheHits / logs) * 100 : 0;

    const taxaAcerto =
      totalValidacoes > 0
        ? (totalProdutos / (totalProdutos + totalValidacoes)) * 100
        : 0;

    return {
      total_produtos_classificados: totalProdutos,
      total_validacoes_usuario: totalValidacoes,
      taxa_acerto_ia: parseFloat(taxaAcerto.toFixed(2)),
      produtos_por_categoria: {
        alimento: alimentos,
        nao_alimento: naoAlimentos,
        indefinido: indefinidos,
      },
      custo_total_api_usd: parseFloat(
        (custoTotal.total || 0).toFixed(6),
      ),
      cache_hit_rate: parseFloat(cacheHitRate.toFixed(2)),
    };
  }

  /**
   * Obtém histórico de validações de um produto
   */
  async obterHistoricoValidacoes(productName: string): Promise<any> {
    const normalizedName = this.normalizarNome(productName);

    const knowledgeBase = await this.productKnowledgeRepository.findOne({
      where: { normalized_name: normalizedName },
      relations: ['validacoes'],
    });

    if (!knowledgeBase) {
      throw new BadRequestException('Produto não encontrado');
    }

    return {
      produto: knowledgeBase.product_name,
      categoria_atual: knowledgeBase.categoria,
      confianca: knowledgeBase.confidence_score,
      total_validacoes: knowledgeBase.total_validacoes,
      validacoes_alimento: knowledgeBase.validacoes_alimento,
      validacoes_nao_alimento: knowledgeBase.validacoes_nao_alimento,
      validacoes: knowledgeBase.validacoes,
    };
  }

  /**
   * Helper: Normaliza nome do produto (lowercase, remove espaços extras)
   */
  private normalizarNome(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Helper: Constrói prompt para OpenAI
   */
  private construirPromptClassificacao(productName: string): string {
    return `Classifique o seguinte produto como "alimento" (algo que pode ser comido) ou "nao_alimento" (itens de limpeza, higiene, etc).

Produto: "${productName}"

Responda em JSON com:
- categoria: "alimento" ou "nao_alimento"
- confidence: valor entre 0 e 1 (0 = não confiante, 1 = muito confiante)
- descricao: Explicação breve da classificação
- keywords: Array de palavras-chave relevantes

Responda APENAS com o JSON, sem explicações adicionais.`;
  }

  /**
   * Helper: Estima custo da API Claude
   */
  private estimarCustoEntropico(usage: {
    input_tokens?: number;
    output_tokens?: number;
  }): number {
    // Claude 3.5 Sonnet: $0.003 / 1K input tokens, $0.015 / 1K output tokens
    const inputCost =
      ((usage.input_tokens || 0) / 1000) * 0.003;
    const outputCost =
      ((usage.output_tokens || 0) / 1000) * 0.015;
    return inputCost + outputCost;
  }
}
