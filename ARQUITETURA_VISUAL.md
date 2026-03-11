# 🎨 Arquitetura do CookMe - Visualização Completa

## 📐 Camadas da Aplicação (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APRESENTAÇÃO (UI Layer)                             │
│  ┌───────────────────────┐              ┌──────────────────────────┐       │
│  │  React Web (5173)     │              │  React Native Mobile     │       │
│  │  ├─ Pages            │              │  ├─ Screens             │       │
│  │  ├─ Components        │              │  ├─ Navigation          │       │
│  │  ├─ Contexts (Auth)   │              │  ├─ AsyncStorage        │       │
│  │  └─ Services          │              │  └─ Native APIs         │       │
│  └───────────────────────┘              └──────────────────────────┘       │
└────────────────────────┬──────────────────────────────────────┬────────────┘
                         │      HTTP / REST API                │
                         │   Axios Interceptors                │
                         │   Token Management                  │
                         │                                     │
┌────────────────────────▼──────────────────────────────────────▼────────────┐
│                      API Layer (Gateway)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  NestJS API Server (3000)                                          │  │
│  │  ├─ Global Guards (JWT, Roles)                                    │  │
│  │  ├─ Global Pipes (Validation)                                    │  │
│  │  ├─ Error Handling                                               │  │
│  │  └─ CORS + Rate Limiting                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┬────────────┘
                         │                                      │
┌────────────────────────▼────────────────────────────┐        │
│            Controllers (Request Handlers)            │        │
│  /auth, /usuarios, /produtos, /receitas,           │        │
│  /compras, /inventario, /admin, /notificacoes     │        │
└────────────────────────┬───────────────────────────┘        │
                         │                                      │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Services (Business Rules)               │    │
│  │  AuthService     │  UsuariosService                │    │
│  │  ProdutosService │  ReceitasService (MOI engine)   │    │
│  │  ComprasService  │  InventarioService              │    │
│  │  AdminService    │  ProductClassificationService   │    │
│  │  NotificaçõesService                              │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                   │
├─────────────────────────▼───────────────────────────────────┤
│              DATA ACCESS Layer (Repositories)                │
├─────────────────────────────────────────────────────────────┤
│  TypeORM Repositories                                        │
│  ├─ UsuarioRepository    ├─ ReceitaRepository              │
│  ├─ ProdutoRepository    ├─ CompraRepository               │
│  ├─ InventarioRepository ├─ PreferenciaRepository          │
│  └─ ...                                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────────┐
│               DATABASE & CACHE Layer                          │
│  ┌─────────────────────┐         ┌──────────────────────┐   │
│  │   PostgreSQL DB     │         │  Redis Cache         │   │
│  │   (localhost:5432)  │         │  (localhost:6379)    │   │
│  │                     │         │                      │   │
│  │  ├─ usuarios        │         │  ├─ Recipes list     │   │
│  │  ├─ produtos        │         │  ├─ Products cache   │   │
│  │  ├─ receitas        │         │  ├─ User sugestões   │   │
│  │  ├─ compras         │         │  └─ Session data     │   │
│  │  ├─ inventario      │         │                      │   │
│  │  └─ ...             │         └──────────────────────┘   │
│  └─────────────────────┘                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 Integrações Externas

```
┌─────────────────────────────────────────────────────────────────┐
│                  CookMe Backend Integration                     │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐
│  Frontend/Mobile Apps          │
│                               │
│  POST /api/receitas/gerar    │◄──────┐
│  POST /api/produtos/validar  │       │
│  POST /api/scraper/consulta  │       │
└───────────────┬───────────────┘       │
                │                       │
                ▼                       │
┌────────────────────────────────┐      │
│  ProductClassificationService  │      │
│  (AI Validation)               │      │
└────────────┬───────────────────┘      │
             │                          │
             ▼                          │
┌────────────────────────────────────────────────────────┐
│              Google Generative AI API                   │
│  ├─ Recipe generation (POST)                          │
│  ├─ Product classification (Batch)                    │
│  ├─ Content filtering                                 │
│  └─ Embeddings (opcional)                            │
└────────────────────────────────────────────────────────┘

External data sources:
├─ SAT Fiscal Receipt data (QR Code parsing)
├─ SEFAZ (if needed for validation)
├─ Barcode databases (EAN-13 lookup)
└─ Recipe databases (public APIs - optional)
```

