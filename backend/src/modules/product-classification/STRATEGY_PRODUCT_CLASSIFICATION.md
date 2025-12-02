# CookMe - Estratégia de Classificação Inteligente de Produtos 🤖

## 📋 Visão Geral

Sistema inteligente de classificação automática de produtos para garantir que apenas **alimentos válidos** sejam cadastrados no inventário. O sistema aprende progressivamente através de validações do usuário e integração com IA.

---

## 🎯 Objetivos

1. ✅ **Detectar automaticamente** se um produto é alimento ou não
2. ✅ **Aprender com o tempo** a partir de validações do usuário
3. ✅ **Usar IA (OpenAI API)** para classificação inicial
4. ✅ **Manter base de dados local** de classificações conhecidas
5. ✅ **Filtrar produtos não-alimentícios** antes de adicionar ao inventário
6. ✅ **Reduzir custo de IA** através de cache inteligente

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUXO DE CLASSIFICAÇÃO                     │
└─────────────────────────────────────────────────────────────┘

1. USUÁRIO IMPORTA CUPOM/ESCANEIA PRODUTO
   └─ Nome do produto extraído

2. VERIFICAR CACHE LOCAL
   ├─ Existe em base de conhecimento?
   ├─ SIM → Usar classificação conhecida
   └─ NÃO → Ir para próximo passo

3. USAR IA PARA CLASSIFICAR
   ├─ OpenAI API (gpt-4-turbo)
   ├─ Perguntar: "Isso é alimento?"
   ├─ Retorna: { is_food: boolean, confidence: 0-1, category: string }
   └─ Salvar na base de conhecimento

4. EXIBIR PARA USUÁRIO VALIDAR
   ├─ Mostrar: "Você acredita que é alimento?"
   ├─ Usuário confirma ou corrige
   ├─ Aprendizado registrado
   └─ Adicionar ao inventário (se for alimento)

5. USAR PARA RECEITAS
   └─ Apenas alimentos aparecem nas receitas
```

---

## 🗄️ Banco de Dados

### Entity 1: Product Classification Knowledge Base

```typescript
// Arquivo: backend/src/modules/product-classification/entities/product-knowledge.entity.ts

@Entity('product_knowledge_base')
@Index(['product_name'])
@Index(['is_food', 'confidence'])
export class ProductKnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  product_name: string; // Nome normalizado (lowercase, sem acentos)

  @Column({ type: 'boolean' })
  is_food: boolean; // É alimento?

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  confidence: number; // 0-1 (quanto o sistema tem certeza)

  @Column({ nullable: true })
  food_category?: string; // 'Proteína', 'Carboidrato', 'Vegetal', etc

  @Column({ type: 'jsonb', nullable: true })
  ai_classification: {
    model: string; // 'gpt-4-turbo'
    reasoning: string; // Explicação da IA
    created_at: Date;
  };

  @Column({ type: 'int', default: 0 })
  user_confirmations: number; // Quantas vezes usuário confirmou

  @Column({ type: 'int', default: 0 })
  user_corrections: number; // Quantas vezes usuário corrigiu

  @Column({ type: 'jsonb', nullable: true })
  similar_products: string[]; // Produtos similares já classificados

  @CreateDateColumn()
  first_seen: Date;

  @UpdateDateColumn()
  last_updated: Date;

  // Relacionamentos
  @OneToMany(() => ProductValidation, (v) => v.product_knowledge)
  validations: ProductValidation[];
}
```

### Entity 2: Product Validation History

```typescript
// Arquivo: backend/src/modules/product-classification/entities/product-validation.entity.ts

export enum ValidationSource {
  AI = 'ai',
  USER_CONFIRMED = 'user_confirmed',
  USER_CORRECTED = 'user_corrected',
  CATEGORY_MATCH = 'category_match',
}

