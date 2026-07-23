# Admin Dashboard Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Frontend (React)                   │
│  ┌──────────────┬──────────────┬──────────────────────────┐  │
│  │  UsersPage   │ ProductsPage │    RecipesPage          │  │
│  └──────────────┴──────────────┴──────────────────────────┘  │
│           │                │                │                │
│           │                │                │                │
└───────────┼────────────────┼────────────────┼────────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                ┌────────────▼────────────┐
                │  adminService.ts       │
                │  (API Client)          │
                │ listUsers()            │
                │ listProducts()         │
                │ listRecipes()          │
                │ atualizarModeracaoRecei│
                └────────────▲────────────┘
                             │
                    HTTP + JWT Bearer Token
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    NestJS Backend                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            AdminController                           │   │
│  │  GET  /admin/usuarios                                │   │
│  │  GET  /admin/produtos                                │   │
│  │  GET  /admin/receitas                                │   │
│  │  PATCH /admin/receitas/:id/moderacao                 │   │
│  │  GET  /admin/dashboard/stats                         │   │
│  └──────────────▲─────────────────────────────────────┘    │
│                 │                                             │
│  ┌──────────────▼─────────────────────────────────────┐    │
│  │            AdminService                            │    │
│  │                                                    │    │
│  │  • listUsers()                                     │    │
│  │    ├─ Query Usuario table                         │    │
│  │    ├─ Calculate nivel_atividade                   │    │
│  │    ├─ Count receitas_criadas (placeholder)        │    │
│  │    └─ Return enriched response                    │    │
│  │                                                    │    │
│  │  • listProducts()                                 │    │
│  │    ├─ Query Produto table with joins             │    │
│  │    ├─ LEFT JOIN receita_ingredientes             │    │
│  │    ├─ Calculate qualidade                        │    │
│  │    ├─ Calculate popularidade                     │    │
│  │    ├─ Count vezes_usada                         │    │
│  │    └─ Return enriched response                    │    │
│  │                                                    │    │
│  │  • listRecipes()                                  │    │
│  │    ├─ Query Receita table                        │    │
│  │    ├─ Apply filters & pagination                 │    │
│  │    └─ Return with denuncias & status_moderacao   │    │
│  │                                                    │    │
│  │  • atualizarModeracaoReceita()                    │    │
│  │    ├─ Find receita by ID                         │    │
│  │    ├─ Update status_moderacao                    │    │
│  │    └─ Persist changes                            │    │
│  └──────────────▲─────────────────────────────────────┘    │
│                 │                                             │
│  ┌──────────────▼────────────────────────────────────────┐  │
│  │              TypeORM Entities                          │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Usuario  │  │ Produto  │  │ Receita  │           │  │
│  │  │----------|  │----------|  │----------|           │  │
│  │  │ id       │  │ id       │  │ id       │           │  │
│  │  │ nome     │  │ nome     │  │ nome     │           │  │
│  │  │ email    │  │ categoria│  │ dificuldade         │  │
│  │  │ role     │  │ marca    │  │ denuncias│           │  │
│  │  │ ultimo_ac│  │ imagem   │  │ status_m │           │  │
│  │  └──────────┘  │ nutrientes            │           │  │
│  │                │ codigo_bar│  └──────────┘           │  │
│  │  ┌─────────────┤ verificad│                          │  │
│  │  │             └──────────┘                          │  │
│  │  │   ┌──────────────────────┐                        │  │
│  │  │   │ ReceitaIngrediente   │                        │  │
│  │  │   │──────────────────────│                        │  │
│  │  │   │ receita_id (FK)      │                        │  │
│  │  │   │ produto_id (FK) ─────┘                        │  │
│  │  └───┤ quantidade           │                        │  │
│  │      └──────────────────────┘                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                            │
              PostgreSQL Database (TypeORM)
```

## Data Flow Examples

### Example 1: Load Users with Activity Level

**Frontend Request:**
```javascript
const response = await adminService.listUsers(1, 20, { role: 'user' });
```

**Backend Processing:**
```
1. Controller receives GET /admin/usuarios?page=1&limit=20&role=user
2. Service queries Usuario table with role filter
3. For each user:
   - Calculate nivel_atividade from ultimo_acesso:
     - ≤ 7 days → "alta"
     - ≤ 30 days → "media"
     - ≤ 90 days → "baixa"
     - else → "inativa"
   - Count recipes (currently returns 0 as placeholder)
4. Return enriched response with calculated fields
```

**Frontend Display:**
```
┌─────────────────────────────────────────────┐
│ User Name          │ user@email.com          │
│ Nível: alta        │ Receitas: 5             │
│ Email Verificado: ✓│ Criação: 2026-01-15     │
└─────────────────────────────────────────────┘
```

### Example 2: Load Products with Quality & Popularity

**Frontend Request:**
```javascript
const response = await adminService.listProducts(1, 20, { search: 'arroz' });
```

**Backend Processing:**
```
1. Controller receives GET /admin/produtos?page=1&limit=20&search=arroz
2. Service:
   a) Query Produto table with name ILIKE filter
   b) LEFT JOIN categoria and marca
   c) LEFT JOIN receita_ingredientes for each product
   d) For each product calculate:
      - qualidade: check image, nutrients, barcode, verification
      - vezes_usada: count from ingredientes join
      - popularidade: (vezes_usada / max_usos) * 100
   e) Return enriched response