---

## 🎯 Module Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              CookMe Module Dependencies                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │   Auth   │
                    │ Module   │
                    └────┬─────┘
                         │
                    ┌────▼─────────┐
                    │   Usuarios   │
                    │   Module     │
                    └──┬──────────┬┘
                       │          │
            ┌──────────┘          └─────────┐
            │                                 │
    ┌───────▼────────┐            ┌─────────▼──────┐
    │   Receitas     │            │   Compras      │
    │   Module       │            │   Module       │
    │   (MOI Engine) │            │                │
    └────┬───────┬──┘            └────┬───────┬───┘
         │       │                    │       │
         │  ┌────▼────────┐           │       │
         │  │  Produtos   │           │       │
         └─►│  Module     │◄──────────┘       │
            │  (Catalog)  │◄──────────────────┘
            └──────┬──────┘
                   │
            ┌──────▼────────┐
            │  Inventário   │
            │  Module       │
            └───────────────┘

Dependency arrows (►):
- Auth provides tokens to all modules
- Usuarios has preferences that affect Receitas
- Receitas depends on Produtos
- Compras depends on Produtos
- Inventário depends on Produtos
- All depend on Auth for verification
```

---

## 🔄 Request/Response Cycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    TYPICAL REQUEST/RESPONSE FLOW                         │
└──────────────────────────────────────────────────────────────────────────┘

1. FRONTEND SENDS REQUEST
   ┌─────────────────────────────────────────┐
   │ GET /api/receitas/sugestoes             │
   │ Header: "Authorization: Bearer TOKEN"   │
   │ Body: { params }                        │
   └─────────────────────────┬───────────────┘
                             │
2. AXIOS INTERCEPTOR
   ┌─────────────────────────────────────────┐
   │ requestInterceptor:                     │
   │ - Extract token from localStorage       │
   │ - Add Authorization header              │
   │ - Continue request                      │
   └─────────────────────────┬───────────────┘
                             │
3. NETWORK
   ┌─────────────────────────────────────────┐
   │ HTTP POST to http://localhost:3000/api │
   └─────────────────────────┬───────────────┘
                             │
4. NESTJS MIDDLEWARE & GUARDS
   ┌─────────────────────────────────────────┐
   │ ├─ CorsMiddleware                       │
   │ ├─ LoggerMiddleware                     │
   │ ├─ JwtAuthGuard                         │
   │ │  ├─ Extract token from header         │
   │ │  ├─ Verify signature                  │
   │ │  ├─ Check expiration                  │
   │ │  └─ Load user from database           │
   │ └─ RolesGuard (if needed)               │
   └─────────────────────────┬───────────────┘
                             │
5. CONTROLLER
   ┌─────────────────────────────────────────┐
   │ @Get('sugestoes')                       │
   │ @UseGuards(JwtAuthGuard)                │
   │ gerarSugestoes(                         │
   │   @CurrentUser() user: Usuario          │
   │ ) { ... }                               │
   └─────────────────────────┬───────────────┘
                             │
6. VALIDATION PIPES
   ┌─────────────────────────────────────────┐
   │ GlobalPipes:                            │
   │ ├─ ValidationPipe                       │
   │ │  ├─ Validate DTO                      │
   │ │  ├─ Transform types                   │
   │ │  └─ Throw 400 if invalid              │
   │ └─ CustomExceptionFilter                │
   └─────────────────────────┬───────────────┘
                             │
7. SERVICE LOGIC
   ┌─────────────────────────────────────────┐
   │ ReceitasService.gerarSugestoes(userId)  │
   │ ├─ Load user inventory from DB          │
   │ ├─ Load recipes from DB                 │
   │ ├─ Run MOI algorithm                    │
   │ ├─ Filter by preferences                │
   │ ├─ Sort by score                        │
   │ └─ Cache result in Redis                │
   └─────────────────────────┬───────────────┘
                             │
8. DATABASE QUERIES
   ┌─────────────────────────────────────────┐
   │ TypeORM Repository queries:             │
   │ ├─ find() - SELECT                      │
   │ ├─ findOne() - SELECT WHERE             │
   │ ├─ save() - INSERT/UPDATE               │
   │ └─ delete() - DELETE                    │
   │                                         │
   │ Execute against PostgreSQL              │
   └─────────────────────────┬───────────────┘
                             │
9. BUILD RESPONSE
   ┌─────────────────────────────────────────┐
   │ 200 OK response:                        │
   │ {                                       │
   │   data: [ Recipe[], Recipe[] ],         │
   │   total: 10,                            │
   │   message: "Sugestões geradas com       │
   │            sucesso"                     │
   │ }                                       │
   └─────────────────────────┬───────────────┘
                             │
10. NESTJS RESPONSE
   ┌─────────────────────────────────────────┐
   │ SerializerInterceptor (optional):       │
   │ ├─ Remove sensitive fields              │
   │ ├─ Apply transformations                │
   │ └─ Set content-type headers             │
   └─────────────────────────┬───────────────┘
                             │
11. NETWORK RESPONSE
   ┌─────────────────────────────────────────┐
   │ HTTP 200                                │
   │ Content-Type: application/json          │
   │ [response body]                         │
   └─────────────────────────┬───────────────┘
                             │
12. AXIOS RESPONSE INTERCEPTOR
   ┌─────────────────────────────────────────┐
   │ ├─ Check status code                    │
   │ ├─ Parse JSON                           │
   │ ├─ Handle 401 → Refresh token           │
   │ ├─ Retry request if needed              │
   │ └─ Return data to component             │
   └─────────────────────────┬───────────────┘
                             │
13. COMPONENT RECEIVES DATA
   ┌─────────────────────────────────────────┐
   │ .then(response => {                     │
   │   setReceitas(response.data)            │
   │   render()                              │
   │ })                                      │
   │ .catch(error => {                       │
   │   showError(error.message)              │
   │ })                                      │
   └─────────────────────────────────────────┘
```

