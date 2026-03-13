# Correções Necessárias - Implementação de Integração com Backend

## 📌 RESUMO EXECUTIVO

Identificadas **3 correções críticas** e **1 importante** que precisam ser implementadas nas telas mobile para integração completa com o backend.

---

## 🔴 CORREÇÃO 1: RecipeDetailsScreen

**Arquivo:** `mobile/src/screens/RecipeDetailsScreen.js`

### Problema
Atualmente busca uma receita filtrando em toda a lista (ineficiente):
```javascript
const data = await receitasService.getReceitas({ id: recipeId });
```

### Solução
Usar endpoint específico para obter uma receita por ID:
```javascript
const data = await receitasService.getReceitaById(recipeId);
```

### Mudança de Código
```javascript
// ANTES (ineficiente)
const receita = await receitasService.getReceitas({ id: recipeId });

// DEPOIS (correto)
const receita = await receitasService.getReceitaById(recipeId);
```

### Benefício
- ✅ Reduz carga no servidor (busca específica vs filtro em lista)
- ✅ Mais rápido para o usuário
- ✅ Usa endpoint correto do backend

---

## 🔴 CORREÇÃO 2: FavoritesScreen

**Arquivo:** `mobile/src/screens/FavoritesScreen.js`

### Problema
Tenta usar filtro `favoritas: true` que não existe no backend:
```javascript
const data = await receitasService.getReceitas({ favoritas: true });
```

### Solução
Usar endpoint específico para receitas favoritas:
```javascript
const data = await receitasService.getFavoritas();
```

### Mudança de Código
```javascript
// ANTES (filtro não existe)
const favoritas = await receitasService.getReceitas({ favoritas: true });

// DEPOIS (correto)
const favoritas = await receitasService.getFavoritas();
```

### Além disso, implementar marcar/desmarcar favorita
```javascript
// Marcar como favorita
const handleAddFavorite = async (receitaId) => {
  try {
    await receitasService.marcarComoFavorita(receitaId);
    // Atualizar lista
    loadFavoritas();
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível adicionar aos favoritos');
  }
};

// Remover de favorita
const handleRemoveFavorite = async (receitaId) => {
  try {
    await receitasService.removerDeFavorita(receitaId);
    // Atualizar lista
    loadFavoritas();
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível remover dos favoritos');
  }
};
```

### Benefício
- ✅ Usa endpoint correto do backend
- ✅ Permite marcar/desmarcar favoritas
- ✅ Funcionalidade completa de favoritas

---

## 🔴 CORREÇÃO 3: InventoryScreen

**Arquivo:** `mobile/src/screens/InventoryScreen.js`

### Problema
Adiciona/remove produtos apenas localmente, sem persistir no servidor.

### Solução
Implementar chamadas reais de API para CRUD de inventário.

### Mudanças de Código

#### 1. Carregar produtos do backend
```javascript
const loadInventario = async () => {
  try {
    setLoading(true);
    const data = await inventarioService.getInventario();
    setProducts(data);
  } catch (error) {
    console.error('Erro ao carregar inventário:', error);
    // Fallback para dados locais se API falhar
    setProducts(mockInventoryProducts);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadInventario();
}, []);
```

#### 2. Adicionar produto ao backend
```javascript
const handleAddProduct = async () => {
  if (!newProduct.nome || !newProduct.quantidade) {
    Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
    return;
  }

  try {
    setLoading(true);
    const produtoData = {
      nome: newProduct.nome,
      categoria: newProduct.categoria,
      quantidade: parseFloat(newProduct.quantidade),
      unidade: newProduct.unidade,
      dataValidade: newProduct.dataValidade,
    };

    const response = await inventarioService.adicionarProduto(produtoData);
    setProducts([...products, response]);
    setModalVisible(false);
    resetForm();
    Alert.alert('Sucesso', 'Produto adicionado com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    Alert.alert('Erro', 'Não foi possível adicionar o produto');
  } finally {
    setLoading(false);
  }
};
```

#### 3. Deletar produto do backend
```javascript
const handleDeleteProduct = async (productId) => {
  Alert.alert(
    'Confirmar exclusão',
    'Tem certeza que deseja excluir este produto?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await inventarioService.deletarProduto(productId);
            setProducts(products.filter(p => p.id !== productId));
            Alert.alert('Sucesso', 'Produto deletado com sucesso');
          } catch (error) {
            console.error('Erro ao deletar produto:', error);
            Alert.alert('Erro', 'Não foi possível deletar o produto');
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};
```

#### 4. Atualizar quantidade do produto
```javascript
const handleUpdateProduct = async (productId, newQuantity) => {
  try {
    setLoading(true);
    await inventarioService.atualizarProduto(productId, {
      quantidade: parseFloat(newQuantity),
    });

    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, quantidade: parseFloat(newQuantity) } : p
    );
    setProducts(updatedProducts);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    Alert.alert('Erro', 'Não foi possível atualizar o produto');
  } finally {
    setLoading(false);
  }
};
```

