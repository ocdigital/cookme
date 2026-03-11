# CookMe Frontend-Backend Integration Plan

## 📋 Executive Summary

The **CookMe backend is ~70% ready** for frontend integration. Core CRUD operations are functional, but **AI-powered features** are incomplete. This document outlines the integration roadmap prioritized by criticality.

---

## 🔴 CRITICAL (Blocking Frontend Functionality)

### 1. Fix Frontend Services Integration

**Current Status**: Services exist but need API endpoint verification and error handling

**Files to Update**:
- `frontend/src/services/authService.ts` - Verify auth endpoints
- `frontend/src/services/userService.ts` - Profile & preferences endpoints
- `frontend/src/services/adminService.ts` - Admin dashboard endpoints
- `frontend/src/services/productService.ts` - Create this if missing
- `frontend/src/services/inventoryService.ts` - Create this if missing
- `frontend/src/services/recipeService.ts` - Create/update recipe endpoints

**Expected API Base URL**: `http://localhost:3000/api`

**Authentication**: All endpoints require `Authorization: Bearer <access_token>` except:
- `POST /auth/register`
- `POST /auth/login`

**Implementation Checklist**:
```typescript
// Example for each service:

// Auth Service
- POST /auth/register { email, senha, nome }
- POST /auth/login { email, senha }
- POST /auth/refresh { refreshToken }
- POST /auth/logout
- GET /auth/me

// Users Service
- GET /usuarios/me
- PATCH /usuarios/me { nome, telefone, avatar_url }
- POST /usuarios/me/avatar { avatar_url }
- GET /usuarios/preferencias
- PATCH /usuarios/preferencias { tags_dieta, tags_preparo, ingredientes_evitar }

// Products Service
- GET /produtos?page=1&limit=20&search=termo&categoriaId=uuid
- GET /produtos/search?q=termo (autocomplete)
- GET /produtos/:id
- POST /produtos (admin only)
- PATCH /produtos/:id (admin only)
- DELETE /produtos/:id (admin only)
- GET /produtos/marcas/all
- GET /produtos/categorias/all

// Inventory Service
- POST /inventario { produto_id, quantidade, unidade, data_validade, local_armazenagem }
- GET /inventario?page=1&limit=20
- GET /inventario/stats
- GET /inventario/vencendo?dias=7
- GET /inventario/vencidos
- PATCH /inventario/:id
- DELETE /inventario/:id

// Purchases Service
- POST /compras { itens: [{produto_id, quantidade, preco_unitario}], local_compra, preco_total }
- GET /compras
- GET /compras/:id
- DELETE /compras/:id
- GET /compras/stats

// Recipes Service
- POST /receitas { nome, modo_preparo, tempo_preparo, rendimento_porcoes, dificuldade, tags_dieta, categoria_receita, ingredientes }
- GET /receitas?page=1&limit=20&dificuldade=FACIL&tags_dieta=vegetarian
- GET /receitas/:id
- PUT /receitas/:id
- POST /receitas/:id/executar { porcoes_feitas, tempo_real_preparo, avaliacao, comentario }
- DELETE /receitas/:id
- GET /receitas/sugestoes (MOI engine - needs completion)
- POST /receitas/gerar-com-ia (AI generation - needs implementation)

// Admin Service
- GET /admin/produtos?page=1&limit=20&search=termo&categoriaId=uuid
- GET /admin/produtos/stats
- GET /admin/usuarios?page=1&limit=20&search=termo&role=USER
- GET /admin/usuarios/stats
- GET /admin/dashboard/stats
```

---

### 2. Implement AI Recipe Generation in Backend

**Current Status**: Endpoints declared but services incomplete

**Files to Create/Update**:
- `backend/src/modules/ia/ia.service.ts` - Complete AI service
- `backend/src/modules/receitas/services/ia-receitas.service.ts` - Recipe generation logic

**Required Implementation**:

