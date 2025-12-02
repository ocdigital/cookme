# Admin Dashboard - Quick Start Guide

## Quick API Reference for Admin Features

### Authentication
```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "senha": "password"
}

# Response includes:
# - access_token (Bearer token for requests)
# - refresh_token (for renewing access)
# - user object with role: "admin"
```

---

## Admin Resources Available

### 1. User Management Dashboard
**Current Endpoints:**
- `GET /api/usuarios/me` - View own profile
- `PATCH /api/usuarios/me` - Update own profile

**Needed for Admin Panel:**
- `GET /api/usuarios` (admin-only, list all users)
- `PATCH /api/usuarios/:id` (admin-only, manage user roles)
- `DELETE /api/usuarios/:id` (admin-only, remove users)

**Admin Queries to Implement:**
```
- Filter by role (USER, PREMIUM, ADMIN, MARCA)
- Filter by registration date range
- Filter by last login date
- Search by email/name
- Sort by status, creation date
```

---

### 2. Product Catalog Management
**Available Endpoints:**
```
POST /api/produtos - Create product
GET /api/produtos - List all products (search, filter by category)
GET /api/produtos/:id - Get product details
PATCH /api/produtos/:id - Update product
DELETE /api/produtos/:id - Delete product

POST /api/produtos/marcas - Create brand
GET /api/produtos/marcas/all - List all brands

POST /api/produtos/categorias - Create category
GET /api/produtos/categorias/all - List all categories (hierarchical)
```

**Admin Features to Build:**
- Bulk product import (CSV)
- Product verification workflow
- View product origin and verification status
- Manage category hierarchy
- View products by verification status
- Image management gallery
- Nutritional information editor

---

### 3. Recipe Management
**Available Endpoints:**
```
POST /api/receitas - Create recipe
GET /api/receitas - List with filters
GET /api/receitas/:id - Get recipe details
DELETE /api/receitas/:id - Delete recipe
```

**Admin Features to Build:**
- View all recipes by origin (catalogo, ia_gerada, usuario)
- Manage featured recipes
- View execution metrics
- Rating and popularity analysis
- Content moderation

---

### 4. Analytics Dashboard
**Available Endpoints:**
```
GET /api/compras/stats - Purchase statistics (user's own)
GET /api/inventario/stats - Inventory statistics (user's own)
GET /api/product-classification/statistics - Classification metrics
GET /api/affiliate/estatisticas - Affiliate statistics (with date range)
```

**Dashboard Metrics to Display:**
- Total registered users by role
- Active users (daily, weekly, monthly)
- Purchase frequency analysis
- Revenue by subscription plan
- Affiliate commission totals
- Product classification accuracy
- Feature adoption rates
- API usage metrics

---

### 5. Subscription & Monetization Management
**Available Endpoints:**
```
GET /api/affiliate/subscriptions/status (user-specific)
POST /api/affiliate/subscriptions/criar
POST /api/affiliate/subscriptions/:assinaturaId/atualizar
POST /api/affiliate/subscriptions/:assinaturaId/cancelar
GET /api/affiliate/subscriptions/features/:feature (user-specific)
```

**Admin Features to Build:**
- Dashboard of all active subscriptions
- View subscription revenue by plan
- Manage subscription plans
- Churn analysis
- Payment history
- Feature access management

---

### 6. Affiliate & Commission Management
**Available Endpoints:**
```
GET /api/affiliate/estatisticas - Get statistics by date range
GET /api/affiliate/comissoes (user-specific)
GET /api/affiliate/links/:receitaId - Get links for recipe
```

**Admin Features to Build:**
- All affiliate links management
- Commission tracking and payouts
- Click and conversion analytics
- Partner management
- Revenue sharing reports

---

### 7. Product Classification Moderation
**Available Endpoints:**
```
GET /api/product-classification/classify/:productName
POST /api/product-classification/classify-batch
GET /api/product-classification/history/:productName
GET /api/product-classification/statistics
GET /api/product-classification/alimentos
GET /api/product-classification/nao-alimentos
```

**Admin Features to Build:**
- Queue of pending classifications (low confidence)
- Approve/reject classifications
- View confidence scores
- Bulk validation
- Manual classification override
- System accuracy metrics

---

### 8. OCR & Receipt Management
**Available Endpoints:**
```
GET /api/scraper/minhas-consultas (user-specific)
GET /api/scraper/consultas/:sessionId
POST /api/scraper/consultas - Start new consultation
DELETE /api/scraper/consultas/:sessionId
```

**Admin Features to Build:**
- Monitor OCR processing queue
- View successful/failed extractions
- Error rate analysis
- Processing time metrics
- Manual receipt review/correction

---

## Data Models for Admin Dashboard

### User Entity
```json
{
  "id": "uuid",
  "email": "string",
  "nome": "string",
  "role": "USER|PREMIUM|ADMIN|MARCA",
  "alertas_habilitados": boolean,
  "horario_alertas": "string (time)",
  "avatar_url": "string",
  "email_verificado": boolean,
  "ultimo_acesso": "timestamp",
  "criado_em": "timestamp",
  "atualizado_em": "timestamp"
}
```

