# CookMe Backend - Arquitetura

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                  (React Native / React Web)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS (REST)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS BACKEND                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Controllers                             │  │
│  │  (Auth, Usuarios, Produtos, Compras, Inventario, etc.)   │  │
│  └─────────────────────┬─────────────────────────────────────┘  │
│                        │                                          │
│  ┌─────────────────────▼─────────────────────────────────────┐  │
│  │                   Guards & Middleware                      │  │
│  │              (JWT Auth, Validation, Logging)               │  │
│  └─────────────────────┬─────────────────────────────────────┘  │
│                        │                                          │
│  ┌─────────────────────▼─────────────────────────────────────┐  │
│  │                     Services                               │  │
│  │           (Business Logic + Motor MOI)                     │  │
│  └─────────────────────┬─────────────────────────────────────┘  │
│                        │                                          │
│  ┌─────────────────────▼─────────────────────────────────────┐  │
│  │                  Repositories                              │  │
│  │                   (TypeORM)                                │  │
│  └─────────────────────┬─────────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │PostgreSQL│    │  Redis   │    │ External │
  │    DB    │    │  Cache   │    │   APIs   │
  └──────────┘    └──────────┘    └──────────┘
                                   (Open Food Facts)
```

---

## Fluxo de Autenticação

```
┌────────┐                                               ┌────────┐
│ Client │                                               │Backend │
└───┬────┘                                               └───┬────┘
    │                                                        │
    │  POST /api/auth/register                              │
    │  {email, senha, nome}                                 │
    ├──────────────────────────────────────────────────────▶│
    │                                                        │
    │                                    Hash senha (bcrypt)│
    │                                    Salvar no DB       │
    │                                    Gerar JWT tokens   │
    │                                                        │
    │  200 OK                                                │
    │  {access_token, refresh_token, user}                  │
    │◀──────────────────────────────────────────────────────┤
    │                                                        │
    │  POST /api/produtos                                    │
    │  Authorization: Bearer {access_token}                 │
    ├──────────────────────────────────────────────────────▶│
    │                                                        │
    │                                    Validar JWT        │
    │                                    Extrair user_id    │
    │                                    Processar request  │
    │                                                        │
    │  201 Created {produto}                                 │
    │◀──────────────────────────────────────────────────────┤
    │                                                        │
    │  (após 15min, access_token expira)                    │
    │                                                        │
    │  POST /api/auth/refresh                                │
    │  {refresh_token}                                       │
    ├──────────────────────────────────────────────────────▶│
    │                                                        │
    │                                    Validar refresh    │
    │                                    Gerar novo access  │
    │                                                        │
    │  200 OK                                                │
    │  {access_token, refresh_token}                        │
    │◀──────────────────────────────────────────────────────┤
```

---

## Fluxo do Motor MOI (Sugestões de Receitas)

```
┌───────────────────────────────────────────────────────────────┐
│                     GET /api/receitas/sugestoes               │
│                     Authorization: Bearer {token}             │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ReceitasService  │
                    │  sugerirReceitas()│
                    └─────────┬────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
  ┌───────────────┐  ┌────────────────┐  ┌──────────────┐
  │ Buscar TODAS  │  │ Buscar TODO    │  │   Buscar     │
  │  as Receitas  │  │  Inventário    │  │ Preferências │
  │               │  │   do Usuário   │  │  do Usuário  │
  └───────┬───────┘  └────────┬───────┘  └──────┬───────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Para cada       │
                    │  Receita:        │
                    └─────────┬────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Calcular │  │ Validar  │  │Priorizar │
        │% Ingredi-│  │Restrições│  │ Itens    │
        │  entes   │  │Alimenta- │  │Vencendo  │
        │Disponí-  │  │   res    │  │          │
        │  veis    │  │          │  │          │
        └─────┬────┘  └─────┬────┘  └─────┬────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Calcular SCORE: │
                  │  - Disponibilidade│
                  │  - Urgência       │
                  │  - Compatibilidade│
                  └─────────┬────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │   Ordenar por    │
                  │      Score       │
                  └─────────┬────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Retornar Top N   │
                  │    Receitas      │
                  └──────────────────┘
```

**Algoritmo de Score:**
```
score = (% ingredientes disponíveis) * 10
      + (urgência de validade) * 5
      + (compatibilidade com dieta) * 3
      - (ingredientes faltando) * 2

