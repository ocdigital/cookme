# CookMe Backend - Complete API & Resources Guide

## Overview
The backend is a NestJS application running on **Node.js** with **PostgreSQL** database using **TypeORM** as ORM. All routes are prefixed with `/api` and protected by JWT authentication by default (with @Public() decorator for exceptions).

---

## 1. MODULES & API ENDPOINTS

### 1.1 AUTH MODULE (`/api/auth`)
**Purpose:** User authentication and token management

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/logout` - Logout user (invalidates refresh token)
- `GET /api/auth/me` - Get authenticated user profile

**Key Details:**
- JWT-based authentication (Access Token: 15 minutes, Refresh Token: 7 days)
- Password hashing with bcrypt (10 salt rounds)
- Refresh tokens stored in database for invalidation

---

### 1.2 USUARIOS MODULE (`/api/usuarios`)
**Purpose:** User profile and preferences management

**Endpoints:**
- `GET /api/usuarios/me` - Get authenticated user profile
- `PATCH /api/usuarios/me` - Update user profile
- `DELETE /api/usuarios/me` - Delete user account
- `GET /api/usuarios/preferencias` - Get user food preferences
- `PATCH /api/usuarios/preferencias` - Update user preferences

**Key Details:**
- User-specific operations (CRUD for own account only)
- Preferences linked to dietary restrictions

---

### 1.3 PRODUTOS MODULE (`/api/produtos`)
**Purpose:** Product catalog management

**Endpoints:**

**Products:**
- `POST /api/produtos` - Create new product
- `GET /api/produtos` - List products (with search/filter by category)
- `GET /api/produtos/:id` - Get product by ID
- `GET /api/produtos/barcode/:codigo` - Get product by barcode
- `PATCH /api/produtos/:id` - Update product
- `DELETE /api/produtos/:id` - Delete product

**Brands:**
- `POST /api/produtos/marcas` - Create brand
- `GET /api/produtos/marcas/all` - List all brands
- `GET /api/produtos/marcas/:id` - Get brand by ID

**Categories:**
- `POST /api/produtos/categorias` - Create category
- `GET /api/produtos/categorias/all` - List all categories (with hierarchy)
- `GET /api/produtos/categorias/:id` - Get category by ID

**Key Details:**
- Barcode (EAN-13, UPC) support for product lookup
- Hierarchical categories (parent-child relationships)
- Nutritional information stored as JSON (calorias, proteinas, carboidratos, gorduras, fibras, sodio, acucares)
- Tags support (vegano, sem-gluten, organico, etc.)
- Origin tracking (manual, api_externa, usuario, marca)
- Verification flag for curated products

---

### 1.4 COMPRAS MODULE (`/api/compras`)
**Purpose:** Purchase history and expense tracking

**Endpoints:**
- `POST /api/compras` - Create purchase with items
- `GET /api/compras` - List user's purchases
- `GET /api/compras/:id` - Get purchase by ID
- `GET /api/compras/stats` - Get purchase statistics
- `DELETE /api/compras/:id` - Delete purchase

**Key Details:**
- Multiple items per purchase
- Multiple ways to register (MetodoCadastro): MANUAL, OCR, BARCODE
- Tracks store location, total value, and registration method
- Captures user experience data (tempo_cadastro_segundos)
- Supports metadata for additional tracking

---

### 1.5 INVENTARIO MODULE (`/api/inventario`)
**Purpose:** Food inventory management with expiration tracking

**Endpoints:**
- `POST /api/inventario` - Add item to inventory
- `GET /api/inventario` - List inventory (ordered by expiration)
- `GET /api/inventario/:id` - Get inventory item by ID
- `GET /api/inventario/stats` - Get inventory statistics
- `GET /api/inventario/vencendo` - List items expiring soon (default: 7 days)
- `GET /api/inventario/vencidos` - List expired items
- `PATCH /api/inventario/:id` - Update inventory item
- `DELETE /api/inventario/:id` - Remove item from inventory

**Key Details:**
- Tracks quantity, unit of measurement, and expiration date
- Unique constraint on (usuario_id, produto_id, data_validade) to prevent duplicates
- Storage location tracking (geladeira, despensa, freezer)
- Expiration date indexed for efficient queries
- Links back to purchase items for traceability

---

### 1.6 RECEITAS MODULE (`/api/receitas`)
**Purpose:** Recipe catalog and intelligent recipe suggestions

**Endpoints:**
- `POST /api/receitas` - Create recipe
- `GET /api/receitas` - List recipes with filters (search, dificuldade, categoria, tags_dieta)
- `GET /api/receitas/:id` - Get recipe by ID
- `GET /api/receitas/sugestoes` - MOI Engine: Get smart recipe suggestions based on user inventory
- `GET /api/receitas/executadas` - Get user's recipe history
- `POST /api/receitas/:id/executar` - Mark recipe as executed (with rating/notes)
- `DELETE /api/receitas/:id` - Delete recipe

**Key Details:**
- Difficulty levels (FACIL, MEDIA, DIFICIL)
- Recipe categories (cafe-da-manha, almoco, jantar, sobremesa)
- Dietary tags (vegetariano, vegano, low-carb, etc.)
- Prep tags (rapido, facil, festa, etc.)
- Ingredients with quantities/units tracked separately
- Nutritional info and cook time (minutes)
- MOI (Inventory Optimization Motor): Suggests recipes based on user's current inventory
- Tracks execution count and average rating

---

### 1.7 SCRAPER MODULE (`/api/scraper`)
**Purpose:** OCR-based receipt scanning and product extraction

**Endpoints:**
- `POST /api/scraper/consultas` - Start fiscal receipt consultation (QR Code parsing)
- `GET /api/scraper/consultas/:sessionId` - Get consultation status with progress
- `POST /api/scraper/consultas/:sessionId/captcha-resolvido` - Notify CAPTCHA solved + upload receipt HTML
- `DELETE /api/scraper/consultas/:sessionId` - Cancel consultation
- `GET /api/scraper/minhas-consultas` - List user's queries (active & recent)
- `DELETE /api/scraper/minhas-consultas` - Clear user's consultation history

**Key Details:**
- Session-based architecture for async OCR processing
- Handles SAT receipts (Brazilian fiscal system)
- Progress tracking (0-100%)
- CAPTCHA support for SAT system
- Returns extracted products with quantities and prices

---

### 1.8 BARCODE MODULE (`/api/barcode`)
**Purpose:** Barcode scanning and product lookup

**Endpoints:**
- `GET /api/barcode/scan/:codigo` - Lookup product by barcode code

**Key Details:**
- Quick product lookup by barcode
- Integrated with product catalog

---

### 1.9 PRODUCT CLASSIFICATION MODULE (`/api/product-classification`)
**Purpose:** AI-powered product classification (food vs non-food) with intelligent caching

**Endpoints:**
- `GET /api/product-classification/classify/:productName` - Classify single product (cached with OpenAI fallback)
- `POST /api/product-classification/classify-batch` - Classify multiple products
- `POST /api/product-classification/inventory/add` - Add product to inventory with intelligent validation
- `POST /api/product-classification/validate` - Manually validate product classification
- `GET /api/product-classification/history/:productName` - Get product validation history
- `GET /api/product-classification/statistics` - Get classification system statistics
- `GET /api/product-classification/alimentos` - List all classified food products
- `GET /api/product-classification/nao-alimentos` - List non-food products (admin)

**Key Details:**
- ML-powered classification with confidence scores
- Local cache before OpenAI API call
- User validation feedback to improve confidence
- Tracks failed classifications for admin review
- Batch processing for efficiency

---

### 1.10 AFFILIATE MODULE (`/api/affiliate`)
**Purpose:** Monetization, affiliate marketing, and premium subscriptions

**Affiliate Endpoints:**
- `POST /api/affiliate/registrar-clique` - Track affiliate link clicks
- `GET /api/affiliate/links/:receitaId` - Get affiliate links for recipe
- `GET /api/affiliate/estatisticas` - Get click/conversion statistics (with date range filter)
- `GET /api/affiliate/comissoes` - Get user commissions (pending, confirmed, paid)

**Recommendation Endpoints:**
- `GET /api/affiliate/recomendacoes/com-meus-alimentos` - Get recipes user can make with current inventory
- `GET /api/affiliate/recomendacoes/incentivo-compra` - Get recipes encouraging purchase of missing ingredients
- `POST /api/affiliate/recomendacoes/:recId/clique` - Track recommendation clicks

**Subscription Endpoints:**
- `GET /api/affiliate/subscriptions/status` - Get user's subscription plan and features
- `POST /api/affiliate/subscriptions/criar` - Create subscription
- `POST /api/affiliate/subscriptions/:assinaturaId/atualizar` - Change subscription plan
- `POST /api/affiliate/subscriptions/:assinaturaId/cancelar` - Cancel subscription
- `GET /api/affiliate/subscriptions/features/:feature` - Check if user has feature access

**Key Details:**
- Multiple supermarket partner support
- Subscription tiers (BASIC, PREMIUM, VIP, FAMILY)
- Stripe integration for payments
- Commission tracking system
- Feature-based access control

---

## 2. DATABASE ENTITIES & MODELS

### Core Entities:

**USUARIOS** (Users)
- id (UUID, PK)
- email (unique, indexed)
- senha (bcrypt hashed, excluded from responses)
- nome
- telefone (optional)
- role (USER, PREMIUM, ADMIN, MARCA)
- alertas_habilitados (boolean)
- horario_alertas (time, optional)
- avatar_url (optional)
- email_verificado (boolean)
- refresh_token (stored for logout)
- ultimo_acesso (timestamp)
- criado_em, atualizado_em (timestamps)

**PRODUTOS** (Product Catalog)
- id (UUID, PK)
- nome
- descricao (optional)
- codigo_barras (unique, indexed, optional)
- codigo_interno (optional)
- marca_id (FK to Marca)
- categoria_id (FK to Categoria)
- unidade_padrao (enum: UN, G, ML, KG, L, etc.)
- validade_media_dias (average shelf life, optional)
- imagem_url (optional)
- informacoes_nutricionais (JSONB)
- tags (array: vegano, sem-gluten, organico, etc.)
- alternativas_ids (array: alternative product IDs)
- origem (manual, api_externa, usuario, marca)
- verificado (boolean, for curation)
- criado_em, atualizado_em (timestamps)

**CATEGORIAS** (Product Categories)
- id (UUID, PK)
- nome
- descricao (optional)
- icone (optional)
- is_food (boolean flag)
- categoria_pai_id (FK, for hierarchy)
- criado_em (timestamp)
- Relationships: subcategorias, produtos

**MARCAS** (Brands)
- id (UUID, PK)
- nome
- logo_url (optional)
- website (optional)
- Relationships: produtos

**COMPRAS** (Purchases)
- id (UUID, PK)
- usuario_id (FK to Usuario, indexed)
- data_compra (date)
- local_compra (supermarket name, optional)
- valor_total (decimal)
- metodo_cadastro (enum: MANUAL, OCR, BARCODE)
- nota_fiscal_url (optional)
- tempo_cadastro_segundos (UX analytics, optional)
- metadata (JSONB for extras)
- criado_em, atualizado_em (timestamps)
- Relationships: itens (CompraItem), usuario

**COMPRA_ITENS** (Purchase Line Items)
- id (UUID, PK)
- compra_id (FK to Compra)
- produto_id (FK to Produto)
- quantidade (decimal)
- unidade (enum)
- preco_unitario (optional)
- preco_total (optional)
- validade_escaneada (OCR, optional)
- validade_manual (manual entry, optional)
- validade_final (computed: manual > scanned > estimated)
- lote (batch/lot for traceability, optional)
- criado_em (timestamp)

**INVENTARIO** (Food Inventory)
- id (UUID, PK)
- usuario_id (FK to Usuario, indexed)
- produto_id (FK to Produto, indexed)
- quantidade_disponivel (decimal)
- unidade (enum)
- data_validade (date, indexed for expiry queries)
- compra_item_id (FK for traceability, optional)
- metodo_atualizacao (enum: MANUAL, OCR, BARCODE)
- localizacao (geladeira, despensa, freezer, optional)
- criado_em, ultima_atualizacao (timestamps)
- Unique constraint: (usuario_id, produto_id, data_validade)

**RECEITAS** (Recipes)
- id (UUID, PK)
- nome (indexed)
- descricao (optional)
- modo_preparo (text)
- tempo_preparo (minutes, optional)
- rendimento_porcoes (servings)
- dificuldade (enum: FACIL, MEDIA, DIFICIL)
- tags_dieta (array, indexed: vegetariano, vegano, low-carb, etc.)
- tags_preparo (array: rapido, facil, festa, etc.)
- categoria_receita (breakfast, lunch, dinner, dessert, optional)
- imagem_url (optional)
- informacoes_nutricionais (JSONB)
- origem (catalogo, ia_gerada, usuario)
- prompt_ia (if AI-generated, optional)
- avaliacao_media (decimal, calculated)
- vezes_executada (counter)
- criado_em, atualizado_em (timestamps)

**RECEITA_INGREDIENTES** (Recipe Ingredients)
- id (UUID, PK)
- receita_id (FK to Receita)
- produto_id (FK to Produto)
- quantidade (decimal)
- unidade (enum)
- ingrediente_descricao (fallback text for items not in catalog)

**RECEITA_EXECUTADA** (Recipe Execution History)
- id (UUID, PK)
- receita_id (FK to Receita)
- usuario_id (FK to Usuario)
- data_execucao (timestamp)
- avaliacao (1-5 rating, optional)
- notas (user notes, optional)
- produtos_utilizados (array of inventory items used)

**PREFERENCIA** (User Food Preferences)
- id (UUID, PK)
- usuario_id (FK to Usuario, one-to-one)
- restricoes_dieta (array: vegetariano, vegano, low-carb, sem-gluten, etc.)
- alergias (array)
- preferencias_culinarias (JSON)
- criado_em, atualizado_em (timestamps)

### Affiliate & Monetization Entities:

**AFFILIATE_LINKS** (Affiliate Marketing Links)
- id (UUID, PK)
- receita_id (FK to Receita)
- supermarket (enum: CARREFOUR, EXTRA, SONDA, etc.)
- affiliate_url
- commission_rate (decimal percentage)
- criado_em, atualizado_em

**AFFILIATE_CLICKS** (Click Tracking)
- id (UUID, PK)
- affiliate_link_id (FK)
- usuario_id (FK to Usuario)
- receita_id (FK to Receita, optional)
- device_info (JSON: browser, OS, device type)
- ip_address
- timestamp

**AFFILIATE_CONVERSION** (Sale Tracking)
- id (UUID, PK)
- click_id (FK to AffiliateClick)
- valor_venda (decimal)
- taxa_comissao (decimal)
- valor_comissao (calculated)
- status (pending, confirmed, paid)
- data_confirmacao (timestamp, optional)

**SUBSCRIPTION** (Premium Plans)
- id (UUID, PK)
- usuario_id (FK to Usuario)
- plano (enum: BASIC, PREMIUM, VIP, FAMILY)
- status (ativo, cancelado, suspended)
- stripe_customer_id
- stripe_subscription_id
- data_inicio
- data_proximo_pagamento
- data_cancelamento (optional)
- motivo_cancelamento (optional)
- criado_em, atualizado_em

**TRANSACTION** (Payment Transactions)
- id (UUID, PK)
- subscription_id (FK to Subscription)
- usuario_id (FK to Usuario)
- tipo (payment, refund, adjustment)
- valor
- status (pending, completed, failed)
- stripe_transaction_id
- criado_em

**RECIPE_RECOMMENDATION** (AI Recommendations)
- id (UUID, PK)
- receita_id (FK to Receita)
- usuario_id (FK to Usuario)
- tipo_recomendacao (com_meus_alimentos, incentivo_compra, trending, etc.)
- porcentagem_alimentos (% of ingredients user already has)
- ingredientes_faltando (array)
- custo_estimado (decimal)
- data_recomendacao
- clicado (boolean)
- data_clique (timestamp, optional)

### Classification & AI Entities:

**PRODUCT_KNOWLEDGE_BASE** (AI Classification Cache)
- id (UUID, PK)
- product_name
- categoria (alimento, nao_alimento, indefinido)
- confidence_score (decimal 0-1)
- descricao
- total_adicoes (counter)
- ultima_validacao (timestamp)

**AI_CLASSIFICATION_LOG** (API Call Logging)
- id (UUID, PK)
- produto_name
- categoria_resultado
- confianca_ia
- tempo_processamento_ms
- custo_api (decimal)
- usuario_id (FK)
- timestamp

**PRODUCT_VALIDATION** (User Validation Feedback)
- id (UUID, PK)
- produto_name
- categoria_validada (alimento, nao_alimento)
- usuario_id (FK)
- comentario (optional)
- timestamp

---

## 3. AUTHENTICATION & AUTHORIZATION SYSTEM

### JWT Implementation:
- **Access Token:** 15-minute expiration, stores user id, email, and role
- **Refresh Token:** 7-day expiration, stored in database for revocation
- **Secret Keys:** Separate keys for access and refresh tokens (from config)

### User Roles:
1. **USER** - Standard user (default)
2. **PREMIUM** - Premium subscriber with advanced features
3. **ADMIN** - System administrator with full access
4. **MARCA** - Brand/manufacturer B2B dashboard access

### Guards & Decorators:

**JwtAuthGuard** - Global JWT protection on all routes by default
- Checks for valid JWT token in Authorization header
- Extracts user payload (id, email, role)
- Can be bypassed with `@Public()` decorator on specific routes

**RolesGuard** - Role-based access control
- Usage: `@Roles(UserRole.ADMIN, UserRole.PREMIUM)`
- Verifies user's role matches required roles

**@Public()** - Mark routes as publicly accessible (no token required)
- Used on: auth/register, auth/login, auth/refresh
- Default: all routes are protected

**@CurrentUser()** - Inject authenticated user object into controller methods
- Extracts user from request context
- Returns complete Usuario entity with all relationships

### Protected Fields:
- User password never returned in responses (excluded via @Exclude() decorator)
- Refresh token never exposed in API responses
- API automatically transforms and validates DTOs

---

## 4. IMPORTANT ENDPOINTS FOR ADMIN DASHBOARD

### User Management:
- List all users (would need custom endpoint)
- View user profiles (USER/PREMIUM roles)
- View user activity (last login, etc.)
- View user subscriptions status
- View affiliate earnings/commissions
- Manage roles (ADMIN only)

### Product Management:
- Create/edit/delete products (all users)
- Create/edit/delete categories
- Manage brands
- View product verification status
- Search products by barcode/name

### Content Management:
- Create/manage recipes
- Manage recipe classifications
- View recipe execution metrics
- Create food categories for filtering

### Analytics & Reports:
- Purchase statistics (`GET /api/compras/stats`)
- Inventory statistics (`GET /api/inventario/stats`)
- Classification system statistics (`GET /api/product-classification/statistics`)
- Affiliate statistics (`GET /api/affiliate/estatisticas`)
- Subscription metrics (total active subscriptions, churn rate, etc.)

### Moderation:
- Review product classifications (low confidence)
- Manage affiliate links
- Handle user reports/disputes
- Manage feature access for subscriptions

### System Monitoring:
- OCR processing queue (`GET /api/scraper/minhas-consultas`)
- API usage tracking
- Error rate monitoring
- Cache hit rates
- Token refresh rates

---

## 5. KEY CONSIDERATIONS FOR ADMIN PANEL

### Features to Implement:
1. **User Management**
   - Filter by role, subscription status, registration date
   - Search by email/name
   - Bulk operations (enable/disable, role assignment)
   - User activity timeline

2. **Product Catalog**
   - Batch product import/export
   - Product verification workflow
   - Nutritional info management
   - Image gallery management
   - Barcode conflict resolution

3. **Content Moderation**
   - Review low-confidence classifications
   - Manage recipe authenticity
   - Handle user-reported issues

4. **Financial Management**
   - Affiliate payouts tracking
   - Subscription revenue reporting
   - Commission calculations
   - Payment history

5. **Analytics Dashboard**
   - DAU/MAU metrics
   - Feature adoption rates
   - Revenue trends
   - Engagement metrics

### Required Permissions/Endpoints to Add:
- Admin-only user listing endpoint
- Bulk product management
- User role management endpoints
- System configuration endpoints
- Audit logging endpoints
- Advanced search/filter endpoints

### Data Export Capabilities:
- CSV export for products, users, purchases
- Financial reports (PDF)
- Analytics export (JSON/CSV)

---

## 6. DATABASE SCHEMA RELATIONSHIPS

```
USUARIOS (1) ──── (∞) COMPRAS
       │
       ├──── (1) PREFERENCIA
       ├──── (∞) INVENTARIO
       ├──── (∞) RECEITA_EXECUTADA
       ├──── (∞) AFFILIATE_CLICKS
       ├──── (∞) SUBSCRIPTION
       └──── (∞) TRANSACTION

