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
import { NotificacaoTriggersService } from '../../notificacoes/services/notificacao-triggers.service';
import { retryWithBackoff } from '../../../common/utils/retry.util';

@Injectable()
export class ProductClassificationService {
  private readonly logger = new Logger(ProductClassificationService.name);
  private claudeApiKey: string;
  private geminiApiKey: string;
  private readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
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
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {
    this.claudeApiKey = this.configService.get<string>('CLAUDE_API_KEY') || '';
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
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
    ingrediente_receita?: boolean | null;
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
        ingrediente_receita: cached.ingrediente_receita,
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
      ingrediente_receita?: boolean | null;
      descricao?: string;
      canonical_name?: string | null;
    }>
  > {
    const startTime = Date.now();
    const results: Array<{
      produto: string;
      categoria: FoodCategory;
      confidence: number;
      fromCache: boolean;
      ingrediente_receita?: boolean | null;
      descricao?: string;
      canonical_name?: string | null;
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
        cached.categoria !== FoodCategory.INDEFINIDO &&
        cached.canonical_ingredient  // sem canonical → re-classifica para obter nome canônico
      ) {
        cachedResults.push({
          produto: productName,
          categoria: cached.categoria,
          confidence: cached.confidence_score,
          fromCache: true,
          ingrediente_receita: cached.ingrediente_receita,
          descricao: cached.descricao_classificacao,
          canonical_name: cached.canonical_ingredient,
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
      ingrediente_receita?: boolean | null;
      descricao?: string;
      canonical_name?: string | null;
    }>
  > {
    const startTime = Date.now();

    try {
      // Cria prompt com todos os produtos
      const productsListFormatted = productNames
        .map((name, i) => `${i + 1}. ${name}`)
        .join('\n');

      const prompt = `Você é o cérebro de classificação de um app de gestão de cozinha brasileiro.
Para cada produto de supermercado abaixo, retorne 5 informações:

1. CATEGORIA: "alimento" (pode ser ingerido) ou "nao_alimento" (limpeza, higiene, utensílios, papelaria)
2. INGREDIENTE_RECEITA: true se é ingrediente culinário bruto/semi-processado, false se não é
3. CANONICAL_NAME: nome culinário padronizado — veja regras abaixo
4. CONFIDENCE: 0.0 a 1.0
5. DESCRICAO: motivo em 5 palavras

REGRAS INGREDIENTE_RECEITA:
✅ true (são ingredientes): carnes, frango, peixes, ovos, leite, queijo, manteiga, iogurte, arroz, feijão, macarrão, farinha, açúcar, sal, óleo, azeite, vinagre, temperos, frutas, legumes, verduras, molhos (base), café em pó, leite de coco, creme de leite, fermento
❌ false (NÃO são ingredientes): cápsulas de café (Nespresso/Dolce Gusto/D Gusto/Três Corações cápsula), biscoitos de marca (Oreo/Passatempo/Bauducco), chocolates de marca (Bis/Lacta/Nestlé barra), salgadinhos (Cheetos/Pringles/Elma Chips), bebidas prontas (refrigerante/suco pronto/energético), chás prontos/sachê, panetone, bolachas, refeições prontas, pizza pronta, macarrão instantâneo Nissin/Miojo

REGRAS DO CANONICAL_NAME — inteligência culinária brasileira:

REMOVER sempre (não são parte do ingrediente):
- Marca: Perdigão, Sadia, Seara, Tirolez, Alto Alegre, Italac, Broto Legal, Cisne, Liza, Yoki, etc.
- Quantidade e unidade: 800G, 1Kg, 500Ml, C/10, etc.
- Qualificadores de origem não culinários: "Nacional", "A Granel", "Premium", "Plus", "Extra", "Granel", "Import"
- Estado de conservação: "Resfriado", "Congelado", "Fresco" (quando não muda o uso)
- Código/tipo interno: "T1", "N8", "Int" (de integral só manter se relevante)

MANTER quando faz diferença culinária:
- Cortes de carne: "peito", "coxa", "bisteca", "filé", "lombo", "costela", "alcatra", "fraldinha"
- Variedades de feijão: "carioca", "preto", "branco", "fradinho", "verde"
- Variedades culinariamente distintas: "siciliano" (limão), "cravo" (alho), "portuguesa" (linguiça)
- Tipo de leite: "integral", "desnatado", "semidesnatado" (são diferentes na receita)
- Tipo de farinha: "de trigo", "de mandioca", "de milho", "de rosca"

PADRÕES CULINÁRIOS BRASILEIROS — variety defaults:
- "Cebola" sem cor → "cebola" (amarela é o padrão, não especificar)
  "Cebola Roxa" → "cebola roxa" (culinariamente diferente)
  "Cebola Branca" → "cebola branca" (culinariamente diferente)
- "Alho" sem cor → "alho" (branco é o padrão)
  "Alho Poró" → "alho-poró" (ingrediente diferente)
- "Limão" → "limão" (tahiti é o padrão no Brasil)
  "Limão Siciliano" → "limão siciliano" (diferente)
- "Pimentão" → "pimentão" (sem cor = qualquer, não especificar)
  "Pimentão Vermelho/Amarelo/Verde" → manter cor se especificada
- "Tomate" → "tomate" (salada/débora são variedades de mesa, não culinariamente distintas)
  "Tomate Cereja" → "tomate cereja"
  "Tomate Seco" → "tomate seco"
- "Batata" → "batata" (inglesa é o padrão)
  "Batata Doce" → "batata-doce" (diferente)
  "Batata Baroa" → "batata-baroa" (diferente)
- "Arroz" → "arroz" (branco tipo 1 é o padrão)
  "Arroz Integral" → "arroz integral"
  "Arroz Parboilizado" → "arroz parboilizado"
- "Frango" → manter corte se especificado: "frango peito", "coxa de frango", "frango inteiro"
  Sem corte → "frango"
- "Feijão" → sempre especificar variedade: "feijão carioca", "feijão preto", "feijão branco"
  Sem variedade → "feijão" (carioca é o padrão)
- "Café" em pó/grão → "café" (ingrediente_receita: true)
  "Café" em cápsula → "cápsula de café" (ingrediente_receita: false)

EXEMPLOS COMPLETOS:
"Cafe Moraes Vacuo 500g" → "café"
"Arroz Prato Fino T1 5Kg" → "arroz"
"Peito Frango Perdigao 800G" → "frango peito"
"Bisteca Suina Frimesa Kg" → "bisteca suína"
"Cebola Nacional Kg" → "cebola"
"Cebola Kg" → "cebola"
"Cebola Roxa Kg" → "cebola roxa"
"Alho A Granel Kg" → "alho"
"Tomate Salada Kg" → "tomate"
"Oleo Liza Soja 900Ml" → "óleo de soja"
"Leite Italac Int C/Tampa 1L" → "leite integral"
"Ovos Caipira Naturegg Verm C/10" → "ovos"
"Mac D Benta Ovos Espaguet N 8 500G" → "macarrão espaguete"
"Feijao Broto Legal Carioca 1Kg" → "feijão carioca"
"Cr Leite Italac 200G" → "creme de leite"
"Batata Inglesa Kg" → "batata"
"Batata Doce Kg" → "batata-doce"
"Limao Tahiti Kg" → "limão"
"Limao Siciliano Kg" → "limão siciliano"
"Pimentao Verde Kg" → "pimentão verde"
"Capsula D Gusto Cafe Caseiro 80G" → "cápsula de café" (ingrediente_receita: false)
"Mac Inst Nissin Lamen Carne 85G" → "macarrão instantâneo" (ingrediente_receita: false)
"Sal Cisne Refinado 1Kg" → "sal"
"Afiador De Facas Premium" → nao_alimento, ingrediente_receita: null

<produtos_para_classificar>
${productsListFormatted}
</produtos_para_classificar>

Classifique cada produto dentro de <produtos_para_classificar> e responda APENAS com JSON array válido:
[
  {"nome": "nome exato do produto", "categoria": "alimento", "confidence": 0.95, "ingrediente_receita": true, "canonical_name": "café", "descricao": "café em pó, ingrediente"},
  ...
]

IMPORTANTE: retorne exatamente ${productNames.length} itens, na mesma ordem. canonical_name sempre em minúsculo.`;

      const USE_MOCK_CLASSIFICATION = !this.geminiApiKey;

      let responseText: string;
      if (USE_MOCK_CLASSIFICATION) {
        this.logger.log('🎭 MODO MOCK: Validando produtos com simulação');
        const mockResult = this.mockClassificacaoBatch(productNames);
        // mockClassificacaoBatch retorna um objeto, não precisa de parse
        responseText = JSON.stringify(mockResult);
      } else {
        try {
          const response = await retryWithBackoff(
            () => fetch(`${this.GEMINI_API_URL}?key=${this.geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }),
            { maxAttempts: 3, initialDelayMs: 500, shouldRetry: (err) => !!err },
          );

          if (!response.ok) {
            const error = await response.json();
            this.logger.error('Gemini API Error:', error);
            if (response.status === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') {
              this.notificacaoTriggers.limiteIAAtingido('Gemini', 'Cota de requisições esgotada').catch(() => {});
            }
            this.logger.log('🎭 Fallback para MODO MOCK: Validando produtos com simulação');
            const mockResult = this.mockClassificacaoBatch(productNames);
            responseText = JSON.stringify(mockResult);
          } else {
            const data = await response.json();
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!responseText) {
              this.logger.error('Gemini response empty, fallback to mock');
              const mockResult = this.mockClassificacaoBatch(productNames);
              responseText = JSON.stringify(mockResult);
            }
          }
        } catch (err) {
          this.logger.error('Gemini API call failed, fallback to mock:', err);
          const mockResult = this.mockClassificacaoBatch(productNames);
          responseText = JSON.stringify(mockResult);
        }
      }

      const requestTime = Date.now() - startTime;

      // Parse resposta (Gemini ou Mock)
      let classificacoes: Array<any>;
      try {
        // Trata caso de markdown wrapper
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        classificacoes = JSON.parse(jsonStr);
      } catch (err) {
        this.logger.error('Failed to parse batch response:', err);
        throw new Error('Failed to parse batch response');
      }

      // Processa e salva cada produto no cache
      const results: Array<{
        produto: string;
        categoria: FoodCategory;
        confidence: number;
        fromCache: boolean;
        ingrediente_receita?: boolean | null;
        descricao?: string;
        canonical_name?: string | null;
      }> = [];

      for (let i = 0; i < classificacoes.length; i++) {
        const clf = classificacoes[i];
        // Usa nome ORIGINAL enviado (por índice) — Gemini pode devolver nome com casing diferente
        // o que quebraria o lookup no nomeProdutoMap do chamador
        const originalName = productNames[i] ?? clf.nome;

        const categoria =
          clf.categoria === 'alimento'
            ? FoodCategory.ALIMENTO
            : FoodCategory.NAO_ALIMENTO;

        const confidence = clf.confidence || 0.5;
        const normalizedName = this.normalizarNome(originalName);
        const ingrediente_receita = clf.ingrediente_receita ?? null;
        const canonical_name = clf.canonical_name || null;

        // Salva no cache — tenta por normalized_name primeiro, depois por product_name
        // (fallback necessário quando normalizarNome() muda e gera normalized diferente do que está no banco)
        let knowledgeBase = await this.productKnowledgeRepository.findOne({
          where: { normalized_name: normalizedName },
        });

        if (!knowledgeBase) {
          knowledgeBase = await this.productKnowledgeRepository.findOne({
            where: { product_name: originalName },
          });
        }

        if (!knowledgeBase) {
          knowledgeBase = this.productKnowledgeRepository.create({
            product_name: originalName,
            normalized_name: normalizedName,
            categoria,
            confidence_score: confidence,
            ingrediente_receita,
            canonical_ingredient: canonical_name,
            descricao_classificacao: clf.descricao,
            classification_metadata: {
              source: USE_MOCK_CLASSIFICATION ? 'mock' : 'gemini_batch',
              last_classified_by: USE_MOCK_CLASSIFICATION ? 'mock' : 'gemini',
            },
            total_validacoes: 1,
            validacoes_alimento: categoria === FoodCategory.ALIMENTO ? 1 : 0,
            validacoes_nao_alimento:
              categoria === FoodCategory.NAO_ALIMENTO ? 1 : 0,
            validacoes_ingrediente_sim: ingrediente_receita === true ? 1 : 0,
            validacoes_ingrediente_nao: ingrediente_receita === false ? 1 : 0,
          } as unknown as ProductKnowledgeBase);
        } else {
          // Atualiza normalized_name para refletir nova normalização se necessário
          knowledgeBase.normalized_name = normalizedName;
          knowledgeBase.categoria = categoria;
          knowledgeBase.confidence_score = confidence;
          knowledgeBase.ingrediente_receita = ingrediente_receita;
          knowledgeBase.canonical_ingredient = canonical_name;
          knowledgeBase.descricao_classificacao = clf.descricao;
          knowledgeBase.ultima_classificacao = new Date();
        }

        await this.productKnowledgeRepository.save(knowledgeBase);

        results.push({
          produto: originalName,  // nome original — garante lookup correto no chamador
          categoria,
          confidence,
          fromCache: false,
          ingrediente_receita,
          descricao: clf.descricao,
          canonical_name,
        });
      }

      // Estimativa de tokens: ~1 token por 4 chars (heurística padrão LLM)
      const tokensEstimados = USE_MOCK_CLASSIFICATION
        ? 0
        : Math.ceil((prompt.length + responseText.length) / 4);

      // Log da chamada em batch
      await this.aiClassificationLogRepository.save({
        product_name: `Batch de ${productNames.length} produtos`,
        model_used: USE_MOCK_CLASSIFICATION ? 'mock' : 'gemini-2.5-flash',
        api_status: APIStatus.SUCESSO,
        tempo_requisicao_ms: requestTime,
        tokens_utilizados: tokensEstimados,
        custo_estimado_usd: USE_MOCK_CLASSIFICATION ? 0 : tokensEstimados * 0.0000001,
        response_metadata: {
          processing_time: requestTime,
          tokens_estimados: tokensEstimados,
          fonte: USE_MOCK_CLASSIFICATION ? 'mock' : 'gemini_estimado',
        },
        from_cache: false,
      });

      this.logger.log(
        `Batch de ${productNames.length} produtos classificados em ${requestTime}ms`,
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
        canonical_name: null,
      }));
    }
  }

  /**
   * Mock: Simula a resposta da Claude API para demonstração e testes
   * Classifica produtos baseado em regras simples
   */
  private mockClassificacaoBatch(productNames: string[]): any {
    const mockClassifications = {
      // Alimentos - Ingredientes para receita
      'maçã': { nome: 'maçã', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Fruta natural, ingrediente' },
      'banana': { nome: 'banana', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Fruta natural, ingrediente' },
      'pão': { nome: 'pão', categoria: 'alimento', confidence: 0.98, ingrediente_receita: false, descricao: 'Produto pronto, não ingrediente' },
      'leite': { nome: 'leite', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Ingrediente lácteo essencial' },
      'queijo': { nome: 'queijo', categoria: 'alimento', confidence: 0.98, ingrediente_receita: true, descricao: 'Ingrediente lácteo, receita' },
      'arroz': { nome: 'arroz', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Cereal bruto, ingrediente' },
      'feijão': { nome: 'feijão', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Legume bruto, ingrediente' },
      'frango': { nome: 'frango', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Proteína bruta, ingrediente' },
      'carne': { nome: 'carne', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Proteína bruta, ingrediente' },
      'tomate': { nome: 'tomate', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Vegetal bruto, ingrediente' },
      'cebola': { nome: 'cebola', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Vegetal bruto, ingrediente' },
      'alho': { nome: 'alho', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Tempero bruto, ingrediente' },
      'azeite': { nome: 'azeite', categoria: 'alimento', confidence: 0.98, ingrediente_receita: true, descricao: 'Óleo ingrediente, receita' },
      'sal': { nome: 'sal', categoria: 'alimento', confidence: 0.97, ingrediente_receita: true, descricao: 'Tempero ingrediente, receita' },
      'açúcar': { nome: 'açúcar', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Ingrediente doce, receita' },
      'chocolate': { nome: 'chocolate', categoria: 'alimento', confidence: 0.99, ingrediente_receita: false, descricao: 'Produto pronto, marca' },
      'café': { nome: 'café', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Bebida ingrediente, receita' },
      'chá': { nome: 'chá', categoria: 'alimento', confidence: 0.99, ingrediente_receita: false, descricao: 'Bebida processada, pronto' },
      'suco': { nome: 'suco', categoria: 'alimento', confidence: 0.99, ingrediente_receita: false, descricao: 'Bebida pronta, processada' },
      'água': { nome: 'água', categoria: 'alimento', confidence: 0.95, ingrediente_receita: true, descricao: 'Bebida essencial, ingrediente' },

      // Não-alimentos (ingrediente_receita = null)
      'detergente': { nome: 'detergente', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Produto de limpeza, não-alimento' },
      'sabonete': { nome: 'sabonete', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Higiene pessoal, não-alimento' },
      'shampoo': { nome: 'shampoo', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Higiene pessoal, não-alimento' },
      'papel higiênico': { nome: 'papel higiênico', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Artigo de higiene, não-alimento' },
      'desinfetante': { nome: 'desinfetante', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Produto de limpeza, não-alimento' },
      'esponja': { nome: 'esponja', categoria: 'nao_alimento', confidence: 0.98, ingrediente_receita: null, descricao: 'Artigo de limpeza, não-alimento' },
      'pano': { nome: 'pano', categoria: 'nao_alimento', confidence: 0.95, ingrediente_receita: null, descricao: 'Artigo de limpeza, não-alimento' },
      'toalha': { nome: 'toalha', categoria: 'nao_alimento', confidence: 0.95, ingrediente_receita: null, descricao: 'Artigo têxtil, não-alimento' },
      'vela': { nome: 'vela', categoria: 'nao_alimento', confidence: 0.98, ingrediente_receita: null, descricao: 'Artigo decorativo/iluminação, não-alimento' },
      'vaso': { nome: 'vaso', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Utensílio de decoração, não-alimento' },
      'prato': { nome: 'prato', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Utensílio de cozinha, não-alimento' },
      'copo': { nome: 'copo', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Utensílio de cozinha, não-alimento' },
      'colher': { nome: 'colher', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Utensílio de cozinha, não-alimento' },
      'faca': { nome: 'faca', categoria: 'nao_alimento', confidence: 0.99, ingrediente_receita: null, descricao: 'Utensílio de cozinha, não-alimento' },
      'capsula de café': { nome: 'capsula de café', categoria: 'alimento', confidence: 0.95, ingrediente_receita: false, descricao: 'Café pronto, processado' },
      'capsula d gusto': { nome: 'capsula d gusto', categoria: 'alimento', confidence: 0.95, ingrediente_receita: false, descricao: 'Café pronto, processado' },
      'nescafé': { nome: 'nescafé', categoria: 'alimento', confidence: 0.95, ingrediente_receita: false, descricao: 'Café pronto, processado' },
      'biscoito': { nome: 'biscoito', categoria: 'alimento', confidence: 0.98, ingrediente_receita: false, descricao: 'Bolinho pronto, processado' },
      'bisc piraque': { nome: 'bisc piraque', categoria: 'alimento', confidence: 0.95, ingrediente_receita: false, descricao: 'Biscoito pronto, marca' },
      'cha': { nome: 'cha', categoria: 'alimento', confidence: 0.99, ingrediente_receita: false, descricao: 'Chá pronto, processado' },
      'choc trento': { nome: 'choc trento', categoria: 'alimento', confidence: 0.95, ingrediente_receita: false, descricao: 'Chocolate pronto, marca' },
      'bolacha': { nome: 'bolacha', categoria: 'alimento', confidence: 0.98, ingrediente_receita: false, descricao: 'Bolacha pronta, processada' },
      'ovos': { nome: 'ovos', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Proteína bruta, ingrediente' },
      'óleo': { nome: 'óleo', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Óleo ingrediente, receita' },
      'manteiga': { nome: 'manteiga', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Ingrediente lácteo, receita' },
      'macarrão': { nome: 'macarrão', categoria: 'alimento', confidence: 0.99, ingrediente_receita: true, descricao: 'Cereal bruto, ingrediente' },
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
        // Alimentos processados/prontos: detecção heurística
        const processedKeywords = ['biscoito', 'bolacha', 'suco', 'chá', 'café', 'chocolate', 'capsula', 'nescafé', 'azeite', 'preparado', 'pronto'];
        const isProcessed = processedKeywords.some(kw => normalized.includes(kw));

        return {
          nome: name,
          categoria: 'alimento',
          confidence: 0.75,
          ingrediente_receita: !isProcessed, // false se processado, true se natural/bruto
          descricao: isProcessed ? 'Alimento processado heurística' : 'Alimento bruto heurística',
        };
      } else if (isNaoAlimento) {
        return {
          nome: name,
          categoria: 'nao_alimento',
          confidence: 0.75,
          ingrediente_receita: null,
          descricao: 'Classificado como não-alimento por heurística',
        };
      }

      // Padrão: indefinido
      return {
        nome: name,
        categoria: 'indefinido',
        confidence: 0.5,
        ingrediente_receita: null,
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
      const USE_MOCK_CLASSIFICATION = !this.geminiApiKey;

      let classificationResult;

      if (USE_MOCK_CLASSIFICATION) {
        this.logger.log(`🎭 MODO MOCK: Validando produto "${productName}"`);
        classificationResult = this.mockClassificacaoIndividual(productName);
      } else {
        const prompt = `Classifique o produto "${productName}" como "alimento" ou "nao_alimento".
Responda em JSON com a estrutura exata:
{
  "categoria": "alimento" ou "nao_alimento",
  "confidence": número entre 0 e 1,
  "descricao": "motivo breve em 5 palavras",
  "keywords": ["palavra-chave1", "palavra-chave2"]
}`;

        try {
          const response = await fetch(`${this.GEMINI_API_URL}?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          });

          if (!response.ok) {
            this.logger.warn('Gemini API error, falling back to mock');
            if (response.status === 429) {
              this.notificacaoTriggers.limiteIAAtingido('Gemini', 'Cota de requisições esgotada').catch(() => {});
            }
            classificationResult = this.mockClassificacaoIndividual(productName);
          } else {
            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!responseText) {
              classificationResult = this.mockClassificacaoIndividual(productName);
            } else {
              try {
                // Try to parse JSON from response (may be wrapped in markdown)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
                classificationResult = JSON.parse(jsonStr);
              } catch {
                this.logger.warn('Failed to parse Gemini response, falling back to mock');
                classificationResult = this.mockClassificacaoIndividual(productName);
              }
            }
          }
        } catch (err) {
          this.logger.warn('Gemini API call failed, falling back to mock:', err);
          classificationResult = this.mockClassificacaoIndividual(productName);
        }
      }

      const requestTime = Date.now() - startTime;

      const categoria =
        classificationResult.categoria === 'alimento'
          ? FoodCategory.ALIMENTO
          : FoodCategory.NAO_ALIMENTO;

      const confidence = classificationResult.confidence || 0.5;

      // Salva resultado no banco (cache) — tenta por normalized_name, fallback por product_name
      let knowledgeBase = await this.productKnowledgeRepository.findOne({
        where: { normalized_name: normalizedName },
      });

      if (!knowledgeBase) {
        knowledgeBase = await this.productKnowledgeRepository.findOne({
          where: { product_name: productName },
        });
      }

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
        // Atualiza com nova classificação (e sincroniza normalized_name se mudou)
        knowledgeBase.normalized_name = normalizedName;
        knowledgeBase.categoria = categoria;
        knowledgeBase.confidence_score = confidence;
        knowledgeBase.descricao_classificacao = classificationResult.descricao;
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
    nomeCanonicoCorrigido?: string,
    codigoBarras?: string,
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

    // Correção do usuário fecha o loop: sobrescreve o canônico (usuário é a
    // verdade) e aprende o EAN — vira acerto permanente para todos
    if (nomeCanonicoCorrigido) {
      knowledgeBase.canonical_ingredient = nomeCanonicoCorrigido.toLowerCase().trim();
    }
    if (codigoBarras && !knowledgeBase.codigo_barras) {
      knowledgeBase.codigo_barras = codigoBarras.slice(0, 14);
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
      // Remove quantidade+unidade: "800g", "5kg", "900ml", "1,5l"
      .replace(/\s*\d+[\.,]?\d*\s*(g|ml|kg|l|lt|un|cx|pct|gramas?|litros?|unid\.?)\b/gi, '')
      // Remove unidades isoladas sem dígito precedente: "Laranja Kg" → "laranja"
      .replace(/(^|\s)(kg|ml|lt|gramas?|litros?|unid\.?|un|cx|pct)(\s|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/gi, '');
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