Onde:
- urgência = 10 se < 3 dias, 5 se < 7 dias, 0 caso contrário
- compatibilidade = 1 se 100% compatível, 0 se incompatível
```

---

## Fluxo de Compra → Inventário

```
┌────────┐
│ Client │
└───┬────┘
    │
    │  POST /api/compras
    │  {
    │    data_compra, local_compra, valor_total,
    │    itens: [
    │      {produto_id, quantidade, preco, validade}
    │    ]
    │  }
    ├─────────────────────────────▶
    │                              │
    │                              ▼
    │                    ┌──────────────────┐
    │                    │ ComprasService   │
    │                    │   create()       │
    │                    └────────┬─────────┘
    │                             │
    │         ┌───────────────────┼───────────────────┐
    │         │                   │                   │
    │         ▼                   ▼                   ▼
    │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  │   Salvar    │   │   Salvar    │   │  Atualizar  │
    │  │   Compra    │   │CompraItens  │   │ Inventário  │
    │  │             │   │             │   │             │
    │  │(transação)  │   │(transação)  │   │(transação)  │
    │  └─────────────┘   └─────────────┘   └─────────────┘
    │         │                   │                   │
    │         └───────────────────┼───────────────────┘
    │                             │
    │                             ▼
    │                    ┌──────────────────┐
    │                    │  Retornar Compra │
    │                    │   Completa       │
    │                    └────────┬─────────┘
    │                             │
    │  201 Created                │
    │  {compra: {...}}            │
    │◀────────────────────────────┤
```

**Regras de Negócio:**
1. Compra e itens salvos em uma única transação
2. Para cada item da compra:
   - Verificar se produto existe no inventário do usuário
   - Se existe E tem mesma validade: somar quantidade
   - Se não existe OU validade diferente: criar novo item
3. Link de rastreabilidade: `inventario.compra_item_id → compra_item.id`

---

## Modelo de Dados (ER Simplificado)

```
┌──────────────┐         ┌──────────────┐
│   usuarios   │◀───┐    │ preferencias │
├──────────────┤    │    ├──────────────┤
│ id (PK)      │    └────│ usuario_id   │
│ email        │         │ notificacoes │
│ senha        │         │ dias_alerta  │
│ nome         │         │ restricoes[] │
└──────┬───────┘         └──────────────┘
       │
       │ 1:N
       │
       ├─────────────────────┬─────────────────────┬────────────
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   compras    │      │  inventario  │     │receitas_exec │
├──────────────┤      ├──────────────┤     ├──────────────┤
│ id (PK)      │      │ id (PK)      │     │ id (PK)      │
│ usuario_id   │      │ usuario_id   │     │ usuario_id   │
│ data_compra  │      │ produto_id   │     │ receita_id   │
│ local        │      │ quantidade   │     │ avaliacao    │
└──────┬───────┘      │ data_validade│     └──────────────┘
       │              └──────┬───────┘
       │ 1:N                 │ N:1
       │                     │
       ▼                     │
┌──────────────┐             │
│compras_itens │             │
├──────────────┤             │
│ id (PK)      │             │
│ compra_id    │             │
│ produto_id   ├─────────────┘
│ quantidade   │             │
│ preco_unit.  │             │
│ validade     │             │
└──────┬───────┘             │
       │                     │
       │                     │
       └─────────────────────┴──────────┐
                                        │
                                        │ N:1
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │   produtos   │
                                 ├──────────────┤
                                 │ id (PK)      │
                                 │ nome         │
                                 │ codigo_barras│
                                 │ marca_id     │
                                 │ categoria_id │
                                 └──────┬───────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
                 ▼                      ▼                      ▼
          ┌──────────────┐       ┌──────────────┐      ┌──────────────┐
          │    marcas    │       │  categorias  │      │   receitas   │
          ├──────────────┤       ├──────────────┤      ├──────────────┤
          │ id (PK)      │       │ id (PK)      │      │ id (PK)      │
          │ nome         │       │ nome         │      │ nome         │
          └──────────────┘       │ icone        │      │ modo_preparo │
                                 │ pai_id       │      │ dificuldade  │
                                 └──────────────┘      └──────┬───────┘
                                                              │
                                                              │ 1:N
                                                              │
                                                              ▼
                                                       ┌──────────────┐
                                                       │  receitas_   │
                                                       │ ingredientes │
                                                       ├──────────────┤
                                                       │ id (PK)      │
                                                       │ receita_id   │
                                                       │ produto_id   │
                                                       │ quantidade   │
                                                       │ unidade      │
                                                       │ opcional     │
                                                       └──────────────┘
```

---

## Camadas da Aplicação

### 1. Controllers (Presentation Layer)
**Responsabilidade:** Receber requests HTTP, validar entrada básica, chamar services, retornar responses

**Exemplo:**
```typescript
@Controller('produtos')
export class ProdutosController {
  @Post()
  async create(@Body() dto: CreateProdutoDto) {
    return this.produtosService.create(dto);
  }
}
```

### 2. Services (Business Logic Layer)
**Responsabilidade:** Lógica de negócio, orquestração, validações complexas

**Exemplo:**
```typescript
@Injectable()
export class ReceitasService {
  async sugerirReceitas(usuarioId: string): Promise<Receita[]> {
    // 1. Buscar inventário do usuário
    // 2. Buscar todas as receitas
    // 3. Calcular score de compatibilidade
    // 4. Ordenar e retornar top N
  }
}
```

### 3. Repositories (Data Access Layer)
**Responsabilidade:** Acesso ao banco de dados via TypeORM

**Exemplo:**
```typescript
@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private inventarioRepo: Repository<Inventario>
  ) {}

  async findAll(usuarioId: string) {
    return this.inventarioRepo.find({
      where: { usuario_id: usuarioId },
      order: { data_validade: 'ASC' }
    });
  }
}
```

### 4. Entities (Domain Layer)
**Responsabilidade:** Representar modelos de domínio, validações, relações

**Exemplo:**
```typescript
@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @ManyToOne(() => Marca)
  marca: Marca;
}
```

---

## Guards e Middleware

### JwtAuthGuard
```
Request → JwtAuthGuard → Controller
           │
           ├─ Verificar Bearer token
           ├─ Validar JWT
           ├─ Extrair payload (user_id, email, role)
           ├─ Injetar no Request.user
           │
           └─ Se inválido → 401 Unauthorized