---

## 🗃️ Cache Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                   CACHING STRATEGY (Redis)                       │
└──────────────────────────────────────────────────────────────────┘

KEY PATTERNS:

receitas:lista:${userId}
├─ TTL: 5 min (300s)
├─ Invalidate: quando usuario cria/edita/deleta receita
└─ Comando: redis.set(key, data, { ttl: 300 })

receitas:sugestoes:${userId}
├─ TTL: 5 min
├─ Invalidate: quando inventário muda
└─ Dependente de: inventário + preferências

produtos:lista:${page}:${limit}
├─ TTL: 10 min (600s)
├─ Invalidate: novo produto criado
└─ Muito acessado → cache importante

produtos:search:${query}
├─ TTL: 10 min
├─ Fuzzy search é caro
└─ Cache acelera buscas

categorias:all
├─ TTL: 30 min (não muda frequentemente)
├─ Todas as páginas usam
└─ Cache muito valioso

marcas:all
├─ TTL: 30 min
├─ Shared com todas as páginas
└─ Lightweight data

INVALIDATION EVENTS:

When Produto is created/updated/deleted:
  ├─ redis.del("produtos:*")
  ├─ redis.del("produtos:search:*")
  └─ redis.del("categorias:all")

When Usuario edits Preferências:
  ├─ redis.del("receitas:sugestoes:${userId}")
  └─ Forçar recalculation

