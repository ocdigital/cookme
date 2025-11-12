# CookMe - Arquitetura e Padrões de Design

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Princípios SOLID](#princípios-solid)
3. [Design Patterns Utilizados](#design-patterns-utilizados)
4. [Arquitetura Aplicada](#arquitetura-aplicada)
5. [Estrutura de Pastas](#estrutura-de-pastas)
6. [Padrões de Código](#padrões-de-código)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Exemplo Prático Completo](#exemplo-prático-completo)

---

## Visão Geral da Arquitetura

O CookMe utiliza uma **arquitetura em camadas (Layered Architecture)** com inspirações em **Clean Architecture** e **princípios SOLID**, executada em um monorepo com:

- **Backend**: NestJS + TypeORM (Node.js)
- **Mobile**: React Native + Expo
- **Banco de Dados**: PostgreSQL

### Diagrama de Arquitetura em Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    APRESENTAÇÃO (Mobile)                    │
│         React Native / Expo (TypeScript)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE CONTROLADORES                      │
│         NestJS Controllers + Decorators                     │
│     (Validação, Autenticação, Roteamento)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE SERVIÇOS                           │
│    NestJS Services (Lógica de Negócio)                      │
│  ├─ AffiliateService                                        │
│  ├─ RecommendationService                                   │
│  ├─ SubscriptionService                                     │
│  ├─ ReceitasService                                         │
│  ├─ InventarioService                                       │
│  └─ ... (outros serviços)                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE DADOS                              │
│         TypeORM Repositories + Entities                     │
│     (Persistência, Consultas, Mapeamento)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS                             │
│              PostgreSQL (Relacional)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Princípios SOLID

### 1. **S - Single Responsibility Principle** ✅

Cada classe tem **uma única responsabilidade**.

#### Exemplo: Affiliate Module

```typescript
// ❌ ERRADO - Múltiplas responsabilidades
export class AffiliateManager {
  registrarClique() { /* rastrear */ }
  enviarEmail() { /* enviar notificação */ }
  calcularComissao() { /* cálculo */ }
  gerarRelatorio() { /* relatório */ }
  salvarBD() { /* persistência */ }
}

// ✅ CORRETO - Uma responsabilidade por classe
export class AffiliateService {
  // Responsabilidade: Orquestrar lógica de afiliados
  registrarClique(linkId: string, usuarioId: string): Promise<AffiliateClick>
  registrarConversao(clickId: string, valor: number): Promise<AffiliateConversion>
}

export class ComissaoCalculadorService {
  // Responsabilidade: Calcular comissões
  calcularPercentual(valor: number, percentual: number): number
  calcularPorClique(linkId: string): Promise<number>
}

export class TransactionRepository {
  // Responsabilidade: Persistência de transações
  save(transaction: Transaction): Promise<Transaction>
  findByUsuario(usuarioId: string): Promise<Transaction[]>
}
```

### 2. **O - Open/Closed Principle** ✅

Aberto para **extensão**, fechado para **modificação**.

#### Exemplo: Subscription Plans

```typescript
// ✅ Extensível via enums e configurações
export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium',
  PREMIUM_PLUS = 'premium_plus',
  // Para adicionar novo plano, apenas:
  // ENTERPRISE = 'enterprise'
}

const PLAN_FEATURES = {
  [SubscriptionPlan.FREE]: ['receitas_basicas', 'inventario'],
  [SubscriptionPlan.PREMIUM]: [..., 'videos_hd'],
  [SubscriptionPlan.PREMIUM_PLUS]: [..., 'consultoria'],
  // Novo plano: ENTERPRISE
};

const PLAN_PRICES = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PREMIUM]: 9.90,
  [SubscriptionPlan.PREMIUM_PLUS]: 19.90,
};

// ✅ Sem modificar a classe, apenas extend config
export class SubscriptionService {
  async verificarAcesso(usuarioId: string, feature: string): Promise<boolean> {
    const subscription = await this.obterStatusAssinatura(usuarioId);
    const featuresPermitidas = PLAN_FEATURES[subscription.plano];
    return featuresPermitidas.includes(feature);
  }
}
```

### 3. **L - Liskov Substitution Principle** ✅

Subclasses podem substituir suas **superclasses sem quebrar** a aplicação.

#### Exemplo: Entity Base Class

```typescript
// Classe base que pode ser substituída
@Entity()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}

// ✅ Pode ser substituída sem quebrar contrato
export class AffiliateLink extends BaseEntity {
  @Column() supermarket_name: string;
  @Column() affiliate_url: string;
}

export class Subscription extends BaseEntity {
  @Column() usuario_id: string;
  @Column() plano: string;
}

// ✅ Código que trabalha com BaseEntity funciona com qualquer subclasse
export class AuditService {
  async salvarAlteracao(entity: BaseEntity): Promise<void> {
    // Funciona com AffiliateLink, Subscription, ou qualquer entidade
    await this.logRepository.save({
      entityId: entity.id,
      timestamp: entity.atualizado_em,
    });
  }
}
```

### 4. **I - Interface Segregation Principle** ✅

Interfaces **específicas e pequenas** ao invés de genéricas.

#### Exemplo: Service Contracts

```typescript
// ❌ ERRADO - Interface muito grande
interface IService {
  create(): Promise<any>;
  read(): Promise<any>;
  update(): Promise<any>;
  delete(): Promise<any>;
  search(): Promise<any>;
  export(): Promise<any>;
  import(): Promise<any>;
  // ... 10 outros métodos
}

// ✅ CORRETO - Interfaces segregadas
interface ICreatable<T> {
  create(data: Partial<T>): Promise<T>;
}

interface IReadable<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
}

interface IUpdatable<T> {
  update(id: string, data: Partial<T>): Promise<T>;
}

interface IDeletable {
  delete(id: string): Promise<void>;
}

// Apenas implementa o que precisa
export class AffiliateService
  implements ICreatable<AffiliateLink>, IReadable<AffiliateLink> {

  async create(data: Partial<AffiliateLink>): Promise<AffiliateLink> {
    // implementação
  }

  async findById(id: string): Promise<AffiliateLink> {
    // implementação
  }
}
```

### 5. **D - Dependency Inversion Principle** ✅

Dependa de **abstrações**, não de **implementações concretas**.

#### Exemplo: Injeção de Dependência

```typescript
// ✅ NestJS Dependency Injection
export class RecommendationService {
  constructor(
    // Injetar repositórios (abstrações)
    @InjectRepository(RecipeRecommendation)
    private recommendationRepository: Repository<RecipeRecommendation>,

    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
  ) {}

  async obterRecomendacoes(usuarioId: string) {
    // Usa abstrações (Repository pattern)
    const recomendacoes = await this.recommendationRepository.find({
      where: { usuario_id: usuarioId },
    });
    return recomendacoes;
  }
}

// ✅ Module que provê as dependências
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecipeRecommendation,
      AffiliateLink,
    ]),
  ],
  providers: [RecommendationService],
})
export class AffiliateModule {}
```

---

## Design Patterns Utilizados

### 1. **Repository Pattern** ✅

Abstração da camada de dados.

```typescript
// TypeORM já fornece Repository pattern
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
  ) {}

  // Repository encapsula queries
  async buscarLinksReceita(receitaId: string): Promise<AffiliateLink[]> {
    return this.affiliateLinkRepository.find({
      where: {
        receita_id: receitaId,
        is_active: true,
      },
      order: { comissao_percentual: 'DESC' },
    });
  }
}
```

### 2. **Service Layer Pattern** ✅

Concentra lógica de negócio em serviços reutilizáveis.

```typescript
// Serviço = Lógica de negócio pura
export class SubscriptionService {
  constructor(
    private subscriptionRepository: Repository<Subscription>,
    private transactionRepository: Repository<Transaction>,
  ) {}

  // Lógica: criar assinatura + registrar transação
  async criarAssinatura(
    usuarioId: string,
    plano: SubscriptionPlan,
  ): Promise<Subscription> {
    // 1. Validar se já existe assinatura
    // 2. Criar assinatura
    // 3. Registrar transação
    // 4. Retornar resultado
  }
}

// Controller apenas orquestra
export class AffiliateController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post('subscriptions/criar')
  async criarAssinatura(@Body() body: any) {
    // Apenas chama serviço
    return this.subscriptionService.criarAssinatura(
      user.id,
      body.plano,
    );
  }
}
```

### 3. **Dependency Injection Pattern** ✅

NestJS fornece DI nativa via decoradores.

```typescript
// ✅ Exemplo de DI em ação
@Injectable() // Marca como providência
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,

    @InjectRepository(AffiliateClick)
    private affiliateClickRepository: Repository<AffiliateClick>,
  ) {} // Dependências injetadas automaticamente
}

// No módulo
@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateLink, AffiliateClick]),
  ],
  providers: [AffiliateService], // NestJS cria instância e injeta
  controllers: [AffiliateController],
})
export class AffiliateModule {}
```

### 4. **Factory Pattern** ✅

Criação de objetos complexos de forma padronizada.

```typescript
// TypeORM + Entities atuam como Factory
@Entity('affiliate_links')
export class AffiliateLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() supermarket_name: string;
  @Column() affiliate_url: string;
  @Column() comissao_percentual: number;
}

// Repository atua como Factory
export class AffiliateService {
  async criarLink(data: CreateAffiliateLinkDto): Promise<AffiliateLink> {
    // Factory: cria entidade com valores padrão
    const link = this.affiliateLinkRepository.create({
      ...data,
      is_active: true, // Padrão
      created_at: new Date(), // Padrão
    });

    return this.affiliateLinkRepository.save(link);
  }
}
```

### 5. **Decorator Pattern** ✅

Adiciona funcionalidades dinamicamente via decoradores.

```typescript
// NestJS usa decoradores extensivamente
@Controller('api/affiliate')
@UseGuards(JwtAuthGuard) // Decorador de autenticação
export class AffiliateController {

  @Post('registrar-clique')
  @HttpCode(HttpStatus.CREATED) // Decorador de status
  @UseGuards(JwtAuthGuard) // Decorador de guarda
  async registrarClique(
    @CurrentUser() user: any, // Decorador custom
    @Body() body: any, // Decorador de validação
  ) {
    // ...
  }
}

// Decorador custom
export function CurrentUser() {
  return createParamDecorator((data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  })();
}
```

### 6. **Observer Pattern** ✅

Através de eventos (Webhooks, Message Queues).

```typescript
// Exemplo: Stripe Webhook como Observer
@Controller('api/affiliate')
export class AffiliateController {
  constructor(
    private subscriptionService: SubscriptionService,
  ) {}

  @Post('webhooks/stripe')
  @Public() // Público (sem auth)
  async handleStripeWebhook(@Body() event: any) {
    // Observer: escuta eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        await this.subscriptionService.processarCheckout(event);
        break;

      case 'invoice.payment_succeeded':
        await this.subscriptionService.processarRenovacao(event);
        break;
    }
  }
}
```

### 7. **Strategy Pattern** ✅

Diferentes estratégias de cálculo/comportamento.

```typescript
// Interface para estratégia
interface RecommendationStrategy {
  obterRecomendacoes(usuarioId: string): Promise<any[]>;
}

// Estratégia 1: Com alimentos que tem
export class ComAlimentosStrategy implements RecommendationStrategy {
  async obterRecomendacoes(usuarioId: string) {
    // Busca receitas com 85%+ dos ingredientes
  }
}

// Estratégia 2: Incentivar compra
export class IncentivCompraStrategy implements RecommendationStrategy {
  async obterRecomendacoes(usuarioId: string) {
    // Busca receitas com 1-2 ingredientes faltantes
  }
}

// Contexto usa estratégia
export class RecommendationService {
  private comAlimentosStrategy = new ComAlimentosStrategy();
  private incentivCompraStrategy = new IncentivCompraStrategy();

  async obterRecomendacoes(usuarioId: string, tipo: 'com' | 'incentivar') {
    const strategy = tipo === 'com'
      ? this.comAlimentosStrategy
      : this.incentivCompraStrategy;

    return strategy.obterRecomendacoes(usuarioId);
  }
}
```

---

## Arquitetura Aplicada

### **Layered Architecture (Arquitetura em Camadas)**

A aplicação segue o padrão de **4 camadas principais**:

```
┌──────────────────────────────────────┐
│      PRESENTATION LAYER              │
│  (Controllers, DTOs, Validação)      │
└──────────────────────────────────────┘
              ▼
┌──────────────────────────────────────┐
│      APPLICATION LAYER               │
│  (Services, Business Logic)          │
└──────────────────────────────────────┘
              ▼
┌──────────────────────────────────────┐
│      DOMAIN LAYER                    │
│  (Entities, Value Objects)           │
└──────────────────────────────────────┘
              ▼
┌──────────────────────────────────────┐
│      INFRASTRUCTURE LAYER            │
│  (Repositories, DB, ORM)             │
└──────────────────────────────────────┘
```

#### 1. **PRESENTATION LAYER**

```typescript
// Controllers - Entrada de requisições
@Controller('api/affiliate')
export class AffiliateController {
  constructor(
    private affiliateService: AffiliateService,
  ) {}

  @Post('registrar-clique')
  async registrarClique(
    @CurrentUser() user: any,
    @Body() body: RegistrarCliqueDto, // DTO com validação
  ) {
    // Apenas orquestra chamada ao serviço
    return this.affiliateService.registrarClique(
      body.affiliate_link_id,
      user.id,
      body.receita_id,
    );
  }
}

// DTOs - Data Transfer Objects (Validação)
export class RegistrarCliqueDto {
  @IsUUID()
  @IsNotEmpty()
  affiliate_link_id: string;

  @IsUUID()
  receita_id: string;

  @IsObject()
  @IsOptional()
  device_info?: Record<string, any>;
}
```

#### 2. **APPLICATION LAYER**

```typescript
// Services - Lógica de negócio
@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,

    @InjectRepository(AffiliateClick)
    private affiliateClickRepository: Repository<AffiliateClick>,
  ) {}

  async registrarClique(
    linkId: string,
    usuarioId: string,
    receitaId: string,
  ): Promise<AffiliateClick> {
    // 1. Validar link existe
    const link = await this.affiliateLinkRepository.findOne({
      where: { id: linkId, is_active: true },
    });

    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    // 2. Criar registro de clique
    const click = this.affiliateClickRepository.create({
      affiliate_link_id: linkId,
      usuario_id: usuarioId,
      receita_id: receitaId,
      clicked_at: new Date(),
    });

    // 3. Persistir via repositório
    return this.affiliateClickRepository.save(click);
  }
}
```

#### 3. **DOMAIN LAYER**

```typescript
// Entities - Modelos de domínio
@Entity('affiliate_links')
export class AffiliateLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  receita_id: string;

  @ManyToOne(() => Receita, (receita) => receita.affiliate_links)
  receita: Receita;

  @Column()
  supermarket_name: string;

  @Column('text')
  affiliate_url: string;

  @Column('decimal', { precision: 5, scale: 2 })
  comissao_percentual: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relacionamento
  @OneToMany(() => AffiliateClick, (click) => click.affiliate_link)
  clicks: AffiliateClick[];
}
```

#### 4. **INFRASTRUCTURE LAYER**

```typescript
// TypeORM fornece os Repositories
// Não precisa escrever SQL manualmente
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
  ) {}

  // Repository abstrai as queries
  async buscarLinksAtivos(): Promise<AffiliateLink[]> {
    return this.affiliateLinkRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }
}
```

---

## Estrutura de Pastas

```
backend/
│
├── src/
│   ├── common/                          # Utilitários comuns
│   │   ├── decorators/                  # Decoradores customizados
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/                      # Guards de autenticação/autorização
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── enums/                       # Enums compartilhados
│   │       ├── user-role.enum.ts
│   │       ├── dificuldade-receita.enum.ts
│   │       └── unidade-medida.enum.ts
│   │
│   ├── config/                          # Configurações da app
│   │   ├── database.config.ts           # Config do TypeORM
│   │   ├── jwt.config.ts                # Config do JWT
│   │   └── app.config.ts                # Config geral
│   │
│   ├── modules/                         # Feature modules
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts       # (Presentation)
│   │   │   ├── auth.service.ts          # (Application)
│   │   │   ├── entities/
│   │   │   │   └── usuario.entity.ts    # (Domain)
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── affiliate/                   # NOVO - Módulo de Monetização
│   │   │   ├── affiliate.controller.ts  # (Presentation)
│   │   │   ├── affiliate.module.ts
│   │   │   ├── services/
│   │   │   │   ├── affiliate.service.ts         # (Application)
│   │   │   │   ├── recommendation.service.ts    # (Application)
│   │   │   │   └── subscription.service.ts      # (Application)
│   │   │   └── entities/                        # (Domain)
│   │   │       ├── affiliate-link.entity.ts
│   │   │       ├── affiliate-click.entity.ts
│   │   │       ├── affiliate-conversion.entity.ts
│   │   │       ├── recipe-recommendation.entity.ts
│   │   │       ├── subscription.entity.ts
│   │   │       └── transaction.entity.ts
│   │   │
│   │   ├── receitas/
│   │   │   ├── receitas.controller.ts
│   │   │   ├── receitas.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── receita.entity.ts
│   │   │   │   ├── receita-ingrediente.entity.ts
│   │   │   │   └── receita-executada.entity.ts
│   │   │   └── receitas.module.ts
│   │   │
│   │   ├── inventario/
│   │   │   ├── inventario.controller.ts
│   │   │   ├── inventario.service.ts
│   │   │   ├── entities/
│   │   │   │   └── inventario.entity.ts
│   │   │   └── inventario.module.ts
│   │   │
│   │   ├── usuarios/
│   │   ├── produtos/
│   │   ├── compras/
│   │   ├── barcode/
│   │   └── scraper/
│   │
│   ├── app.module.ts                    # Módulo raiz
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts                          # Entry point
│
└── package.json
```

---

## Padrões de Código

### 1. **Error Handling Padronizado**

```typescript
// ✅ Usar exceções do NestJS
export class AffiliateService {
  async buscarLink(linkId: string): Promise<AffiliateLink> {
    const link = await this.affiliateLinkRepository.findOne({
      where: { id: linkId },
    });

    if (!link) {
      // Use HttpException ou especialização
      throw new NotFoundException(`Link ${linkId} não encontrado`);
    }

    if (!link.is_active) {
      // BadRequestException para validação
      throw new BadRequestException('Link está inativo');
    }

    return link;
  }
}
```

### 2. **DTOs para Validação**

```typescript
// ✅ Sempre usar DTOs
import { IsUUID, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  usuario_id: string;

  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plano: SubscriptionPlan;

  @IsOptional()
  stripe_customer_id?: string;
}

// No controller
@Post('subscriptions/criar')
async criar(@Body() dto: CreateSubscriptionDto) {
  // Automaticamente validado e tipado
  return this.subscriptionService.criarAssinatura(
    dto.usuario_id,
    dto.plano,
  );
}
```

### 3. **Transações Atômicas**

```typescript
// ✅ Usar transações para operações críticas
export class SubscriptionService {
  async criarAssinatura(
    usuarioId: string,
    plano: SubscriptionPlan,
  ): Promise<Subscription> {
    // Usa transaction implícita do TypeORM
    const subscription = this.subscriptionRepository.create({
      usuario_id: usuarioId,
      plano,
      status: SubscriptionStatus.ACTIVE,
    });

    const saved = await this.subscriptionRepository.save(subscription);

    // Registra transação no mesmo contexto
    await this.criarTransacao(
      usuarioId,
      PLAN_PRICES[plano],
      TransactionType.SUBSCRIPTION_PAYMENT,
    );

    return saved;
  }
}
```

### 4. **Logging Estruturado**

```typescript
// ✅ Usar Logger do NestJS
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  async registrarClique(linkId: string, usuarioId: string) {
    this.logger.log(`Clique registrado: ${linkId} por ${usuarioId}`);

    try {
      const click = await this.affiliateClickRepository.create({
        affiliate_link_id: linkId,
        usuario_id: usuarioId,
      });

      this.logger.debug(`Click criado com sucesso: ${click.id}`);
      return click;
    } catch (error) {
      this.logger.error(
        `Erro ao registrar clique: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

---

## Fluxo de Dados

### Exemplo: Registrar Clique em Affiliate Link

```
┌─────────────────────────────────────────────────────────────┐
│  1. REQUISIÇÃO HTTP                                         │
│  POST /api/affiliate/registrar-clique                       │
│  Body: {                                                    │
│    affiliate_link_id: "uuid",                               │
│    receita_id: "uuid",                                      │
│    device_info: { platform: "iOS", ... }                    │
│  }                                                          │
│  Header: Authorization: Bearer <token>                      │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  2. PRESENTATION LAYER                                       │
│  AffiliateController.registrarClique()                       │
│  - JWT Guard valida token → extrai usuarioId                │
│  - DTO valida campos                                         │
│  - CurrentUser() extrai user do contexto                     │
└────────────────┬─────────────────────────────────────────────┘
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  3. APPLICATION LAYER                                        │
│  AffiliateService.registrarClique()                          │
│  - Valida se link existe e está ativo                        │
│  - Cria objeto AffiliateClick                                │
│  - Se tem comissão_por_clique, chama                         │
│    criarTransacao() para registrar comissão                  │
└────────────────┬─────────────────────────────────────────────┘
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  4. DOMAIN LAYER                                             │
│  AffiliateClick Entity                                       │
│  - id: UUID gerado                                           │
│  - affiliate_link_id: linkId                                 │
│  - usuario_id: userId                                        │
│  - receita_id: receitaId                                     │
│  - clicked_at: now()                                         │
│  - device_info: { platform, ... }                            │
└────────────────┬─────────────────────────────────────────────┘
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  5. INFRASTRUCTURE LAYER                                     │
│  Repository.save(affiliateClick)                             │
│  - TypeORM mapeia entity para SQL                            │
│  - INSERT INTO affiliate_clicks (...)                        │
│  - Retorna entidade persistida com ID                        │
└────────────────┬─────────────────────────────────────────────┘
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  6. DATABASE LAYER                                           │
│  PostgreSQL                                                  │
│  affiliate_clicks table                                      │
│  - Retorna: { id, affiliate_link_id, usuario_id, ... }      │
└────────────────┬─────────────────────────────────────────────┘
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  7. RESPOSTA HTTP                                            │
│  Status: 201 Created                                         │
│  Body: {                                                    │
│    id: "uuid",                                               │
│    affiliate_link_id: "uuid",                                │
│    usuario_id: "uuid",                                       │
│    receita_id: "uuid",                                       │
│    clicked_at: "2025-11-11T...",                             │
│    device_info: { ... }                                      │
│  }                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Exemplo Prático Completo

### Caso de Uso: Criar e Validar Assinatura Premium

#### 1. **Apresentação - Controller**

```typescript
@Controller('api/affiliate')
@ApiBearerAuth()
export class AffiliateController {
  constructor(
    private subscriptionService: SubscriptionService,
  ) {}

  @Post('subscriptions/criar')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar nova assinatura' })
  async criarAssinatura(
    @CurrentUser() user: any,
    @Body() body: CreateSubscriptionDto,
  ): Promise<Subscription> {
    // Validação automática do DTO
    // JWT Guard valida autenticação
    // CurrentUser() extrai usuário

    return this.subscriptionService.criarAssinatura(
      user.id,
      body.plano,
    );
  }

  @Get('subscriptions/features/:feature')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verificar acesso a feature' })
  async verificarAcesso(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
  ) {
    const temAcesso = await this.subscriptionService.verificarAcesso(
      user.id,
      feature,
    );

    return { feature, temAcesso };
  }
}
```

#### 2. **DTO com Validação**

```typescript
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    enum: ['free', 'premium', 'premium_plus'],
    description: 'Plano de assinatura',
  })
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plano: SubscriptionPlan;
}
```

#### 3. **Aplicação - Service**

```typescript
@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async criarAssinatura(
    usuarioId: string,
    plano: SubscriptionPlan,
  ): Promise<Subscription> {
    // 1. VALIDAR
    const assinaturaExistente = await this.subscriptionRepository.findOne({
      where: {
        usuario_id: usuarioId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (assinaturaExistente) {
      this.logger.warn(
        `Usuário ${usuarioId} já possui assinatura ativa`,
      );
      throw new BadRequestException(
        'Usuário já possui assinatura ativa',
      );
    }

    // 2. CRIAR
    const dataProximoPagamento = this.calcularProximaData(new Date());

    const subscription = this.subscriptionRepository.create({
      usuario_id: usuarioId,
      plano,
      preco_mensal: PLAN_PRICES[plano],
      data_inicio: new Date(),
      data_proximo_pagamento: dataProximoPagamento,
      status: SubscriptionStatus.ACTIVE,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(`Assinatura criada: ${saved.id}`);

    // 3. REGISTRAR TRANSAÇÃO
    if (plano !== SubscriptionPlan.FREE) {
      await this.registrarTransacao(
        usuarioId,
        PLAN_PRICES[plano],
        `Assinatura ${plano}`,
        TransactionType.SUBSCRIPTION_PAYMENT,
        { subscription_id: saved.id },
      );
    }

    return saved;
  }

  async verificarAcesso(
    usuarioId: string,
    feature: string,
  ): Promise<boolean> {
    // 1. OBTER ASSINATURA
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        usuario_id: usuarioId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const plano = subscription?.plano || SubscriptionPlan.FREE;

    // 2. VERIFICAR FEATURE
    const featuresPermitidas = PLAN_FEATURES[plano];
    return featuresPermitidas.includes(feature);
  }

  private async registrarTransacao(
    usuarioId: string,
    valor: number,
    descricao: string,
    tipo: TransactionType,
    metadata?: any,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      usuario_id: usuarioId,
      tipo,
      valor,
      descricao,
      status: TransactionStatus.COMPLETED,
      metadata,
      processed_at: new Date(),
    });

    return this.transactionRepository.save(transaction);
  }

  private calcularProximaData(data: Date): Date {
    const proxima = new Date(data);
    proxima.setMonth(proxima.getMonth() + 1);
    return proxima;
  }
}
```

#### 4. **Domínio - Entities**

```typescript
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @ManyToOne(() => Usuario, {
    eager: false,
    onDelete: 'CASCADE',
  })
  usuario: Usuario;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plano: SubscriptionPlan;

  @Column('decimal', { precision: 10, scale: 2 })
  preco_mensal: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @CreateDateColumn()
  data_inicio: Date;

  @Column('timestamp')
  data_proximo_pagamento: Date;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @Column('enum', { enum: TransactionType })
  tipo: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column('enum', { enum: TransactionStatus })
  status: TransactionStatus;

  @CreateDateColumn()
  created_at: Date;
}
```

#### 5. **Infraestrutura - Module**

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Transaction,
      Usuario,
    ]),
  ],
  providers: [SubscriptionService, AffiliateService],
  controllers: [AffiliateController],
  exports: [SubscriptionService],
})
export class AffiliateModule {}
```

---

## Resumo Arquitetural

| Aspecto | Implementação |
|---------|---------------|
| **Arquitetura Principal** | Layered Architecture + Clean Architecture |
| **Princípios** | SOLID (todos os 5) |
| **Padrões de Design** | Repository, Service Layer, DI, Decorator, Factory, Observer, Strategy |
| **Framework** | NestJS (estruturalmente pronto para DDD) |
| **ORM** | TypeORM (implementa Repository Pattern) |
| **Validação** | class-validator + DTOs |
| **Autenticação** | JWT + Guards customizados |
| **Tratamento de Erros** | Exceções tipadas do NestJS |
| **Banco de Dados** | PostgreSQL + Migrations |
| **Documentação API** | Swagger/OpenAPI |
| **Testing** | Pronto para Jest (testes unitários) |

---

## Próximos Passos Recomendados

1. **Testes Unitários**: Implementar testes para serviços
2. **Testes de Integração**: Testar fluxo completo controller → BD
3. **E2E Tests**: Testar endpoints via HTTP
4. **DDD (Domain-Driven Design)**: Implementar se domínio crescer
5. **Event Sourcing**: Se necessário auditar todas as mudanças
6. **CQRS**: Se leitura e escrita precisarem escalar separadamente

---

**Documentação criada em**: 11 de Novembro de 2025
**Versão**: 1.0
**Status**: ✅ Completo