```

**Exceções:**
- Rotas com decorator `@Public()` não passam pelo guard
- Exemplos: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`

### ValidationPipe (Global)
```
Request Body → ValidationPipe → Controller
                │
                ├─ Transformar em DTO
                ├─ Validar com class-validator
                ├─ Sanitizar (whitelist, forbidNonWhitelisted)
                │
                └─ Se inválido → 400 Bad Request
```

---

## Padrões e Convenções

### Estrutura de Response

**Sucesso:**
```json
{
  "id": "uuid",
  "nome": "Arroz",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Erro:**
```json
{
  "statusCode": 404,
  "message": "Produto não encontrado",
  "error": "Not Found"
}
```

### Nomenclatura

- **Entities:** PascalCase (`Usuario`, `Produto`)
- **DTOs:** PascalCase com sufixo Dto (`CreateProdutoDto`)
- **Enums:** PascalCase para tipo, UPPER_SNAKE_CASE para valores
- **Rotas:** kebab-case (`/api/usuarios/me`)
- **Métodos:** camelCase (`findAll()`, `create()`)

### Organização de Módulo

```
módulo/
├── dto/
│   ├── create-módulo.dto.ts
│   ├── update-módulo.dto.ts
│   └── ...
├── entities/
│   ├── módulo.entity.ts
│   └── ...
├── módulo.controller.ts
├── módulo.service.ts
├── módulo.module.ts
└── módulo.service.spec.ts
```

---

## Escalabilidade e Performance

### Estratégias Atuais
- Global JWT Auth Guard (evita código duplicado)
- TypeORM Eager/Lazy loading (configurável por query)
- Índices no banco de dados (unique em codigo_barras, email)

### Melhorias Futuras
1. **Cache Redis:**
   - Cache de produtos populares
   - Cache de receitas mais acessadas
   - TTL configurável por tipo de dado

2. **Paginação:**
   - Implementar em listagens longas (produtos, receitas)
   - Offset + Limit ou Cursor-based

3. **Compressão:**
   - Gzip para responses grandes
   - Middleware de compressão

4. **Rate Limiting:**
   - ThrottlerModule do NestJS
   - Limites por IP e por usuário

5. **Database Optimization:**
   - Índices compostos para queries frequentes
   - Réplicas read-only para leitura pesada
   - Connection pooling (já configurado no TypeORM)

---

## Segurança

### Implementado
- ✅ Hash de senhas com bcrypt
- ✅ JWT com expiração curta (15min)
- ✅ Refresh tokens com expiração longa (7d)
- ✅ Validação de inputs com class-validator
- ✅ CORS configurado
- ✅ Global Guard (JWT obrigatório por padrão)

### A Implementar
- ❌ Rate limiting
- ❌ Helmet.js (headers de segurança)
- ❌ CSRF protection (se usar cookies)
- ❌ SQL Injection (mitigado pelo TypeORM, mas revisar)
- ❌ XSS protection (sanitização de HTML se houver)

---

## Monitoramento e Observabilidade

### Logs
- NestJS Logger nativo (console em dev)
- Estruturado em JSON para produção
- Níveis: error, warn, log, debug, verbose

### Métricas (Futuro)
- APM (Application Performance Monitoring)
- Response time por endpoint
- Taxa de erro por endpoint
- Queries lentas do banco
- Uso de memória e CPU

### Health Check (A Implementar)
```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
    uptime: process.uptime()
  };
}
```

---

## Extensibilidade

### Como Adicionar um Novo Módulo

1. Gerar estrutura:
   ```bash
   nest g module modules/novo-modulo
   nest g controller modules/novo-modulo
   nest g service modules/novo-modulo
   ```

2. Criar entities em `modules/novo-modulo/entities/`

3. Criar DTOs em `modules/novo-modulo/dto/`

4. Implementar lógica no service

5. Expor endpoints no controller

6. Adicionar ao `AppModule.imports`

7. Documentar no Swagger com decorators

### Como Adicionar uma Nova Feature

1. Identificar módulo responsável
2. Criar DTO se necessário
3. Adicionar método no service
4. Adicionar endpoint no controller
5. Adicionar testes
6. Atualizar Swagger
7. Atualizar Postman collection

---

## Referências Técnicas

- **NestJS:** https://docs.nestjs.com
- **TypeORM:** https://typeorm.io
- **PostgreSQL:** https://www.postgresql.org/docs
- **JWT:** https://jwt.io
- **Swagger/OpenAPI:** https://swagger.io

---

Última atualização: Janeiro 2025