When Inventário changes:
  ├─ redis.del("receitas:sugestoes:${userId}")
  └─ Suggestions need recalculation

MONITORING:

redis-cli
├─ INFO stats (hits/misses ratio)
├─ MONITOR (see all commands)
├─ CLIENT LIST (connected clients)
└─ MEMORY USAGE (cache size)

Goal: >80% cache hit rate for frequently accessed data
```

---

## 📍 API Routes Map

```
┌──────────────────────────────────────────────────────────────────┐
│              COMPLETE API ROUTES HIERARCHY                       │
└──────────────────────────────────────────────────────────────────┘

GET /
  └─ 200 OK (Health check)

/api/auth
  ├─ POST   /register          (Public)
  ├─ POST   /login             (Public)
  ├─ POST   /refresh           (Public)
  ├─ POST   /logout            (Protected)
  └─ GET    /me                (Protected)

/api/usuarios
  ├─ GET    /                  (Protected)
  ├─ GET    /:id               (Protected)
  ├─ PATCH  /:id               (Protected)
  ├─ GET    /me                (Protected)
  ├─ GET    /me/preferencias   (Protected)
  └─ PATCH  /me/preferencias   (Protected)

/api/produtos
  ├─ GET    /                  (Protected, Cached 5m)
  │  └─ Query: ?page=1&limit=20&search=&categoria=
  ├─ GET    /:id               (Protected, Cached)
  ├─ GET    /search            (Protected, Cached 10m)
  │  └─ Query: ?q=leite&limit=10
  ├─ GET    /barcode/:codigo   (Protected)
  │  └─ EAN-13 barcode lookup
  ├─ POST   /                  (Protected, Admin)
  ├─ PATCH  /:id               (Protected, Admin)
  ├─ DELETE /:id               (Protected, Admin)
  ├─ /categorias
  │  ├─ GET /                  (Protected, Cached 30m)
  │  ├─ POST /                 (Protected, Admin)
  │  └─ PATCH /:id             (Protected, Admin)
  └─ /marcas
     ├─ GET /                  (Protected, Cached 30m)
     ├─ POST /                 (Protected, Admin)
     └─ PATCH /:id             (Protected, Admin)

/api/receitas
  ├─ GET    /                  (Protected, Cached 5m)
  │  └─ Query: ?page=1&dificuldade=facil&tags=vegan
  ├─ GET    /:id               (Protected)
  ├─ GET    /sugestoes         (Protected, Cached 5m)
  │  └─ MOI suggestions for user
  ├─ GET    /executadas        (Protected)
  │  └─ User's execution history
  ├─ POST   /                  (Protected)
  ├─ PATCH  /:id               (Protected)
  ├─ DELETE /:id               (Protected)
  ├─ POST   /:id/executar      (Protected)
  │  └─ Record execution
  ├─ POST   /gerar-com-ia      (Public)
  │  └─ AI recipe generation
  ├─ POST   /gerar-do-inventario (Public)
  │  └─ Generate from existing recipes
  └─ POST   /gerar-semana      (Public)
     └─ Generate 21 recipes (semana completa)

/api/compras
  ├─ GET    /                  (Protected)
  │  └─ User's purchases
  ├─ GET    /:id               (Protected)
  ├─ GET    /stats             (Protected)
  │  └─ Spending statistics
  ├─ POST   /                  (Protected)
  │  └─ With product validation
  └─ DELETE /:id               (Protected)

/api/inventario
  ├─ GET    /                  (Protected)
  │  └─ All user's items
  ├─ GET    /vencendo/:dias    (Protected)
  │  └─ Items expiring soon
  ├─ GET    /vencidos          (Protected)
  │  └─ Expired items
  ├─ GET    /stats             (Protected)
  │  └─ Inventory statistics
  ├─ POST   /                  (Protected)
  │  └─ Add item
  ├─ PATCH  /:id               (Protected)
  │  └─ Update quantity/date
  └─ DELETE /:id               (Protected)

