# 🎯 Painel Admin de Produtos - Guia Completo

## Visão Geral

Um painel admin completo para visualizar e gerenciar todos os produtos cadastrados no CookMe com suporte a:

- ✅ Listagem com paginação
- ✅ Filtros avançados (nome, categoria, marca)
- ✅ Visualização de categorias e ícones
- ✅ Estatísticas de produtos
- ✅ Status de verificação
- ✅ Informações de origem dos dados

---

## 📦 Arquivos Implementados

### Backend (NestJS)

#### 1. **Módulo Admin** (`backend/src/modules/admin/`)

```
admin/
├── admin.module.ts                    # Módulo principal
├── controllers/
│   └── admin.controller.ts            # Controllers com endpoints
├── services/
│   └── admin.service.ts               # Lógica de negócio
└── dto/
    ├── list-products-query.dto.ts     # Query parameters
    ├── product-list.dto.ts            # DTOs de resposta
```

#### 2. **Endpoints Criados**

**GET `/api/admin/produtos`**

- Lista produtos com filtros, busca e paginação
- Retorna produtos com relacionamentos (categoria e marca)
- Suporta ordenação e direção

**Exemplo de Request:**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/produtos?page=1&limit=20&search=maçã&categoriaId=xxx&sort=nome&order=ASC"
```

**Exemplo de Response:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "nome": "Maçã Gala",
      "descricao": "Maçã vermelha doce",
      "codigo_barras": "7890123456789",
      "categoria": {
        "id": "cat-1",
        "nome": "Frutas e Vegetais",
        "icone": "🥬"
      },
      "marca": {
        "id": "marca-1",
        "nome": "Fazenda Brasil"
      },
      "unidade_padrao": "kg",
      "validade_media_dias": 30,
      "origem": "manual",
      "verificado": true,
      "criado_em": "2024-11-12T10:30:00Z",
      "atualizado_em": "2024-11-12T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**GET `/api/admin/produtos/stats`**

- Retorna estatísticas de produtos
- Total de produtos
- Produtos por categoria
- Produtos por marca (top 10)

**Exemplo de Response:**

```json
{
  "totalProdutos": 150,
  "produtosPorCategoria": [
    { "categoria": "Frutas e Vegetais", "total": 45 },
    { "categoria": "Laticínios", "total": 30 },
    { "categoria": "Carnes", "total": 25 }
  ],
  "produtosPorMarca": [
    { "marca": "Fazenda Brasil", "total": 20 },
    { "marca": "Lactogal", "total": 15 }
  ]
}
```

#### 3. **Query Parameters**

| Parâmetro | Tipo | Padrão | Descrição |
| ----------- | ------ | -------- | ----------- |
| `page` | number | 1 | Número da página |
| `limit` | number | 20 | Itens por página (máx: 100) |
| `search` | string | - | Busca por nome ou código |
| `categoriaId` | string | - | Filtro por ID da categoria |
| `marcaId` | string | - | Filtro por ID da marca |
| `sort` | string | criado_em | Campo de ordenação (nome, criado_em) |
| `order` | string | DESC | ASC ou DESC |

---

### Frontend (React + TypeScript)

#### 1. **Serviço Admin** (`frontend/src/services/adminService.ts`)

```typescript
// Listar produtos
const response = await adminService.listProducts(page, limit, {
  search: 'maçã',
  categoriaId: 'xxx',
  sort: 'nome',
  order: 'ASC'
});

