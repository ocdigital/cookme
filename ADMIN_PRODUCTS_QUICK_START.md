# ⚡ Painel Admin de Produtos - Quick Start

## Tl;dr - Comece em 5 Minutos!

### 1. Inicie o Backend
```bash
cd /home/eduardo/projetos/cookme/backend
npm run start:dev
# Aguarde até ver: "Server running on http://localhost:3000"
```

### 2. Inicie o Frontend
```bash
cd /home/eduardo/projetos/cookme/frontend
npm run dev
# Acesse: http://localhost:5173
```

### 3. Faça Login
```
Email: seu@email.com
Senha: sua-senha
```

### 4. Acesse o Painel
```
Menu Lateral → "Gestão de Produtos"
OU
URL: http://localhost:5173/admin/products
```

---

## ✨ O que Você Vai Ver

### Tela Principal
```
📊 Estatísticas
┌─────────────────────────────────────────┐
│ 📦 Total: 150   🏷️ Categorias: 10       │
│ 🏢 Marcas: 25                           │
└─────────────────────────────────────────┘

🔍 Filtros
┌─────────────────────────────────────────┐
│ [Buscar...] [Todas Categorias ▼]        │
└─────────────────────────────────────────┘

📋 Tabela
┌────────────────────────────────────────────────────────┐
│ Produto │ Categoria │ Marca │ Código │ Status │ Data    │
├────────────────────────────────────────────────────────┤
│ Maçã    │ 🥬 Frutas │ Farm  │ 789... │ ✓      │ 12 Nov  │
│ Leite   │ 🥛 Latíc. │ Lacto │ 456... │ ✓      │ 11 Nov  │
└────────────────────────────────────────────────────────┘

📄 Paginação
Página 1 de 8 (150 total)
[← Anterior] [Próximo →]
```

---

## 🎮 Principais Funcionalidades

### Buscar Produtos
```
1. Clique no campo "Buscar por nome..."
2. Digite: "maçã" ou "7890123"
3. Veja os resultados atualizarem em tempo real
```

### Filtrar por Categoria
```
1. Clique no dropdown "Todas as Categorias"
2. Selecione: "Frutas e Vegetais"
3. A tabela mostra apenas produtos dessa categoria
```

### Navegar Entre Páginas
```
1. Veja "Página 1 de 8" no rodapé
2. Clique "Próximo" para ir para página 2
3. Clique "Anterior" para voltar
```

### Ver Detalhes do Produto
```
Coluna "Categoria": Mostra ícone + nome
  🥬 Frutas e Vegetais
  🥛 Laticínios e Queijos
  🥩 Carnes e Peixes

Coluna "Status": Mostra verificação
  ✓ Verificado (verde)
  ⊘ Pendente (amarelo)
```

---

## 🔌 API Endpoints

### Listar Produtos
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/produtos?page=1&limit=20&search=maçã"
```

### Obter Estatísticas
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/admin/produtos/stats"
```

---

## 🐛 Problemas Comuns

### ❌ "Nenhum produto encontrado"
**Solução:** Execute seed para popular banco
```bash
cd backend
npm run seed
```

### ❌ Erro de autenticação
**Solução:** Faça login novamente
```
1. Clique "Sair" no menu
2. Faça login com suas credenciais
3. Tente novamente
```

### ❌ Página em branco
**Solução:** Limpe o cache
```
Ctrl+Shift+Delete → Clear all → OK
OU
DevTools → Application → Clear storage
```

### ❌ "Erro ao carregar produtos"
**Solução:** Verifique se backend está rodando
```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 📊 Exemplos de Busca

### Buscar por Nome
```
"maçã" → mostra Maçã Gala, Maçã Fuji, etc.
"leite" → mostra Leite Integral, Leite Desnatado, etc.
```

### Buscar por Código de Barras
```
"7890123456789" → mostra produto com esse código
```

### Filtrar por Categoria
```
Frutas e Vegetais    → 45 produtos
Laticínios e Queijos → 30 produtos
Carnes e Peixes      → 25 produtos
```

---

## 🎯 Próximas Ações

### Agora (Já funciona)
- ✅ Ver lista de produtos
- ✅ Buscar por nome/código
- ✅ Filtrar por categoria
- ✅ Ver estatísticas
- ✅ Navegar entre páginas

### Em Breve (Próximas features)
- ⏳ Editar produto
- ⏳ Deletar produto
- ⏳ Criar novo produto
- ⏳ Exportar como CSV
- ⏳ Dashboard com gráficos

---

## 📚 Documentação Completa

Para mais detalhes, leia:
- [Admin Panel Guide](ADMIN_PRODUCTS_PANEL_GUIDE.md)
- [Implementation Summary](ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md)

---

## 🚀 Atalhos

**Menu:**
- Dashboard: http://localhost:5173/dashboard
- Gestão de Produtos: http://localhost:5173/admin/products
- Usuários: http://localhost:5173/users
- Compras: http://localhost:5173/purchases

**API:**
- Listar: http://localhost:3000/api/admin/produtos
- Stats: http://localhost:3000/api/admin/produtos/stats

**Desenvolvimento:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

**Pronto para começar?**

```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev

# Navegador
http://localhost:5173/admin/products
```

Aproveite! 🎉