### Benefício
- ✅ Dados persistem no servidor
- ✅ Sincronização com outros dispositivos
- ✅ Backup automático no backend

---

## 🟡 CORREÇÃO 4: ProfileScreen

**Arquivo:** `mobile/src/screens/ProfileScreen.js`

### Problema
Exibe apenas dados do contexto AuthContext, que podem estar desatualizados.

### Solução
Carregar dados atualizados do servidor.

### Mudanças de Código

#### 1. Adicionar carregamento de perfil
```javascript
import { userService } from '../services/user.service';

const ProfileScreen = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userService.getProfile();
      setUser(profileData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Mantém dados do contexto se falhar
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... resto do código usando 'user' em vez de authUser
  );
};
```

#### 2. Implementar atualização de perfil
```javascript
const handleUpdateProfile = async () => {
  try {
    setLoading(true);
    const updatedUser = await userService.updateProfile({
      nome: user.nome,
      telefone: user.telefone,
    });
    setUser(updatedUser);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    setIsEditing(false);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    Alert.alert('Erro', error.response?.data?.message || 'Erro ao atualizar perfil');
  } finally {
    setLoading(false);
  }
};
```

### Benefício
- ✅ Dados sempre atualizados
- ✅ Sincronização real-time
- ✅ Usuário vê informações corretas

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### RecipeDetailsScreen
- [ ] Importar `receitasService` do `../services/api`
- [ ] Substituir chamada `getReceitas({ id: recipeId })` por `getReceitaById(recipeId)`
- [ ] Testar carregamento da receita
- [ ] Adicionar tratamento de erro

### FavoritesScreen
- [ ] Importar `receitasService` do `../services/api`
- [ ] Substituir chamada `getReceitas({ favoritas: true })` por `getFavoritas()`
- [ ] Implementar botão para marcar/desmarcar favorita
- [ ] Chamar `marcarComoFavorita()` e `removerDeFavorita()`
- [ ] Testar funcionalidade de favoritas
- [ ] Adicionar tratamento de erro

### InventoryScreen
- [ ] Importar `inventarioService` do `../services/api`
- [ ] Implementar `loadInventario()` ao montar tela
- [ ] Implementar `handleAddProduct()` com `adicionarProduto()`
- [ ] Implementar `handleDeleteProduct()` com `deletarProduto()`
- [ ] Implementar `handleUpdateProduct()` com `atualizarProduto()`
- [ ] Adicionar loading states
- [ ] Testar CRUD completo
- [ ] Adicionar tratamento de erro

### ProfileScreen
- [ ] Importar `userService` de `../services/user.service`
- [ ] Implementar `loadProfile()` com `getProfile()`
- [ ] Substituir `authUser` por `user` do state
- [ ] Implementar `handleUpdateProfile()` com `updateProfile()`
- [ ] Adicionar loading states
- [ ] Testar carregamento e atualização
- [ ] Adicionar tratamento de erro

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Login e Carregamento de Dados
```
1. Fazer login
2. Ir para ProfileScreen
3. Verificar se dados são carregados do backend
4. Atualizar nome
5. Recarregar tela
6. Confirmar que dados foram salvos
```

### Teste 2: Gerenciar Inventário
```
1. Ir para InventoryScreen
2. Adicionar novo produto
3. Confirmar que aparece na lista
4. Atualizar quantidade
5. Deletar produto
6. Recarregar tela
7. Confirmar que dados persistiram no servidor
```

### Teste 3: Gerenciar Favoritas
```
1. Ir para RecipesListScreen
2. Clicar para marcar como favorita
3. Ir para FavoritesScreen
4. Confirmar que receita aparece
5. Remover de favorita
6. Confirmar que desapareceu de FavoritesScreen
```

---

## 📊 IMPACTO DAS CORREÇÕES

| Correção | Prioridade | Impacto | Tempo Est. |
|----------|-----------|--------|-----------|
| RecipeDetailsScreen | Alta | Performance | 15min |
| FavoritesScreen | Alta | Funcionalidade | 30min |
| InventoryScreen | Crítica | Dados/Sync | 45min |
| ProfileScreen | Média | Dados | 20min |

**Total: ~2 horas de implementação**

---

## 📞 SUPORTE

Se encontrar erros durante a implementação:

1. Verificar se o backend está rodando em `http://192.168.86.9:3000/api`
2. Consultar `mobile/src/config/api.js` para configuração de URL
3. Verificar console do React Native para erros detalhados
4. Testar endpoints com `curl` ou Postman primeiro

---

**Versão:** 1.0.0
**Data:** 2025-03-12