// Obter estatísticas
const stats = await adminService.getProductStats();
```

#### 2. **Página Admin** (`frontend/src/pages/AdminProductsPage.tsx`)

Componente completo com:

- **Estatísticas**: Total, categorias, marcas
- **Barra de Filtros**: Busca e filtro por categoria
- **Tabela de Produtos**: Com todas as informações
- **Paginação**: Navegação entre páginas
- **Loading States**: Feedback visual durante carregamento
- **Error Handling**: Tratamento robusto de erros

#### 3. **Rota Adicionada** (`frontend/src/App.tsx`)

```
GET /admin/products → AdminProductsPage
```

#### 4. **Menu Lateral** (`frontend/src/components/Sidebar.tsx`)

Novo item adicionado:

- Label: "Gestão de Produtos"
- Icon: Package
- Path: `/admin/products`

---

## 🎨 Interface do Painel

### Seção de Estatísticas

```
┌─────────────────────────────────────────┐
│  📦 Total: 150    🏷️ Categorias: 10    │
│  🏢 Marcas: 25                          │
└─────────────────────────────────────────┘
```

### Filtros

```
┌──────────────────────────────────────────────┐
│ 🔍 Buscar por nome...  │ Todas as Categorias │
└──────────────────────────────────────────────┘
```

### Tabela de Produtos

```
┌─────────────┬──────────────┬────────┬────────┐
│ Produto     │ Categoria    │ Marca  │ Status │
├─────────────┼──────────────┼────────┼────────┤
│ Maçã Gala   │ 🥬 Frutas    │ Fazenda│ ✓ Ver. │
│ Leite      │ 🥛 Laticínios│ Lactog │ ✓ Ver. │
│ Frango     │ 🥩 Carnes    │ -      │ ⊘ Pend.│
└─────────────┴──────────────┴────────┴────────┘
```

### Paginação

```
Página 1 de 8 (150 total)
[← Anterior] [Próximo →]
```

---

## 🚀 Como Usar

### 1. **Acessar o Painel**

```
1. Faça login no admin
2. Vá para "Gestão de Produtos" no menu lateral
3. URL: http://localhost:5173/admin/products
```

### 2. **Buscar Produtos**

```typescript
// Digite no campo de busca
"maçã" → mostra todos os produtos com "maçã" no nome ou código
```

### 3. **Filtrar por Categoria**

```typescript
// Selecione no dropdown
"Frutas e Vegetais" → mostra apenas produtos dessa categoria
```

### 4. **Navegar Entre Páginas**

```typescript
// Use os botões de paginação
Próximo → vai para página 2
Anterior → volta para página 1
```

### 5. **Ver Detalhes**

Cada linha da tabela mostra:

- Nome e descrição truncada
- **Categoria** com ícone emoji
- **Marca** (se houver)
- **Código de barras**
- **Unidade padrão** (kg, un, etc)
- **Status de verificação** (✓ Verificado / ⊘ Pendente)
- **Data de criação**

---

## 📊 Exemplos de Dados

### Produto Verificado

```json
{
  "nome": "Maçã Gala",
  "categoria": {
    "nome": "Frutas e Vegetais",
    "icone": "🥬"
  },
  "marca": { "nome": "Fazenda Brasil" },
  "verificado": true,
  "origem": "manual"
}
```

### Produto Não Verificado

```json
{
  "nome": "Frango Orgânico",
  "categoria": {
    "nome": "Carnes e Peixes",
    "icone": "🥩"
  },
  "marca": null,
  "verificado": false,
  "origem": "usuario"
}
```

### Produto Sem Categoria

```json
{
  "nome": "Produto X",
  "categoria": null,
  "marca": { "nome": "Marca X" },
  "verificado": false
}
```

---

## 🔧 Configuração

### Backend (NestJS)

**Arquivo:** `backend/src/app.module.ts`

```typescript
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // ... outros módulos
    AdminModule,  // ← Adicionado
  ],
})
export class AppModule {}
```

### Frontend (React)

**Arquivo:** `frontend/src/App.tsx`

```typescript
import { AdminProductsPage } from './pages/AdminProductsPage';

<Route path="/admin/products" element={<AdminProductsPage />} />
```

**Arquivo:** `frontend/src/components/Sidebar.tsx`

```typescript
const menuItems = [
  // ...
  { icon: Package, label: 'Gestão de Produtos', path: '/admin/products' },
];
```

---

## ⚡ Performance

### Otimizações Implementadas

1. **Paginação**: 20 itens por página (máximo 100)
2. **Query Builders**: Utiliza TypeORM QueryBuilder
3. **Relacionamentos**: Carregamento de categoria e marca via JOIN
4. **Índices**: Barcode é indexado no banco de dados
5. **Lazy Loading**: Dados carregados sob demanda

### Queries Geradas

```sql
-- Listar produtos com categoria e marca
SELECT p.*, c.*, m.*
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN marcas m ON p.marca_id = m.id
ORDER BY p.criado_em DESC
LIMIT 20 OFFSET 0;