PRODUTOS (1) ────── (∞) COMPRA_ITENS
     │
     ├──── (1) MARCA
     ├──── (1) CATEGORIA
     ├──── (∞) INVENTARIO
     └──── (∞) RECEITA_INGREDIENTES

RECEITAS (1) ──── (∞) RECEITA_INGREDIENTES
      │
      ├──── (∞) RECEITA_EXECUTADA
      ├──── (∞) AFFILIATE_LINKS
      └──── (∞) RECIPE_RECOMMENDATION

COMPRAS (1) ────── (∞) COMPRA_ITENS

AFFILIATE_LINKS (1) ──── (∞) AFFILIATE_CLICKS

AFFILIATE_CLICKS (1) ──── (∞) AFFILIATE_CONVERSION

SUBSCRIPTION (1) ──── (∞) TRANSACTION

CATEGORIAS (self-join): categoria_pai_id → categoria_id
```

---

## 7. API DOCUMENTATION

**Swagger Documentation Available at:** `http://localhost:3000/api/docs`

All endpoints include:
- Request/response schemas
- Authentication requirements
- Error responses
- Example values

**CORS Enabled For:**
- http://localhost:3001 (web)
- http://localhost:19006 (React Native Expo)
- http://192.168.86.7:8081 (local network)

---

