# Admin Integration Testing Guide

## Quick Start (5 minutes)

### 1. Start the Backend

```bash
cd /home/eduardo/projetos/cookme
./dev.sh backend
```

Expected output:

```
[NestFactory] Starting NestApplication ...
[Bootstrap] 🚀 Aplicação rodando em: http://localhost:3000
[Bootstrap] 📚 Documentação Swagger: http://localhost:3000/api/docs
```

### 2. Start the Frontend (in new terminal)

```bash
./dev.sh frontend
```

Expected output:

```
  VITE v7.2.2  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
```

### 3. Login to Frontend

1. Open <http://localhost:5173> in browser
2. Login with any registered account (or create one)
3. Navigate to "Admin" section (usually in sidebar/menu)

## Verification Checklist

### Users Page

**Location:** Admin → Users

**Expected Data:**

- [ ] Page loads without errors
- [ ] Users list displays 5+ users
- [ ] Each user shows:
  - [ ] Name
  - [ ] Email
  - [ ] Role (admin/moderador/user)
  - [ ] **Nível Atividade** (NOVO):
    - [ ] Alta (last 7 days)
    - [ ] Média (last 30 days)
    - [ ] Baixa (last 90 days)
    - [ ] Inativa (90+ days or never)
  - [ ] **Receitas Criadas** (NOVO): Shows number (0 if not implemented)

**Test Functionality:**

- [ ] Search by name or email works
- [ ] Filter by role works
- [ ] Pagination works (navigate pages)
- [ ] Click user to view details
- [ ] Edit user information
- [ ] Create new user

### Products Page

**Location:** Admin → Products

**Expected Data:**

- [ ] Page loads without errors
- [ ] Products list displays 5+ products
- [ ] Each product shows:
  - [ ] Name
  - [ ] Category
  - [ ] Brand
  - [ ] **Qualidade** (NOVO): Badge showing
    - [ ] "Completo" (green) - has image + nutrients + code + verified
    - [ ] "Incompleto" (yellow) - missing some fields
    - [ ] "Sem Imagem" (red) - missing image
  - [ ] **Vezes Usada** (NOVO): Number showing usage count (0-50+)
  - [ ] **Popularidade** (NOVO): Percentage (0-100%) based on usage

**Test Functionality:**

- [ ] Search by product name or barcode
- [ ] Pagination works
- [ ] Click product to view details
- [ ] Edit product information
- [ ] Delete product (archives it)

### Recipes Page

**Location:** Admin → Recipes

**Expected Data:**

- [ ] Page loads without errors
- [ ] Recipes list displays 5+ recipes
- [ ] Each recipe shows:
  - [ ] Name
  - [ ] Category
  - [ ] Difficulty
  - [ ] Evaluation (stars)
  - [ ] Times executed
  - [ ] **Denúncias** (NOVO): Counter showing reports (0 if no issues)
  - [ ] **Status Moderação** (NOVO): Badge showing
    - [ ] "OK" (green) - approved
    - [ ] "Em Revisão" (yellow) - under review
    - [ ] "Arquivado" (gray) - archived

**Test Functionality:**

- [ ] Search by recipe name
- [ ] Filter by difficulty (fácil/média/difícil)
- [ ] Filter by category
- [ ] Pagination works
- [ ] Click recipe to view details
- [ ] **Archive recipe** (change status to "Arquivado"):
  1. Click recipe
  2. Click "Archive" or moderation button
  3. Confirm action
  4. Status should change to "Arquivado"

## API Endpoint Testing (Advanced)

### Prerequisites

- Get a valid JWT token from login response
- Backend running on <http://localhost:3000>

### Test Users Endpoint

```bash
curl -X GET "http://localhost:3000/api/admin/usuarios?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "User Name",
      "email": "user@example.com",
      "role": "user",
      "ultimo_acesso": "2026-03-21T10:30:00Z",
      "nivel_atividade": "alta",
      "receitas_criadas": 5,
      ...
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### Test Products Endpoint

```bash
curl -X GET "http://localhost:3000/api/admin/produtos?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "Product Name",
      "categoria": { "id": "cat-id", "nome": "Category" },
      "vezes_usada": 15,
      "qualidade": "completo",
      "popularidade": 75,
      ...
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### Test Recipes Endpoint

```bash
curl -X GET "http://localhost:3000/api/admin/receitas?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "Recipe Name",
      "dificuldade": "media",
      "denuncias": 2,
      "status_moderacao": "em_revisao",
      "vezes_executada": 45,
      "avaliacao_media": 4.5,
      ...
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### Test Recipe Moderation Update

```bash
curl -X PATCH "http://localhost:3000/api/admin/receitas/{recipe-id}/moderacao" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "arquivado"}'
```

**Expected Response:**

```json
{
  "id": "recipe-id",
  "nome": "Recipe Name",
  "status_moderacao": "arquivado",
  ...
}
```

## Troubleshooting

### "Cannot GET /api/admin/usuarios"

- **Cause:** Backend not running or API prefix issue
- **Fix:** Ensure backend is running on port 3000

### "401 Unauthorized"

- **Cause:** Missing or invalid JWT token
- **Fix:** Login to frontend first, token will be added automatically

### "Products showing 0 for all calculated fields"

- **Cause:** No data in receita_ingredientes junction table
- **Fix:** This is expected if no recipes have been created with product ingredients

### "Level Activity always shows 'inativa'"

- **Cause:** User's `ultimo_acesso` is null
- **Fix:** User needs to have logged in at least once

## Performance Notes

- **Products calculation:** Uses LEFT JOIN with receita_ingredientes (indexed)
- **Dashboard cache:** 3-minute TTL on statistics endpoint
- **Pagination:** Default limit 20, supports up to 100 per page

## Next Steps

1. Once verified, test the integration in the actual application workflows
2. Set up automated tests for the enriched endpoints
3. Monitor database query performance (especially product popularidade calculation)
4. Consider adding `criado_por_id` to Receita for accurate `receitas_criadas` count