```typescript
// 1. Recipe Generation from Ingredients (AI)
POST /receitas/gerar-com-ia
Request: {
  ingredientes: ['tomate', 'alface', 'queijo'],
  preferencias?: {
    dificuldade: 'FACIL',
    tempo_preparo_maximo: 30,
    tags_dieta: ['vegetarian'],
    porcoes: 4
  }
}
Response: {
  receita: {
    nome: 'Salada Caprese Simples',
    modo_preparo: '...',
    tempo_preparo: 15,
    rendimento_porcoes: 4,
    dificuldade: 'FACIL',
    ingredientes: [...]
  }
}

// 2. Recipe Generation from Inventory
POST /receitas/gerar-do-inventario
Request: {
  quantidade_receitas: 5,
  preferencias?: {...}
}
Response: [{ receita }, ...]

// 3. Weekly Meal Plan Generation
POST /receitas/gerar-semana
Request: {
  porcoes_por_dia: 3,
  preferencias?: {...}
}
Response: {
  semana: [
    { dia: 'SEGUNDA', cafe_da_manha: {...}, almoco: {...}, jantar: {...} },
    ...
  ]
}

// 4. Product Classification (AI)
POST /ia/classificar-produto
Request: {
  nome: 'Salada Verde Orgânica 200g',
  descricao: '...',
  codigo_barras?: '...'
}
Response: {
  categoria_id: 'uuid',
  marca?: 'Marca X',
  tipo: 'ALIMENTO',
  tags: ['organic', 'vegan'],
  informacoes_nutricionais: {...}
}

// 5. Smart Shopping List
POST /ia/sugerir-compras
Request: {
  receitas_proximas: 3,
  preferencias?: {...}
}
Response: {
  lista_compras: [
    { produto_id, quantidade, unidade, prioridade },
    ...
  ]
}
```

**Google Generative AI Integration** (Required):
```typescript
// Install: npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const response = await model.generateContent(prompt);
```

**Environment Variable Needed**:
```
GOOGLE_AI_API_KEY=your_api_key_here
```

---

### 3. Complete Barcode Scanning

**Current Status**: Route exists but no implementation

**Files to Update**:
- `backend/src/modules/barcode/barcode.service.ts`
- `backend/src/modules/barcode/barcode.controller.ts`

**Implementation Strategy**:

```typescript
// Option 1: Database Lookup (Fastest)
GET /api/barcode/scan/:codigo
Response: {
  produto: {
    id, nome, marca, categoria, unidade_padrao,
    informacoes_nutricionais, ...
  },
  encontrado: boolean
}

// Option 2: External API Fallback (Barcode.Guru, Open Food Facts)
- If not found in database, query external API
- Cache result for future lookups
```

**Frontend Implementation** (Already ready for integration):
- React Native: Use `react-native-camera` or `expo-barcode-scanner`
- Web: Use `html5-qrcode` library
- Both should call: `GET /api/barcode/scan/:codigo`

---

### 4. Complete MOI Engine (Intelligent Recipe Recommendations)

**Current Status**: Placeholder implementation returning top-rated recipes

**Files to Update**:
- `backend/src/modules/receitas/services/receitas.service.ts` - Method `sugerirReceitas()`

**Implementation Requirements**:

```typescript
GET /receitas/sugestoes?limit=10
Response: [
  {
    receita: {...},
    score: 8.5, // Matching score 0-10
    razoes: ['Tem ingredientes do seu inventário', 'Corresponde suas preferências']
  },
  ...
]
```

**Algorithm**:
1. **Weight Factors** (0-10 scale):
   - Ingredient availability in inventory: 40%
   - User preference matching (diet tags): 25%
   - User execution history (liked recipes): 20%
   - Recipe difficulty: 10%
   - Nutrition goals: 5%

2. **Score Calculation**:
```
score = (ingredient_match * 0.4) +
        (preference_match * 0.25) +
        (history_match * 0.20) +
        (difficulty_match * 0.10) +
        (nutrition_match * 0.05)
```

3. **Sorting**: By score descending, then by creation date

---

## 🟡 MEDIUM PRIORITY (Important for MVP)

### 5. Enhanced Error Handling & Response Format

**Current Status**: Basic error handling exists

**Needed**:
- Consistent error response format across all endpoints
- User-friendly error messages in Portuguese
- Proper HTTP status codes (400, 401, 403, 404, 422, 500)
- Validation errors with field-level feedback

