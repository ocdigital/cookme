# Guia de Integração Mobile com Backend

## Status de Integração

### ✅ IMPLEMENTADO E FUNCIONAL

#### Autenticação
- `authService.login()` - POST `/auth/login`
- `authService.register()` - POST `/auth/register`
- `authService.logout()` - POST `/auth/logout`
- `authService.getMe()` - GET `/auth/me`
- `authService.isAuthenticated()` - Verifica token local

#### Inventário
- `inventarioService.getInventario()` - GET `/inventario` ✅
- `inventarioService.getVencendo()` - GET `/inventario/vencendo?days=7` ✅
- `inventarioService.getStats()` - GET `/inventario/stats` ✅
- `inventarioService.adicionarProduto()` - POST `/inventario` ✅ NOVO
- `inventarioService.atualizarProduto()` - PATCH `/inventario/:id` ✅ NOVO
- `inventarioService.deletarProduto()` - DELETE `/inventario/:id` ✅ NOVO

#### Receitas
- `receitasService.getSugestoes()` - GET `/receitas/sugestoes` ✅
- `receitasService.getReceitas()` - GET `/receitas?...` ✅
- `receitasService.getReceitaById()` - GET `/receitas/:id` ✅ NOVO
- `receitasService.getFavoritas()` - GET `/receitas/favoritas` ✅ NOVO
- `receitasService.executarReceita()` - POST `/receitas/:id/executar` ✅
- `receitasService.marcarComoFavorita()` - POST `/receitas/:id/favorita` ✅ NOVO
- `receitasService.removerDeFavorita()` - DELETE `/receitas/:id/favorita` ✅ NOVO

#### Compras
- `comprasService.getAll()` - GET `/compras` ✅
- `comprasService.getById()` - GET `/compras/:id` ✅
- `comprasService.getStats()` - GET `/compras/stats` ✅
- `comprasService.delete()` - DELETE `/compras/:id` ✅

#### Scraper
- `scraperService.startConsulta()` - POST `/scraper/consultas` ✅
- `scraperService.getStatus()` - GET `/scraper/consultas/:sessionId` ✅
- `scraperService.notifyCaptchaResolved()` - POST `/scraper/consultas/:sessionId/captcha-resolvido` ✅
- `scraperService.cancelConsulta()` - DELETE `/scraper/consultas/:sessionId` ✅
- `scraperService.getMinhasConsultas()` - GET `/scraper/minhas-consultas` ✅
- `scraperService.clearMinhasConsultas()` - DELETE `/scraper/minhas-consultas` ✅

#### Perfil do Usuário
- `userService.getProfile()` - GET `/usuarios/me` ✅
- `userService.updateProfile()` - PATCH `/usuarios/me` ✅
- `userService.deleteAccount()` - DELETE `/usuarios/me` ✅
- `userService.changePassword()` - PATCH `/usuarios/me/password` ✅
- `userService.getPreferences()` - GET `/usuarios/me/preferencias` ✅
- `userService.updatePreferences()` - PATCH `/usuarios/me/preferencias` ✅

---

## ⚠️ PROBLEMAS IDENTIFICADOS E SOLUÇÕES

### Problema 1: RecipeDetailsScreen - Chamada Ineficiente
**Antes:**
```javascript
const data = await receitasService.getReceitas({ id: recipeId });
```

**Depois:**
```javascript
const data = await receitasService.getReceitaById(recipeId);
```

**Status:** ✅ CORRIGIDO (método adicionado)

---

### Problema 2: FavoritesScreen - Filtro Inexistente
**Antes:**
```javascript
const data = await receitasService.getReceitas({ favoritas: true });
```

**Depois:**
```javascript
const data = await receitasService.getFavoritas();
```

**Status:** ✅ CORRIGIDO (método adicionado)

---

### Problema 3: InventoryScreen - Sem Integração Real
**Antes:** Apenas manipulava estado local
```javascript
setProducts([...products, newProduct]);
```

**Depois:** Chamadas ao backend
```javascript
// Adicionar
await inventarioService.adicionarProduto(produtoData);

// Atualizar
await inventarioService.atualizarProduto(id, produtoData);

// Deletar
await inventarioService.deletarProduto(id);
```

**Status:** ✅ CORRIGIDO (métodos adicionados)

---

### Problema 4: ProfileScreen - Dados Desatualizados
**Antes:** Apenas exibe dados do contexto
```javascript
const { user } = useAuth();
```

**Depois:** Carrega dados real-time
```javascript
useEffect(() => {
  const loadProfile = async () => {
    const profile = await userService.getProfile();
    setUser(profile);
  };
  loadProfile();
}, []);
```

**Status:** ⚠️ NECESSÁRIO IMPLEMENTAR NAS TELAS

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO NECESSÁRIA

### Telas que Precisam de Correção