## 8. ENUMERATIONS & CONSTANTS

### UserRole
- USER, PREMIUM, ADMIN, MARCA

### MetodoCadastro (Registration Methods)
- MANUAL, OCR, BARCODE

### UnidadeMedida (Units of Measurement)
- UN (unit), G (gram), ML (milliliter), KG (kilogram), L (liter), etc.

### DificuldadeReceita (Recipe Difficulty)
- FACIL, MEDIA, DIFICIL

### SubscriptionPlan
- BASIC, PREMIUM, VIP, FAMILY

---

## 9. ENVIRONMENT CONFIGURATION

Database requires:
- DB_HOST
- DB_PORT (typically 5432)
- DB_USERNAME
- DB_PASSWORD
- DB_DATABASE
- NODE_ENV (development/production)
- DB_DROP_SCHEMA (only in dev)

JWT requires:
- jwt.secret (access token secret)
- jwt.refreshSecret (refresh token secret)
- jwt.expiresIn (access token TTL, e.g., "15m")
- jwt.refreshExpiresIn (refresh token TTL, e.g., "7d")

---

## 10. VALIDATION & ERROR HANDLING

**Global Validation Pipe:**
- Whitelist: Removes undeclared properties
- Transform: Converts payloads to DTOs
- Forbid non-whitelisted: Throws errors for extra properties
- Type conversion: Auto-converts types

**Common HTTP Status Codes:**
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request (validation error)
- 401: Unauthorized (auth required)
- 404: Not Found
- 409: Conflict (duplicate email, duplicate barcode)
- 500: Internal Server Error

---