### Product Entity
```json
{
  "id": "uuid",
  "nome": "string",
  "descricao": "string",
  "codigo_barras": "string",
  "marca_id": "uuid",
  "categoria_id": "uuid",
  "informacoes_nutricionais": {
    "calorias": number,
    "proteinas": number,
    "carboidratos": number,
    "gorduras": number,
    "fibras": number,
    "sodio": number,
    "acucares": number
  },
  "tags": ["string"],
  "origem": "manual|api_externa|usuario|marca",
  "verificado": boolean,
  "criado_em": "timestamp",
  "atualizado_em": "timestamp"
}
```

### Purchase Entity
```json
{
  "id": "uuid",
  "usuario_id": "uuid",
  "data_compra": "date",
  "local_compra": "string",
  "valor_total": decimal,
  "metodo_cadastro": "MANUAL|OCR|BARCODE",
  "tempo_cadastro_segundos": number,
  "itens": [
    {
      "id": "uuid",
      "produto_id": "uuid",
      "quantidade": decimal,
      "preco_unitario": decimal,
      "preco_total": decimal,
      "validade_final": "date"
    }
  ]
}
```

---

## Implementation Checklist

### Phase 1: User Management
- [ ] List all users endpoint (admin)
- [ ] User detail/profile view
- [ ] Role assignment interface
- [ ] User search and filters
- [ ] User activity timeline

### Phase 2: Product Catalog
- [ ] Product list view with pagination
- [ ] Product creation/edit form
- [ ] Bulk import CSV
- [ ] Category hierarchy manager
- [ ] Brand management
- [ ] Verification workflow

### Phase 3: Recipe Management
- [ ] Recipe list with filters
- [ ] Recipe editor
- [ ] Featured recipes toggle
- [ ] Execution metrics view

### Phase 4: Analytics Dashboard
- [ ] User metrics (DAU, MAU, growth)
- [ ] Revenue dashboard
- [ ] Product statistics
- [ ] Classification metrics
- [ ] Export capabilities (CSV, PDF)

### Phase 5: Subscription Management
- [ ] Active subscriptions view
- [ ] Revenue by plan
- [ ] Churn analysis
- [ ] Plan configuration

### Phase 6: Moderation Tools
- [ ] Low-confidence product review queue
- [ ] Manual validation form
- [ ] Bulk approve/reject
- [ ] Classification history

### Phase 7: System Monitoring
- [ ] OCR queue status
- [ ] Error tracking
- [ ] API metrics
- [ ] Cache hit rates
- [ ] System health checks

---

## Authorization Requirements

All admin endpoints need to add role protection. Use the `@Roles(UserRole.ADMIN)` decorator:

```typescript
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { RolesGuard } from '@common/guards/roles.guard';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin/users')
async getAllUsers() {
  // Admin-only endpoint
}
```

---

## Database Query Examples

### High-value admin queries to add:

```sql
-- User statistics
SELECT role, COUNT(*) as total, 
       MAX(ultimo_acesso) as last_active
FROM usuarios
GROUP BY role;

-- Revenue by subscription
SELECT plano, COUNT(*) as active_count,
       SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as active
FROM subscriptions
GROUP BY plano;

-- Product verification status
SELECT origem, verificado, COUNT(*) as total
FROM produtos
GROUP BY origem, verificado;

-- Top products by purchases
SELECT p.id, p.nome, COUNT(ci.id) as times_purchased
FROM produtos p
LEFT JOIN compra_itens ci ON p.id = ci.produto_id
GROUP BY p.id, p.nome
ORDER BY times_purchased DESC
LIMIT 20;

-- Classification accuracy
SELECT categoria, confidence_score,
       COUNT(*) as total
FROM product_knowledge_base
GROUP BY categoria, ROUND(confidence_score, 2);
```

---

## Frontend Integration Points

### Admin Dashboard Navigation:
```
Dashboard (main)
├── Users
│   ├── All Users
│   ├── Roles Management
│   └── Activity Log
├── Products
│   ├── Catalog
│   ├── Categories
│   ├── Brands
│   └── Verification Queue
├── Recipes
│   ├── All Recipes
│   ├── Featured
│   └── Metrics
├── Analytics
│   ├── Overview
│   ├── Users
│   ├── Revenue
│   ├── Products
│   └── Export
├── Monetization
│   ├── Subscriptions
│   ├── Affiliates
│   └── Commissions
├── Moderation
│   ├── Classifications
│   ├── OCR Queue
│   └── Reports
└── System
    ├── Health
    ├── Logs
    └── Config
```

---

## Testing Admin Features

```bash
# Get JWT token for admin user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"password"}'

# Use token in requests
curl http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer <access_token>"
```

---

## Performance Considerations

### Indexed Queries (fast):
- usuario_id lookups
- email searches (unique indexed)
- codigo_barras lookups
- data_validade filters (expiration queries)
- role queries
- criado_em date filters

### Need pagination for:
- User lists
- Product lists
- Purchase lists
- Recipe lists
- Recommendation lists

### Consider caching:
- Category hierarchy (rarely changes)
- Brand list (rarely changes)
- Active subscriptions count
- Classification statistics

---