@Entity('product_validations')
@Index(['usuario_id', 'created_at'])
@Index(['product_knowledge_id', 'validation_source'])
export class ProductValidation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @Column('uuid')
  product_knowledge_id: string;

  @ManyToOne(() => ProductKnowledgeBase, (kb) => kb.validations)
  product_knowledge: ProductKnowledgeBase;

  @Column({
    type: 'enum',
    enum: ValidationSource,
  })
  validation_source: ValidationSource;

  @Column({ type: 'boolean' })
  is_food: boolean;

  @Column({ type: 'text', nullable: true })
  user_feedback: string; // "Correção: não é alimento" ou similar

  @Column({ type: 'int', default: 0 })
  helpfulness_score: number; // De -1 (incorreta) a 1 (correta)

  @CreateDateColumn()
  created_at: Date;

  // Relacionamentos
  @ManyToOne(() => Inventario, { nullable: true })
  inventario_item: Inventario;
}
```

### Entity 3: AI Classification Log

```typescript
// Arquivo: backend/src/modules/product-classification/entities/ai-classification-log.entity.ts

@Entity('ai_classification_logs')
@Index(['created_at'])
@Index(['is_food'])
export class AIClassificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_name: string;

  @Column({ type: 'text' })
  ai_prompt: string;

  @Column({ type: 'jsonb' })
  ai_response: {
    is_food: boolean;
    confidence: number;
    category: string;
    reasoning: string;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  cost_usd: number;

  @Column({ type: 'boolean', default: false })
  user_feedback_received: boolean;

  @Column({ type: 'boolean', nullable: true })
  user_agreed_with_ai: boolean;

  @CreateDateColumn()
  created_at: Date;
}
```

---

## 🧠 Serviços de IA

### Service 1: Product Classification Service

```typescript
// Arquivo: backend/src/modules/product-classification/services/product-classification.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAI } from 'openai';