```

**Database Queries:**
```sql
-- Main query
SELECT produto.*, categoria.*, marca.*
FROM produto
LEFT JOIN categoria ON produto.categoria_id = categoria.id
LEFT JOIN marca ON produto.marca_id = marca.id
WHERE produto.nome ILIKE '%arroz%'
ORDER BY produto.criado_em DESC
LIMIT 20 OFFSET 0;

-- Usage count subquery
SELECT produto_id, COUNT(*) as count
FROM receita_ingrediente
GROUP BY produto_id;
```

**Frontend Display:**
```
┌─────────────────────────────────────────────┐
│ ARROZ BRANCO 5KG                            │
│ Marca: Bom Preço  │ Categoria: Alimentos   │
│                                             │
│ Qualidade: [Completo] │ Vezes Usada: 15    │
│ Popularidade: ████████░░ 75%               │
└─────────────────────────────────────────────┘
```

### Example 3: Archive a Recipe (Moderation)

**Frontend Request:**
```javascript
await adminService.atualizarModeracaoReceita(
  'recipe-uuid-123',
  'arquivado'
);
```

**Backend Processing:**
```
1. Controller receives PATCH /admin/receitas/recipe-uuid-123/moderacao
2. Body: { status: "arquivado" }
3. Service:
   a) Find Receita by ID
   b) Set status_moderacao = "arquivado"
   c) Save to database
   d) Return updated receita
```

**Database Change:**
```sql
UPDATE receita
SET status_moderacao = 'arquivado'
WHERE id = 'recipe-uuid-123';
```

## Key Design Decisions

### 1. Calculated vs. Stored Fields

**Decision:** Calculate on read, don't store in database

**Rationale:**
- Reduces database schema complexity
- Avoids synchronization issues
- Fields update automatically as underlying data changes
- Better for real-time accuracy (e.g., nivel_atividade changes every day)

**Example:** `nivel_atividade` is calculated from `ultimo_acesso` timestamp at query time, not stored in database

### 2. LEFT JOIN for Product Usage

**Decision:** Use LEFT JOIN receita_ingredientes instead of separate queries

**Rationale:**
- Single efficient query instead of N+1 problem
- Database can optimize join execution
- All usage data fetched in one round trip

### 3. Pagination on Backend

**Decision:** Apply pagination at database query level, not in-memory

**Rationale:**
- Scales to large datasets (100K+ records)
- Consistent with REST API best practices
- Frontend doesn't need to fetch entire dataset

## Authentication & Authorization

All admin endpoints require:

1. **Bearer Token:** JWT in Authorization header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

2. **Role Check:** Can be added in guards (currently not enforced at admin level)
```typescript
@UseGuards(JwtAuthGuard)
// Can add @Roles('admin') if needed
```

3. **Database User Table** stores:
- `id`, `email`, `nome`, `role` (user/moderador/admin)
- `ultimo_acesso`, `email_verificado`, `alertas_habilitados`

## Performance Considerations

### Database Indexes
Required for optimal performance:
```sql
-- Usuario table
CREATE INDEX idx_usuario_role ON usuario(role);
CREATE INDEX idx_usuario_ultimo_acesso ON usuario(ultimo_acesso);

-- Produto table
CREATE INDEX idx_produto_nome ON produto USING gin(nome gin_trgm_ops);
CREATE INDEX idx_produto_codigo ON produto(codigo_barras);

-- Receita table
CREATE INDEX idx_receita_nome ON receita USING gin(nome gin_trgm_ops);
CREATE INDEX idx_receita_status ON receita(status_moderacao);

-- ReceitaIngrediente table (critical for product popularity)
CREATE INDEX idx_ingrediente_produto ON receita_ingrediente(produto_id);
CREATE INDEX idx_ingrediente_receita ON receita_ingrediente(receita_id);
```

### Query Optimization
- Product popularity calculation uses indexed LEFT JOIN
- User filters by role (indexed) and search (ILIKE if necessary)
- Recipe filters by dificuldade, categoria (indexed)
- Pagination: LIMIT + OFFSET

### Caching
- Dashboard stats endpoint: 3-minute TTL
- Other endpoints: No caching (real-time data required)

## Error Handling

**Common Scenarios:**

1. **401 Unauthorized**
   - Token missing or expired
   - Client: Check localStorage for accessToken
   - Server: JWT guard rejects request

2. **404 Not Found**
   - Resource doesn't exist
   - Example: Recipe ID not found during moderation update

3. **400 Bad Request**
   - Invalid filter or pagination parameters
   - Example: page=0 (should be ≥1)

4. **500 Internal Server Error**
   - Database connection lost
   - Query timeout
   - Application error

## Future Enhancements

1. **Add criado_por_id to Receita**
   - Enables accurate receitas_criadas count per user
   - Requires migration and recipe entity update

2. **Moderation Queue**
   - Auto-flag recipes with >5 denúncias
   - Priority queue for admin review

3. **Product Quality Dashboard**
   - Show products by quality tier
   - Batch update missing nutrients data

4. **User Engagement Metrics**
   - Track specific actions (not just login)
   - Calculate engagement score

5. **Export Functionality**
   - Export user list to CSV
   - Export product inventory to Excel

## Testing Endpoints

See [Admin — Testes de Integração](/how-to/admin-testes-integracao) for complete testing guide with curl examples.