- [ ] **RecipeDetailsScreen** - Atualizar para usar `getReceitaById()`
- [ ] **FavoritesScreen** - Atualizar para usar `getFavoritas()`
- [ ] **InventoryScreen** - Implementar chamadas reais de API
- [ ] **ProfileScreen** - Carregar dados com `userService.getProfile()`
- [ ] **RecipesListScreen** - Implementar favoritas com ícone atualizável

---

## 🔧 COMO USAR OS NOVOS MÉTODOS

### Exemplo 1: Obter uma Receita Específica
```javascript
import { receitasService } from '../services/api';

try {
  const receita = await receitasService.getReceitaById('123');
  console.log(receita);
} catch (error) {
  console.error('Erro ao obter receita:', error);
}
```

### Exemplo 2: Gerenciar Favoritas
```javascript
import { receitasService } from '../services/api';

// Marcar como favorita
await receitasService.marcarComoFavorita(receitaId);

// Remover de favoritas
await receitasService.removerDeFavorita(receitaId);

// Obter todas as favoritas
const favoritas = await receitasService.getFavoritas();
```

### Exemplo 3: Gerenciar Inventário
```javascript
import { inventarioService } from '../services/api';

// Adicionar produto
const novoProduto = await inventarioService.adicionarProduto({
  nome: 'Arroz',
  categoria: 'Grãos',
  quantidade: 5,
  unidade: 'kg',
  dataValidade: '2025-12-31'
});

// Atualizar produto
await inventarioService.atualizarProduto(produtoId, {
  quantidade: 3
});

// Deletar produto
await inventarioService.deletarProduto(produtoId);
```

### Exemplo 4: Carregar Perfil do Usuário
```javascript
import { userService } from '../services/user.service';

const perfil = await userService.getProfile();
console.log(perfil);
// { id, nome, email, telefone, avatar_url, role, ... }

// Atualizar perfil
await userService.updateProfile({
  nome: 'Novo Nome',
  telefone: '11999999999'
});
```

---

## 🔐 CONFIGURAÇÃO DE AUTENTICAÇÃO

### Token Management
- Tokens são armazenados em `expo-secure-store` (seguro)
- Interceptor automático adiciona `Authorization: Bearer {token}` em todas as requisições
- Refresh token automático em caso de expiração (401)

### Como Fazer Login
```javascript
import { useAuth } from '../contexts/AuthContext';

const MyScreen = () => {
  const { login, user } = useAuth();

  const handleLogin = async () => {
    const result = await login('email@example.com', 'senha123');
    if (result.success) {
      // Login bem-sucedido, user foi atualizado
      console.log('Usuário:', user);
    } else {
      console.error('Erro:', result.error);
    }
  };

  return <Button onPress={handleLogin} title="Login" />;
};
```

---

## 📊 ENDPOINTS DO BACKEND SUPORTADOS

```
Auth
├── POST   /auth/login
├── POST   /auth/register
├── POST   /auth/logout
├── GET    /auth/me
└── POST   /auth/refresh

Usuários
├── GET    /usuarios/me
├── PATCH  /usuarios/me
├── DELETE /usuarios/me
├── PATCH  /usuarios/me/password
├── GET    /usuarios/me/preferencias
└── PATCH  /usuarios/me/preferencias

Receitas
├── GET    /receitas
├── GET    /receitas/:id
├── GET    /receitas/sugestoes
├── GET    /receitas/favoritas
├── POST   /receitas/:id/executar
├── POST   /receitas/:id/favorita
└── DELETE /receitas/:id/favorita

Inventário
├── GET    /inventario
├── POST   /inventario
├── PATCH  /inventario/:id
├── DELETE /inventario/:id
├── GET    /inventario/vencendo
└── GET    /inventario/stats

Compras
├── GET    /compras
├── GET    /compras/:id
├── DELETE /compras/:id
└── GET    /compras/stats

Scraper
├── POST   /scraper/consultas
├── GET    /scraper/consultas/:sessionId
├── DELETE /scraper/consultas/:sessionId
├── POST   /scraper/consultas/:sessionId/captcha-resolvido
├── GET    /scraper/minhas-consultas
└── DELETE /scraper/minhas-consultas
```

---

## 🧪 TESTES RECOMENDADOS

### Login
```bash
curl -X POST http://192.168.86.9:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","senha":"password123"}'
```

### Obter Receitas
```bash
curl -X GET "http://192.168.86.9:3000/api/receitas" \
  -H "Authorization: Bearer {token}"
```

### Adicionar Produto ao Inventário
```bash
curl -X POST http://192.168.86.9:3000/api/inventario \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome":"Arroz",
    "categoria":"Grãos",
    "quantidade":5,
    "unidade":"kg",
    "dataValidade":"2025-12-31"
  }'
```

---

**Última atualização:** 2025-03-12
**Versão:** 1.0.0