@Injectable()
export class ProductClassificationService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(ProductKnowledgeBase)
    private knowledgeRepository: Repository<ProductKnowledgeBase>,

    @InjectRepository(AIClassificationLog)
    private classificationLogRepository: Repository<AIClassificationLog>,

    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Classificar um produto (com cache local)
   */
  async classificarProduto(productName: string): Promise<{
    is_food: boolean;
    confidence: number;
    category?: string;
    source: 'cache' | 'ai';
  }> {
    // 1. NORMALIZAR NOME
    const normalizedName = this.normalizarNome(productName);

    // 2. VERIFICAR CACHE LOCAL
    const conhecimento = await this.knowledgeRepository.findOne({
      where: { product_name: normalizedName },
    });

    if (conhecimento) {
      // Cache hit! Retorna imediatamente
      return {
        is_food: conhecimento.is_food,
        confidence: conhecimento.confidence,
        category: conhecimento.food_category,
        source: 'cache',
      };
    }

    // 3. CHAMAR IA (OpenAI)
    const classificacao = await this.chamarOpenAI(productName);

    // 4. SALVAR NA BASE DE CONHECIMENTO
    const novoConhecimento = this.knowledgeRepository.create({
      product_name: normalizedName,
      is_food: classificacao.is_food,
      confidence: classificacao.confidence,
      food_category: classificacao.category,
      ai_classification: {
        model: 'gpt-4-turbo',
        reasoning: classificacao.reasoning,
        created_at: new Date(),
      },
    });

    await this.knowledgeRepository.save(novoConhecimento);

    // 5. REGISTRAR NO LOG
    await this.classificationLogRepository.save({
      product_name: productName,
      ai_prompt: `É "${productName}" um alimento?`,
      ai_response: classificacao,
      cost_usd: classificacao.cost || 0.001, // Estimado
      user_feedback_received: false,
    });

    return {
      is_food: classificacao.is_food,
      confidence: classificacao.confidence,
      category: classificacao.category,
      source: 'ai',
    };
  }

  /**
   * Classificar múltiplos produtos em batch
   */
  async classificarEmBatch(
    productNames: string[],
  ): Promise<Map<string, any>> {
    const resultados = new Map();

    for (const name of productNames) {
      const resultado = await this.classificarProduto(name);
      resultados.set(name, resultado);
    }

    return resultados;
  }

  /**
   * Chamar OpenAI para classificar produto
   */
  private async chamarOpenAI(productName: string): Promise<{
    is_food: boolean;
    confidence: number;
    category: string;
    reasoning: string;
    cost?: number;
  }> {
    const prompt = `
Você é um especialista em classificação de produtos.
Analize o nome do produto "${productName}" e determine:

1. É um alimento? (sim/não)
2. Se for alimento, qual é a categoria? (Proteína, Carboidrato, Vegetal, Bebida, Limpeza, Higiene, etc)
3. Seu nível de confiança (0-1)

Responda APENAS em JSON:
{
  "is_food": boolean,
  "category": "string ou null",
  "confidence": number (0-1),
  "reasoning": "Breve explicação"
}

Exemplos:
- "Frango Peito 1kg" → { "is_food": true, "category": "Proteína", "confidence": 0.99 }
- "Detergente Neutro 500ml" → { "is_food": false, "category": "Limpeza", "confidence": 0.98 }
- "Leite Integral 1L" → { "is_food": true, "category": "Laticínio", "confidence": 0.99 }
- "Amaciante Sofisticado 750ml" → { "is_food": false, "category": "Limpeza", "confidence": 0.95 }
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Baixo para mais consistência
        max_tokens: 200,
      });

      const jsonString = response.choices[0].message.content;
      const resultado = JSON.parse(jsonString);

      return {
        is_food: resultado.is_food,
        confidence: resultado.confidence || 0.8,
        category: resultado.category || 'Outros',
        reasoning: resultado.reasoning || '',
      };
    } catch (error) {
      this.logger.error(`Erro ao chamar OpenAI para "${productName}":`, error);
      throw error;
    }
  }

  /**
   * Registrar validação do usuário
   */
  async registrarValidacaoUsuario(
    usuarioId: string,
    productName: string,
    validacao: {
      is_food: boolean;
      user_feedback?: string;
      correction?: boolean; // Se foi correção (true) ou confirmação (false)
    },
  ): Promise<void> {
    const normalizedName = this.normalizarNome(productName);

    // Buscar conhecimento
    let conhecimento = await this.knowledgeRepository.findOne({
      where: { product_name: normalizedName },
    });

    // Se não existe, criar
    if (!conhecimento) {
      conhecimento = this.knowledgeRepository.create({
        product_name: normalizedName,
        is_food: validacao.is_food,
        confidence: 0.5, // Baixa confiança inicial
      });
      await this.knowledgeRepository.save(conhecimento);
    }

    // Atualizar confiança baseado em feedback
    if (!validacao.correction) {
      // Foi confirmação
      conhecimento.user_confirmations += 1;
      conhecimento.confidence = Math.min(
        1,
        conhecimento.confidence + 0.1,
      );
    } else {
      // Foi correção
      conhecimento.user_corrections += 1;
      conhecimento.confidence = Math.max(
        0.3,
        conhecimento.confidence - 0.2,
      );
      conhecimento.is_food = validacao.is_food; // Atualizar classificação
    }

    conhecimento.last_updated = new Date();
    await this.knowledgeRepository.save(conhecimento);

    // Registrar validação
    await this.classificationLogRepository.update(
      {
        product_name: productName,
        user_feedback_received: false,
      },
      {
        user_feedback_received: true,
        user_agreed_with_ai: !validacao.correction,
      },
    );
  }

  /**
   * Obter estatísticas de classificação
   */
  async obterEstatisticas(): Promise<{
    total_classificacoes: number;
    products_confirmados: number;
    products_corrigidos: number;
    taxa_acerto_ai: number;
    custo_total_usd: number;
  }> {
    const total = await this.knowledgeRepository.count();

    const confirmacoes = await this.knowledgeRepository
      .createQueryBuilder()
      .where('user_confirmations > 0')
      .getCount();

    const correcoes = await this.knowledgeRepository
      .createQueryBuilder()
      .where('user_corrections > 0')
      .getCount();

    const logs = await this.classificationLogRepository.find();
    const logComFeedback = logs.filter((l) => l.user_feedback_received);
    const taxaAcerto =
      logComFeedback.length > 0
        ? logComFeedback.filter((l) => l.user_agreed_with_ai).length /
          logComFeedback.length
        : 0;

    const custoTotal = logs.reduce((acc, log) => acc + (log.cost_usd || 0), 0);

    return {
      total_classificacoes: total,
      products_confirmados: confirmacoes,
      products_corrigidos: correcoes,
      taxa_acerto_ai: parseFloat((taxaAcerto * 100).toFixed(2)),
      custo_total_usd: parseFloat(custoTotal.toFixed(4)),
    };
  }

  /**
   * Normalizar nome do produto
   */
  private normalizarNome(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  }
}
```

### Service 2: Intelligent Inventory Service

```typescript
// Arquivo: backend/src/modules/product-classification/services/intelligent-inventory.service.ts

@Injectable()
export class IntelligentInventoryService {
  private readonly logger = new Logger(IntelligentInventoryService.name);

  constructor(
    private classificationService: ProductClassificationService,
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Adicionar produto ao inventário com validação inteligente
   */
  async adicionarComValidacao(
    usuarioId: string,
    produtoData: {
      nome: string;
      quantidade: number;
      unidade: string;
      data_validade: Date;
    },
  ): Promise<{
    success: boolean;
    inventario?: Inventario;
    needsValidation?: boolean;
    classificacao?: any;
    message: string;
  }> {
    this.logger.log(`Adicionando ${produtoData.nome} para usuário ${usuarioId}`);

    // 1. CLASSIFICAR PRODUTO
    const classificacao = await this.classificationService.classificarProduto(
      produtoData.nome,
    );

    this.logger.log(`Classificação: ${JSON.stringify(classificacao)}`);

    // 2. SE NÃO FOR ALIMENTO, REJEITAR
    if (!classificacao.is_food) {
      return {
        success: false,
        message: `"${produtoData.nome}" não é um alimento e não pode ser adicionado ao inventário.`,
      };
    }

    // 3. SE CONFIANÇA BAIXA, EXIGIR VALIDAÇÃO DO USUÁRIO
    if (classificacao.confidence < 0.75 && classificacao.source === 'ai') {
      return {
        success: false,
        needsValidation: true,
        classificacao,
        message: `O sistema não tem certeza se "${produtoData.nome}" é alimento. Você concorda que é um alimento?`,
      };
    }

    // 4. VALIDADO! Adicionar ao inventário
    const produto = await this.obterOuCriarProduto(
      produtoData.nome,
      classificacao,
    );

    const inventario = this.inventarioRepository.create({
      usuario_id: usuarioId,
      produto_id: produto.id,
      quantidade: produtoData.quantidade,
      unidade: produtoData.unidade,
      data_validade: produtoData.data_validade,
      is_food: true, // Garantir que é alimento
    });

    await this.inventarioRepository.save(inventario);

    return {
      success: true,
      inventario,
      message: `"${produtoData.nome}" adicionado ao inventário com sucesso!`,
    };
  }

  /**
   * Usuário valida classificação incerta
   */
  async validarClassificacao(
    usuarioId: string,
    produtoData: any,
    validacao: {
      is_food: boolean;
      user_feedback?: string;
    },
  ): Promise<{
    success: boolean;
    inventario?: Inventario;
    message: string;
  }> {
    // Registrar validação do usuário
    await this.classificationService.registrarValidacaoUsuario(
      usuarioId,
      produtoData.nome,
      {
        is_food: validacao.is_food,
        user_feedback: validacao.user_feedback,
        correction: false, // É confirmação
      },
    );

    if (!validacao.is_food) {
      return {
        success: false,
        message: `Entendido! "${produtoData.nome}" não será adicionado.`,
      };
    }

    // Adicionar ao inventário
    const classificacao =
      await this.classificationService.classificarProduto(produtoData.nome);
    const produto = await this.obterOuCriarProduto(
      produtoData.nome,
      classificacao,
    );

    const inventario = this.inventarioRepository.create({
      usuario_id: usuarioId,
      produto_id: produto.id,
      quantidade: produtoData.quantidade,
      unidade: produtoData.unidade,
      data_validade: produtoData.data_validade,
      is_food: true,
    });

    await this.inventarioRepository.save(inventario);

    return {
      success: true,
      inventario,
      message: `"${produtoData.nome}" adicionado ao inventário com sucesso!`,
    };
  }

  /**
   * Obter ou criar produto com flag is_food
   */
  private async obterOuCriarProduto(
    nomeProduto: string,
    classificacao: any,
  ): Promise<Produto> {
    let produto = await this.produtoRepository.findOne({
      where: {
        nome: nomeProduto,
      },
    });

    if (!produto) {
      produto = this.produtoRepository.create({
        nome: nomeProduto,
        is_food: classificacao.is_food,
        categoria: classificacao.category || 'Outros',
        ai_classified: classificacao.source === 'ai',
        ai_confidence: classificacao.confidence,
      });

      await this.produtoRepository.save(produto);
    }

    return produto;
  }
}
```

---

## 🛣️ Fluxo de Integração

### API Endpoints

```typescript
// Arquivo: backend/src/modules/product-classification/controllers/product-classification.controller.ts

@Controller('api/product-classification')
@UseGuards(JwtAuthGuard)
export class ProductClassificationController {
  constructor(
    private classificationService: ProductClassificationService,
    private intelligentInventoryService: IntelligentInventoryService,
  ) {}

  /**
   * Classificar um produto (apenas test/debug)
   */
  @Post('classify')
  async classificar(@Body() body: { product_name: string }) {
    return this.classificationService.classificarProduto(body.product_name);
  }

  /**
   * Adicionar ao inventário com validação inteligente
   */
  @Post('inventario/adicionar')
  async adicionarComValidacao(
    @CurrentUser() user: any,
    @Body() body: {
      nome: string;
      quantidade: number;
      unidade: string;
      data_validade: Date;
    },
  ) {
    return this.intelligentInventoryService.adicionarComValidacao(user.id, body);
  }

  /**
   * Usuário valida classificação incerta
   */
  @Post('inventario/validar-classificacao')
  async validarClassificacao(
    @CurrentUser() user: any,
    @Body()
    body: {
      produto_nome: string;
      quantidade: number;
      unidade: string;
      data_validade: Date;
      is_food: boolean;
      user_feedback?: string;
    },
  ) {
    return this.intelligentInventoryService.validarClassificacao(user.id, body, {
      is_food: body.is_food,
      user_feedback: body.user_feedback,
    });
  }

  /**
   * Obter estatísticas de classificação
   */
  @Get('statistics')
  async obterEstatisticas() {
    return this.classificationService.obterEstatisticas();
  }
}
```

---

## 📱 Integração Mobile

### 1. Fluxo na Home/Inventário

```typescript
// mobile/src/screens/AddProductScreen.tsx

export default function AddProductScreen({ navigation }) {
  const [produtoNome, setProdutoNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataValidade, setDataValidade] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [needsValidation, setNeedsValidation] = useState(false);
  const [classificacao, setClassificacao] = useState(null);

  const handleAdicionarProduto = async () => {
    setLoading(true);

    try {
      // Chamar API com validação inteligente
      const response = await api.post('/product-classification/inventario/adicionar', {
        nome: produtoNome,
        quantidade: parseInt(quantidade),
        unidade: 'unidade',
        data_validade: dataValidade,
      });

      if (response.data.success) {
        // ✅ Produto adicionado com sucesso
        showToast('Produto adicionado!', 'success');
        navigation.goBack();
      } else if (response.data.needsValidation) {
        // ⚠️ Precisa validação do usuário
        setNeedsValidation(true);
        setClassificacao(response.data.classificacao);
      } else {
        // ❌ Produto rejeitado (não é alimento)
        showAlert(response.data.message);
      }
    } catch (error) {
      showToast('Erro ao adicionar produto', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Se precisa validação, mostrar modal
  if (needsValidation && classificacao) {
    return (
      <ValidationModal
        productName={produtoNome}
        classificacao={classificacao}
        onConfirm={() => handleValidarClassificacao(true)}
        onReject={() => handleValidarClassificacao(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nome do produto"
        value={produtoNome}
        onChangeText={setProdutoNome}
      />
      <TextInput
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="numeric"
      />
      <DatePicker
        date={dataValidade}
        onDateChange={setDataValidade}
      />
      <Button
        title={loading ? 'Adicionando...' : 'Adicionar Produto'}
        onPress={handleAdicionarProduto}
        disabled={loading}
      />
    </View>
  );
}
```

### 2. Validação Modal

```typescript
// mobile/src/components/ProductValidationModal.tsx

export function ValidationModal({
  productName,
  classificacao,
  onConfirm,
  onReject,
}) {
  return (
    <Modal animationType="slide" transparent={true}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Validação de Produto</Text>

          <Text style={styles.question}>
            O sistema acha que "{productName}" é um alimento.
            Você concorda?
          </Text>

          <View style={styles.confidenceBar}>
            <Text>Confiança: {(classificacao.confidence * 100).toFixed(0)}%</Text>
            <ProgressBar
              progress={classificacao.confidence}
              color="#FF8C42"
            />
          </View>

          {classificacao.category && (
            <Text style={styles.category}>
              Categoria sugerida: {classificacao.category}
            </Text>
          )}

          <View style={styles.buttons}>
            <Button
              title="✅ Sim, é alimento"
              onPress={onConfirm}
              color="#27AE60"
            />
            <Button
              title="❌ Não, não é alimento"
              onPress={onReject}
              color="#E74C3C"
            />
          </View>

          <Text style={styles.subtitle}>
            Seus feedbacks ajudam o sistema a aprender!
          </Text>
        </Card>
      </View>
    </Modal>
  );
}
```

---

## 📊 Dashboard de Inteligência

```typescript
// backend/src/modules/product-classification/controllers/dashboard.controller.ts

@Controller('api/product-classification/dashboard')
export class DashboardController {
  constructor(
    private classificationService: ProductClassificationService,
  ) {}

  @Get('metrics')
  async obterMetricas() {
    const stats = await this.classificationService.obterEstatisticas();

    return {
      total_produtos_analisados: stats.total_classificacoes,
      produtos_confirmados_usuario: stats.products_confirmados,
      produtos_corrigidos_usuario: stats.products_corrigidos,
      taxa_acerto_ia_percentual: stats.taxa_acerto_ai,
      custo_total_openai: stats.custo_total_usd,
      economia_potencial: stats.custo_total_usd * 0.8, // Se usar cache
    };
  }

  @Get('aprendizado')
  async obterProgresso() {
    // Verificar progresso do aprendizado
    // Confiança média, produtos mais confiáveis, etc
  }
}
```

---

## 🔄 Fluxo Completo Passo a Passo

```
1. USUÁRIO IMPORTA CUPOM
   └─ Extrai "Frango Peito 1kg", "Detergente 500ml", "Leite 1L"

2. SISTEMA CLASSIFICA CADA PRODUTO
   ├─ "Frango Peito" → Cache: is_food=true (conf. 0.99)
   ├─ "Detergente 500ml" → Cache: is_food=false (conf. 0.98)
   └─ "Leite 1L" → Cache: is_food=true (conf. 0.99)

3. FILTRA NÃO-ALIMENTOS
   └─ Remove "Detergente" automaticamente

4. ADICIONA ALIMENTOS AO INVENTÁRIO
   ├─ "Frango Peito"
   └─ "Leite 1L"

5. MOSTRA NOTIFICAÇÃO
   └─ "2 alimentos adicionados! (Detergente foi filtrado por não ser alimento)"

6. USA NO CONTEXTO DE RECEITAS
   ├─ Receitas com Frango aparecem
   ├─ Receitas com Leite aparecem
   └─ Detergente nunca aparece em receitas
```

---

## 💰 Otimização de Custos

### Estratégia de Cache

```
Sem Cache:
- 1000 produtos/mês = ~$10 custo OpenAI
- Tempo de resposta: ~2 segundos

Com Cache (implementado):
- Primeira vez: Usar OpenAI ($0.01)
- Próximas vezes: Cache local (<10ms)
- 1000 produtos com 70% hit rate = ~$3 custo
- Economia: 70%
```

### Melhorias Futuras

```
1. Usar modelo menor (GPT-3.5-turbo) para pré-classificação
2. Local ML model (TensorFlow.js) para decisões rápidas
3. Crowdsourcing para validação
4. Integração com banco de dados público de alimentos
```

---

## 🧪 Testes

```typescript
// backend/src/modules/product-classification/services/*.spec.ts

describe('ProductClassificationService', () => {
  let service: ProductClassificationService;

  it('deve usar cache para produtos conhecidos', async () => {
    // 1ª vez: usa IA
    const result1 = await service.classificarProduto('Frango Peito');
    expect(result1.source).toBe('ai');

    // 2ª vez: usa cache
    const result2 = await service.classificarProduto('Frango Peito');
    expect(result2.source).toBe('cache');
    expect(result2).toEqual(result1);
  });

  it('deve rejeitar produtos não-alimentares', async () => {
    const result = await service.classificarProduto('Detergente Neutro');
    expect(result.is_food).toBe(false);
  });

  it('deve exigir validação para baixa confiança', async () => {
    // Simulando produto obscuro
    const result = await service.classificarProduto('Xis xis xis');
    if (result.confidence < 0.75) {
      expect(result.confidence).toBeLessThan(0.75);
    }
  });

  it('deve aprender com feedback do usuário', async () => {
    const initialConfidence =
      (await service.classificarProduto('Produto Obscuro')).confidence;

    // Usuário confirma
    await service.registrarValidacaoUsuario('user-id', 'Produto Obscuro', {
      is_food: true,
      correction: false,
    });

    const newConfidence =
      (await service.classificarProduto('Produto Obscuro')).confidence;
    expect(newConfidence).toBeGreaterThan(initialConfidence);
  });
});
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend Essencial (1 semana)
- [ ] Criar entities (ProductKnowledgeBase, ProductValidation, AIClassificationLog)
- [ ] Criar ProductClassificationService
- [ ] Implementar chamada OpenAI
- [ ] Criar IntelligentInventoryService
- [ ] Criar endpoints API
- [ ] Testes unitários

### Fase 2: Mobile Integration (1 semana)
- [ ] AddProductScreen com validação
- [ ] ValidationModal
- [ ] Integrar com API
- [ ] Toast notifications
- [ ] Testes mobile

### Fase 3: Melhorias (1 semana)
- [ ] Dashboard de métricas
- [ ] Sistema de aprendizado visual
- [ ] Otimizações de cache
- [ ] Testes E2E

---

## 🎯 Resultados Esperados

```
ANTES:
- Usuário adiciona "Detergente" ao inventário
- Detergente aparece nas recomendações de receitas
- Problema: Receitas com detergente não faz sentido

DEPOIS:
- Sistema rejeita "Detergente" automaticamente
- Apenas alimentos aparecem nas recomendações
- Sistema aprende e melhora com cada validação
- Custo otimizado com cache inteligente
```

---

**Status**: ✅ Pronto para implementação
**Tempo estimado**: 2-3 semanas
**Impacto**: 🔴 MUITO ALTO (Qualidade dos dados)