**Standard Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validação falhou",
  "errors": {
    "email": ["Email já está registrado"],
    "senha": ["Senha deve ter no mínimo 8 caracteres"]
  }
}
```

### 6. Pagination Implementation

**Current Status**: Some endpoints support it, needs standardization

**Standard Pagination Response**:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 7. Add Rate Limiting

**Purpose**: Prevent abuse of AI generation endpoints

```typescript
// Use @nestjs/throttler
@Throttle(10, 60) // 10 requests per 60 seconds
POST /receitas/gerar-com-ia
```

### 8. Add Audit Logging for Admin Actions

**Track**:
- User logins/logouts
- Product creation/updates/deletes
- User role changes
- Sensitive operations

---

## 🟢 LOW PRIORITY (Nice to Have)

### 9. Soft Delete for User Accounts

**Purpose**: Data preservation and account recovery

### 10. Implement User Search Filters

**Needed for**: Admin user management page

```typescript
GET /admin/usuarios?role=USER&email_verificado=true&status=ativo
```

### 11. Add Affiliate Links Management

**Status**: Module exists but needs inspection

### 12. Add Web Scraping for Price Comparison

**Status**: Scraper module exists but needs inspection

---

## 📊 Integration Testing Checklist

### Auth Flow
- [ ] Register new user
- [ ] Login returns access & refresh tokens
- [ ] Refresh token rotates properly
- [ ] Logout invalidates tokens
- [ ] Protected routes reject invalid tokens

### Product Management
- [ ] List products with pagination
- [ ] Search/filter by category
- [ ] Get product by barcode
- [ ] Admin can create/update/delete

### Inventory Management
- [ ] Add item to inventory
- [ ] List with expiration dates
- [ ] Find items expiring soon
- [ ] Update quantities

### Recipe Management
- [ ] Create recipe with ingredients
- [ ] List with filters
- [ ] Execute/track recipe usage
- [ ] Generate AI recipes ✅ (once implemented)

### Purchases
- [ ] Create purchase with items
- [ ] Track spending by category
- [ ] View purchase history

### Notifications
- [ ] Receive notifications
- [ ] Mark as read
- [ ] Unread count updates

---

## 🚀 Recommended Implementation Order

1. **Week 1**: Fix frontend service calls + Auth validation
2. **Week 2**: Complete AI recipe generation (highest user value)
3. **Week 3**: Implement MOI engine + barcode scanning
4. **Week 4**: Smart shopping suggestions + error handling refinement

---

## 📝 API Documentation

Full Swagger docs available at:
```
http://localhost:3000/api/docs
```

---

## 🔐 Authentication Flow

```
1. User registers → POST /auth/register
2. User logs in → POST /auth/login
3. Receive: { accessToken, refreshToken, user }
4. Store tokens (accessToken in memory, refreshToken in localStorage)
5. Send: Authorization: Bearer {accessToken}
6. When expires (usually 15min) → POST /auth/refresh
7. Get new accessToken
8. Logout → POST /auth/logout
```

---

## 📱 Key Endpoints Summary

| Feature | Endpoint | Status |
|---------|----------|--------|
| Auth | `/auth/*` | ✅ Ready |
| User Profile | `/usuarios/me` | ✅ Ready |
| Products Catalog | `/produtos` | ✅ Ready |
| Inventory | `/inventario` | ✅ Ready |
| Purchases | `/compras` | ✅ Ready |
| Recipes | `/receitas` | ⚠️ Partial (no AI) |
| AI Generation | `/receitas/gerar-com-ia` | ❌ Not Implemented |
| MOI Engine | `/receitas/sugestoes` | ⚠️ Placeholder |
| Barcode Scan | `/barcode/scan/:codigo` | ❌ Not Implemented |
| Admin Dashboard | `/admin/*` | ✅ Ready |
| Notifications | `/notificacoes` | ✅ Ready |

---

## 💡 Notes

- **Google AI Key**: Needed for recipe generation. Get from: https://ai.google.dev/
- **Cache**: Redis used for frequently accessed data (5-10 min TTL)
- **CORS**: Configured for localhost:3001, localhost:5173, localhost:19006
- **Response Time**: Most endpoints should respond in <200ms (with cache)
- **Rate Limits**: AI endpoints should be throttled to prevent abuse