-- Estatísticas por categoria
SELECT c.nome, COUNT(p.id) as total
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
GROUP BY c.id, c.nome
ORDER BY total DESC;
```

---

## 🐛 Troubleshooting

### Problema: "Erro ao carregar produtos"

**Solução:**

1. Verifique se está autenticado
2. Verifique o token JWT
3. Verifique se o backend está rodando
4. Veja o console do navegador (DevTools > Console)

### Problema: "Nenhum produto encontrado"

**Possíveis causas:**

1. Banco de dados vazio (execute seed)
2. Filtros muito restritivos
3. Categoria não existe

**Solução:**

```bash
# No backend
npm run seed
```

### Problema: Paginação não funciona

**Causa:** Cache do navegador
**Solução:**

```bash
# Limpe o cache
Ctrl+Shift+Delete (ou Cmd+Shift+Delete no Mac)
```

---

## 📝 Próximos Passos Sugeridos

### Curto Prazo

- [ ] Adicionar edição de produtos
- [ ] Adicionar exclusão de produtos
- [ ] Adicionar criação de produtos
- [ ] Exportar lista como CSV

### Médio Prazo

- [ ] Dashboard visual com gráficos
- [ ] Filtros avançados por origem
- [ ] Filtros por status de verificação
- [ ] Busca por código de barras

### Longo Prazo

- [ ] Importação em massa (CSV)
- [ ] Atualização em massa
- [ ] Histórico de alterações
- [ ] Roles e permissões granulares

---

## 🧪 Testes

### Teste Manual - Backend

```bash
# 1. Inicie o servidor
cd backend && npm run start:dev

# 2. Teste o endpoint
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/produtos?page=1"

# 3. Teste com filtros
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/produtos?search=maçã&page=1"
```

### Teste Manual - Frontend

```bash
# 1. Inicie o frontend
cd frontend && npm run dev

# 2. Acesse
http://localhost:5173/admin/products

# 3. Teste:
- Digite no campo de busca
- Selecione categoria
- Mude de página
- Veja carregamento/erros
```

---

## 📚 Referências

### Arquivos Relacionados

- Backend: `backend/src/modules/admin/`
- Frontend: `frontend/src/pages/AdminProductsPage.tsx`
- Serviço: `frontend/src/services/adminService.ts`
- Rotas: `frontend/src/App.tsx`

### Modelos Relacionados

- Produto: `backend/src/modules/produtos/entities/produto.entity.ts`
- Categoria: `backend/src/modules/produtos/entities/categoria.entity.ts`
- Marca: `backend/src/modules/produtos/entities/marca.entity.ts`

### DTOs

- `ListProductsQueryDto`: Query parameters
- `ProductListDto`: Resposta individual
- `ListProductsResponseDto`: Resposta paginada

---

## ✅ Checklist de Implementação

- [x] Endpoint backend GET /api/admin/produtos
- [x] Endpoint backend GET /api/admin/produtos/stats
- [x] DTOs de query e resposta
- [x] Serviço AdminService
- [x] Controller AdminController
- [x] Módulo AdminModule registrado
- [x] Serviço frontend adminService
- [x] Página AdminProductsPage
- [x] Rota /admin/products
- [x] Link no menu lateral
- [x] Filtros (busca, categoria)
- [x] Paginação
- [x] Estatísticas
- [x] Tratamento de erros
- [x] Loading states
- [x] Documentação

---

## 🎉 Status

**Implementação Completa!** ✅

Tudo está pronto para usar. A próxima etapa seria adicionar funcionalidades de CRUD (Create, Update, Delete) completas.

**Compile e teste agora:**

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npm run dev
```

---

*Documentação criada em: 2024-12-02*
*Versão: 1.0*