/api/admin
  ├─ GET    /produtos          (Protected, Admin)
  │  └─ Query: ?page=1&search=&categoria=&marca=
  ├─ GET    /produtos/stats    (Protected, Admin)
  ├─ GET    /usuarios          (Protected, Admin)
  ├─ GET    /usuarios/stats    (Protected, Admin)
  ├─ GET    /dashboard/stats   (Protected, Admin, Cached)
  │  └─ Overview statistics
  └─ GET    /logs              (Protected, Admin)

/api/notificacoes
  ├─ GET    /                  (Protected)
  ├─ PATCH  /:id/lida          (Protected)
  │  └─ Mark as read
  └─ DELETE /:id               (Protected)

/api/docs (Swagger)
  └─ GET /                      (Public)
     └─ Interactive API docs
```

---

## 🔒 Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                                │
└──────────────────────────────────────────────────────────────────┘

LAYER 1: Transport Security
├─ HTTPS (in production)
├─ TLS 1.3 (encryption)
└─ SSL certificates

LAYER 2: Authentication
├─ JWT tokens (stateless)
│  ├─ Access token (15 min)
│  ├─ Refresh token (7 days, stored in DB)
│  └─ HS256 algorithm
├─ Passport strategies
│  ├─ JwtStrategy (Bearer)
│  └─ RefreshTokenStrategy
└─ Password security
   ├─ Bcrypt hashing (10 salt rounds)
   └─ Never plain-text

LAYER 3: Authorization
├─ Role-based access control (RBAC)
│  ├─ USER (default)
│  ├─ ADMIN (full access)
│  ├─ PREMIUM (premium features)
│  └─ MARCA (brand dashboard)
├─ Resource-level permissions
│  ├─ Own data access (usuario_id check)
│  └─ Admin-only routes
└─ Guards
   ├─ JwtAuthGuard
   ├─ RolesGuard
   └─ Custom guards

LAYER 4: Input Validation
├─ DTO validation
│  ├─ class-validator decorators
│  ├─ Email format
│  ├─ Password strength
│  └─ Type coercion
├─ SQL injection prevention
│  ├─ Parameterized queries (TypeORM)
│  └─ No string concatenation
└─ XSS prevention
   ├─ Input sanitization
   └─ Output encoding

LAYER 5: API Security
├─ CORS whitelist
│  ├─ Frontend: localhost:5173
│  ├─ Mobile: localhost:8081
│  └─ Configured in main.ts
├─ Rate limiting (optional)
├─ Request size limits
└─ Helmet headers

LAYER 6: Data Protection
├─ At rest
│  ├─ PostgreSQL encryption (optional)
│  └─ Sensitive data masked
├─ In transit
│  ├─ HTTPS/TLS
│  └─ No sensitive data in URLs
├─ In memory
│  ├─ Tokens not logged
│  └─ Passwords never logged
└─ Field-level encryption (optional)
   ├─ sensitive_fields

LAYER 7: Monitoring & Logging
├─ Request logging
│  ├─ Who (user)
│  ├─ What (endpoint)
│  ├─ When (timestamp)
│  └─ Result (status)
├─ Error tracking
│  ├─ Sentry integration (optional)
│  └─ Alert on suspicious activity
├─ Audit trail
│  └─ Track modifications
└─ Performance monitoring
   └─ Database query logs
```

---

Este é um mapa completo da arquitetura visual do CookMe! 🎉

Você tem:
- ✅ Diagramas de camadas
- ✅ Fluxos de autenticação
- ✅ Ciclo completo request/response
- ✅ Estratégia de cache
- ✅ Mapa de rotas API
- ✅ Arquitetura de segurança

Use como referência para entender como tudo se conecta!
