# CookMe Backend - Modules & Endpoints Overview

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NestJS Application                          │
│                        (Node.js + PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────────┤
│                      Global JWT Auth Guard                          │
│                    (All routes protected by default)                │
├─────────────────────────────────────────────────────────────────────┤
│  /api/auth      /api/usuarios   /api/produtos   /api/compras       │
│  /api/inventario /api/receitas  /api/scraper   /api/barcode        │
│  /api/product-classification    /api/affiliate                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### 1. AUTH Module
```
/api/auth/
├── POST register          → Create account
├── POST login            → Get access/refresh tokens
├── POST refresh          → Renew access token
├── POST logout           → Invalidate tokens
└── GET me                → Get logged-in user
```

**Key Features:**
- JWT tokens (15min access, 7day refresh)
- bcrypt password hashing
- Token revocation on logout

---

### 2. USUARIOS Module
```
/api/usuarios/
├── GET me                → User profile
├── PATCH me              → Update profile
├── DELETE me             → Delete account
├── GET preferencias      → Food preferences
└── PATCH preferencias    → Update preferences
```

**Key Features:**
- User profile management
- Dietary restrictions tracking
- Preference persistence

---

### 3. PRODUTOS Module
```
/api/produtos/
├── POST                  → Create product
├── GET                   → List (search, category filter)
├── GET :id               → Get by ID
├── GET /barcode/:codigo  → Get by barcode
├── PATCH :id             → Update product
├── DELETE :id            → Delete product
├── POST /marcas          → Create brand
├── GET /marcas/all       → List brands
├── POST /categorias      → Create category
└── GET /categorias/all   → List categories (hierarchical)
```

**Key Features:**
- Product catalog with barcode support
- Hierarchical categories
- Nutritional information (JSONB)
- Brand management
- Product verification workflow

---

### 4. COMPRAS Module
```
/api/compras/
├── POST                  → Record purchase
├── GET                   → User's purchases
├── GET :id               → Get purchase details
├── GET /stats            → Purchase analytics
└── DELETE :id            → Remove purchase
```

**Key Features:**
- Purchase history tracking
- Multiple registration methods (MANUAL, OCR, BARCODE)
- Store location tracking
- UX metrics (registration time)
- Metadata for analytics

---

### 5. INVENTARIO Module
```
/api/inventario/
├── POST                  → Add item
├── GET                   → All items (sorted by expiry)
├── GET :id               → Get item
├── GET /stats            → Inventory stats
├── GET /vencendo         → Expiring soon (7 days default)
├── GET /vencidos         → Expired items
├── PATCH :id             → Update item
└── DELETE :id            → Remove item
```

**Key Features:**
- Food inventory with quantity tracking
- Expiration date monitoring (indexed)
- Storage location tracking
- Automatic alerts for expiring items
- Prevents duplicate entries

---

### 6. RECEITAS Module
```
/api/receitas/
├── POST                  → Create recipe
├── GET                   → List (search, difficulty, category, diet tags)
├── GET :id               → Get recipe
├── GET /sugestoes        → MOI Engine suggestions
├── GET /executadas       → Recipe history
├── POST :id/executar     → Mark as executed
└── DELETE :id            → Delete recipe
```

**Key Features:**
- Recipe catalog
- Difficulty levels & categories
- Ingredient tracking
- MOI Engine (intelligent suggestions based on inventory)
- Execution history with ratings

---

### 7. SCRAPER Module
```
/api/scraper/
├── POST /consultas                    → Start OCR session
├── GET /consultas/:sessionId          → Check status
├── POST /consultas/:id/captcha-...    → Notify CAPTCHA solved
├── DELETE /consultas/:sessionId       → Cancel session
├── GET /minhas-consultas              → User's sessions
└── DELETE /minhas-consultas           → Clear history
```

**Key Features:**
- Async OCR processing (Brazilian SAT receipts)
- CAPTCHA handling
- Session-based architecture
- Progress tracking
- Automatic product extraction

---

### 8. BARCODE Module
```
/api/barcode/
└── GET /scan/:codigo     → Product lookup by barcode
```

**Key Features:**
- Fast barcode lookups
- Integrated with product catalog

---

### 9. PRODUCT CLASSIFICATION Module
```
/api/product-classification/
├── GET /classify/:productName              → Single classification
├── POST /classify-batch                    → Batch classification
├── POST /inventory/add                     → Add with validation
├── POST /validate                          → Manual validation
├── GET /history/:productName               → Validation history
├── GET /statistics                         → System metrics
├── GET /alimentos                          → Food products
└── GET /nao-alimentos                      → Non-food products
```

**Key Features:**
- AI classification (food vs non-food)
- Confidence scoring
- Local cache + OpenAI fallback
- User validation feedback
- Batch processing
- Classification logging

---

### 10. AFFILIATE Module
```
/api/affiliate/
├── POST /registrar-clique                          → Track clicks
├── GET /links/:receitaId                          → Get affiliate links
├── GET /estatisticas                              → Statistics
├── GET /comissoes                                 → Commissions
├── GET /recomendacoes/com-meus-alimentos          → Recipe suggestions
├── GET /recomendacoes/incentivo-compra            → Buy incentive recs
├── POST /recomendacoes/:recId/clique              → Track rec clicks
├── GET /subscriptions/status                      → User subscription
├── POST /subscriptions/criar                      → Create subscription
├── POST /subscriptions/:id/atualizar              → Change plan
├── POST /subscriptions/:id/cancelar               → Cancel subscription
└── GET /subscriptions/features/:feature           → Feature access
```

**Key Features:**
- Affiliate link tracking
- Click/conversion analytics
- Commission management
- Stripe integration
- Subscription plans (BASIC, PREMIUM, VIP, FAMILY)
- Feature-based access control
- Recommendation engine

---

## API Endpoints Summary Table

| Module | Method | Endpoint | Protected | Purpose |
|--------|--------|----------|-----------|---------|
| auth | POST | /api/auth/register | Public | Register user |
| auth | POST | /api/auth/login | Public | Login user |
| auth | POST | /api/auth/refresh | Public | Refresh token |
| auth | POST | /api/auth/logout | Private | Logout |
| auth | GET | /api/auth/me | Private | User profile |
| usuarios | GET | /api/usuarios/me | Private | Get profile |
| usuarios | PATCH | /api/usuarios/me | Private | Update profile |
| usuarios | DELETE | /api/usuarios/me | Private | Delete account |
| usuarios | GET | /api/usuarios/preferencias | Private | Get preferences |
| usuarios | PATCH | /api/usuarios/preferencias | Private | Update preferences |
| produtos | POST | /api/produtos | Private | Create product |
| produtos | GET | /api/produtos | Private | List products |
| produtos | GET | /api/produtos/:id | Private | Get product |
| produtos | PATCH | /api/produtos/:id | Private | Update product |
| produtos | DELETE | /api/produtos/:id | Private | Delete product |
| produtos | GET | /api/produtos/barcode/:codigo | Private | Lookup by barcode |
| produtos | POST | /api/produtos/marcas | Private | Create brand |
| produtos | GET | /api/produtos/marcas/all | Private | List brands |
| produtos | POST | /api/produtos/categorias | Private | Create category |
| produtos | GET | /api/produtos/categorias/all | Private | List categories |
| compras | POST | /api/compras | Private | Create purchase |
| compras | GET | /api/compras | Private | List purchases |
| compras | GET | /api/compras/:id | Private | Get purchase |
| compras | GET | /api/compras/stats | Private | Stats |
| compras | DELETE | /api/compras/:id | Private | Delete purchase |
| inventario | POST | /api/inventario | Private | Add item |
| inventario | GET | /api/inventario | Private | List inventory |
| inventario | GET | /api/inventario/:id | Private | Get item |
| inventario | GET | /api/inventario/stats | Private | Stats |
| inventario | GET | /api/inventario/vencendo | Private | Expiring soon |
| inventario | GET | /api/inventario/vencidos | Private | Expired items |
| inventario | PATCH | /api/inventario/:id | Private | Update item |
| inventario | DELETE | /api/inventario/:id | Private | Remove item |
| receitas | POST | /api/receitas | Private | Create recipe |
| receitas | GET | /api/receitas | Private | List recipes |
| receitas | GET | /api/receitas/:id | Private | Get recipe |
| receitas | GET | /api/receitas/sugestoes | Private | Suggestions |
| receitas | GET | /api/receitas/executadas | Private | History |
| receitas | POST | /api/receitas/:id/executar | Private | Mark executed |
| receitas | DELETE | /api/receitas/:id | Private | Delete recipe |
| scraper | POST | /api/scraper/consultas | Private | Start OCR |
| scraper | GET | /api/scraper/consultas/:id | Private | Check status |
| scraper | POST | /api/scraper/consultas/:id/captcha-resolvido | Private | CAPTCHA notify |
| scraper | DELETE | /api/scraper/consultas/:id | Private | Cancel |
| scraper | GET | /api/scraper/minhas-consultas | Private | User queries |
| scraper | DELETE | /api/scraper/minhas-consultas | Private | Clear history |
| barcode | GET | /api/barcode/scan/:codigo | Private | Scan barcode |
| product-classification | GET | /api/product-classification/classify/:name | Private | Classify |
| product-classification | POST | /api/product-classification/classify-batch | Private | Batch classify |
| product-classification | POST | /api/product-classification/inventory/add | Private | Add to inventory |
| product-classification | POST | /api/product-classification/validate | Private | Manual validation |
| product-classification | GET | /api/product-classification/history/:name | Private | Validation history |
| product-classification | GET | /api/product-classification/statistics | Private | Stats |
| product-classification | GET | /api/product-classification/alimentos | Private | Food list |
| product-classification | GET | /api/product-classification/nao-alimentos | Private | Non-food list |
| affiliate | POST | /api/affiliate/registrar-clique | Private | Track click |
| affiliate | GET | /api/affiliate/links/:receitaId | Public | Get links |
| affiliate | GET | /api/affiliate/estatisticas | Private | Statistics |
| affiliate | GET | /api/affiliate/comissoes | Private | Commissions |
| affiliate | GET | /api/affiliate/recomendacoes/com-meus-alimentos | Private | Suggestions |
| affiliate | GET | /api/affiliate/recomendacoes/incentivo-compra | Private | Buy incentive |
| affiliate | POST | /api/affiliate/recomendacoes/:id/clique | Private | Track click |
| affiliate | GET | /api/affiliate/subscriptions/status | Private | Sub status |
| affiliate | POST | /api/affiliate/subscriptions/criar | Private | Create sub |
| affiliate | POST | /api/affiliate/subscriptions/:id/atualizar | Private | Update plan |
| affiliate | POST | /api/affiliate/subscriptions/:id/cancelar | Private | Cancel |
| affiliate | GET | /api/affiliate/subscriptions/features/:feature | Private | Check feature |

---

## Database Tables & Relationships

```
usuarios (PK: id)
├── preferencias (1:1)
├── compras (1:∞)
├── inventario (1:∞)
├── receita_executada (1:∞)
├── affiliate_clicks (1:∞)
├── subscriptions (1:∞)
└── transactions (1:∞)

produtos (PK: id)
├── marcas (FK: marca_id)
├── categorias (FK: categoria_id)
├── compra_itens (1:∞)
├── inventario (1:∞)
└── receita_ingredientes (1:∞)

compras (PK: id)
└── compra_itens (1:∞)

receitas (PK: id)
├── receita_ingredientes (1:∞)
├── receita_executada (1:∞)
└── affiliate_links (1:∞)

categorias (PK: id)
├── categorias (self-join for hierarchy)
└── produtos (1:∞)

affiliate_links (PK: id)
└── affiliate_clicks (1:∞)

affiliate_clicks (PK: id)
└── affiliate_conversions (1:∞)

subscriptions (PK: id)
└── transactions (1:∞)

product_knowledge_base (PK: id) - Classification cache
product_validation (PK: id) - User validations
ai_classification_log (PK: id) - API logs
recipe_recommendation (PK: id) - Recommendations
```

---

## Key Features by Module

### Core Features
- User authentication & authorization
- Product catalog management
- Purchase history tracking
- Inventory management with expiry alerts
- Recipe suggestions based on inventory (MOI Engine)

### Advanced Features
- OCR-based receipt scanning (Brazilian SAT system)
- AI-powered product classification
- Affiliate marketing & commission tracking
- Subscription management (Stripe integration)
- Recommendation engine

### Admin Capabilities (to implement)
- User management
- Product verification workflow
- Analytics dashboard
- Moderation tools
- System monitoring

---

## Environment Setup

### API Base URL
```
Development:  http://localhost:3000/api
Production:   https://api.cookme.com/api (example)
```

### Documentation
```
Swagger Docs:  http://localhost:3000/api/docs
Health Check:  http://localhost:3000/api/health (if implemented)
```

### CORS Policy
```
Allowed Origins:
- http://localhost:3001 (web)
- http://localhost:19006 (React Native Expo)
- http://192.168.86.7:8081 (local network)
```

---

## Authentication Headers

All protected endpoints require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

