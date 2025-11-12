# 🍳 Arquitetura CookMe - Foco em Receitas

## 📱 Visão Geral

A aplicação CookMe foi reorganizada para ter **RECEITAS como foco principal**, com o **cupom fiscal como uma ferramenta auxiliar** para cadastro de produtos.

O fluxo é:
1. **Usuário descobre receitas** na home
2. **Usuário cadastra produtos** via múltiplos canais (cupom, código de barras, manual)
3. **Sistema sugere receitas** baseadas nos produtos disponíveis

---

## 🗂️ Estrutura de Telas

### **1. HomeScreenRecipes** (Nova Home)
📍 `src/screens/HomeScreenRecipes.js`

**Foco Principal: Receitas em Destaque**

**Componentes:**
- 👨‍🍳 **Saudação personalizada**
- ✨ **Carousel de Receitas em Destaque** (5 receitas principais)
  - Imagens grandes e atraentes
  - Indicadores de página
  - Tempo e avaliação visíveis

- **2 Botões Principais** (50% da tela)
  - 👨‍🍳 Todas as Receitas (explora todas)
  - 🛒 Meu Inventário (gere produtos)

- **Acesso Rápido** (Grid 2x2)
  - 📖 Buscar Receitas
  - 🍽️ Produtos Cadastrados
  - 📋 Histórico de Cupons
  - ❤️ Receitas Favoritas

- **Sugestões Personalizadas**
  - Receitas com seus produtos atuais

- **Dica do Dia**
  - Sugestões de culinária

**Visual:**
- Header verde (#4CAF50)
- Foco em imagens grandes
- Cards com sombras suaves

---

### **2. RecipesListScreen**
📍 `src/screens/RecipesListScreen.js`

**Funcionalidade:** Explora e filtra receitas

- 🔍 Busca em tempo real
- 📊 4 opções de ordenação:
  - Alfabética
  - ⏱️ Tempo (mais rápido)
  - ⭐ Avaliação
  - 🔥 Calorias
- 📋 Cards com informações completas
- Estado vazio amigável

---

### **3. RecipeDetailsScreen**
📍 `src/screens/RecipeDetailsScreen.js`

**Funcionalidade:** Detalhes completos da receita

- 🖼️ Imagem destaque com favorito (❤️)
- ℹ️ Info cards (tempo, calorias, dificuldade, rating)
- 👥 Controle de porções (+/-)
- 📝 **Ingredientes Interativos:**
  - Checkbox para marcar como comprado
  - Botão 🛒 para adicionar ao carrinho
- 👨‍🍳 Modo de preparo passo-a-passo
- 💡 Dicas importantes
- 🎯 Ações:
  - 🛒 Comprar Ingredientes (botão verde)
  - 📤 Compartilhar (botão outline)

---

### **4. InventoryScreen** (Novo - Substituiu Home)
📍 `src/screens/InventoryScreen.js`

**Foco:** Gerenciar produtos cadastrados (ponto de entrada para ferramentas)

**2 Tabs:**

#### **Tab 1: Produtos Cadastrados**
- Lista de produtos com:
  - Imagem
  - Nome e categoria
  - Quantidade
  - 🟢 Status de validade:
    - ✓ Ok (verde)
    - ⏰ 3 dias (amarelo)
    - ⚠️ Vencido (vermelho)
  - Botão 🗑️ para remover

**Tab 2: Adicionar Produto**
- **3 Métodos de Entrada:**

  1. **📷 Escanear Cupom Fiscal**
     - Lê múltiplos produtos de uma vez
     - Navega para QRScanner
     - Integra com API SAT-SP

  2. **🔍 Ler Código de Barras**
     - Modal com preview de câmera
     - Lê código do pacote
     - Busca automaticamente na BD (futuro)
     - Pronto para integração com biblioteca de barcode

  3. **✍️ Entrada Manual**
     - Modal com formulário:
       - 📝 Nome do produto *
       - 📂 Categoria
       - 📊 Quantidade *
       - 📏 Unidade (seletor: un, g, kg, ml, L)
       - 📅 Data de Validade * (formato: YYYY-MM-DD)
         - 💡 Dica: "Você também pode usar OCR para ler a data"

**Features:**
- Contador de produtos no header
- Badge de status de validade
- Info box com tips
- Design intuitivo

---

### **5. FavoritesScreen** (Novo)
📍 `src/screens/FavoritesScreen.js`

**Funcionalidade:** Gerenciar receitas favoritas

- 🔍 Busca em receitas favoritas
- 📊 Filtros:
  - Recentes
  - ⏱️ Tempo
  - ⭐ Rating

- **Cards em Grid 2 colunas:**
  - Imagem
  - Nome (2 linhas)
  - Descrição
  - 3 stats (tempo, avaliação, calorias)
  - Botão ❤️ para remover favorito

- Estado vazio com botão para explorar receitas

---

### **6. RecipesScreen** (Antigo - Agora Secundário)
📍 `src/screens/RecipesScreen.js`

**Nota:** Esta tela agora é acessível via "Todas as Receitas" mas NÃO é mais a home.

---

### **Rotas Mantidas:**
- **QRScannerScreen** (Acessível via Inventory → Cupom Fiscal)
- **ProcessingScreen** (Processamento de cupom)
- **CaptchaScreen** (Resolver CAPTCHA SAT-SP)
- **ResultScreen** (Resultado de cupom)
- **HistoryScreen** (Histórico de cupons)
- **PurchaseDetailsScreen** (Detalhes da compra)
- **ProductsScreen** (Produtos mockado)

---

## 🔀 Fluxo de Navegação (Nova Arquitetura)

```
┌─────────────────────────────────────────────────────────────┐
│                    HOME RECIPES                             │
│  (Carousel + Receitas em Destaque + Acesso Rápido)         │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
      ┌──────▼────────┐            ┌────────▼──────────┐
      │  TODAS AS      │            │  MEU INVENTÁRIO   │
      │  RECEITAS      │            │  (Produtos)       │
      │  (Lista)       │            │                   │
      │                │            │ ┌────────────────┐│
      │ ┌────────────┐ │            │ │ Produtos       ││
      │ │ Detalhes   │ │            │ │ Cadastrados    ││
      │ │ da Receita │ │            │ │ ┌──────────┐  ││
      │ │ ❌❤️🛒 │ │            │ │ │ Cupom   │  ││
      │ └────────────┘ │            │ │ │ Fiscal  │  ││
      └────────────────┘            │ │ ├──────────┤  ││
                                    │ │ │ Código   │  ││
      ┌────────────────┐            │ │ │ Barras   │  ││
      │ RECEITAS       │            │ │ ├──────────┤  ││
      │ FAVORITAS      │            │ │ │ Manual   │  ││
      │                │            │ │ └──────────┘  ││
      │ ┌────────────┐ │            │ └────────────────┘│
      │ │ Grid 2 Col │ │            └───────────────────┘
      │ │ Cards      │ │
      │ └────────────┘ │            ┌─────────────────┐
      └────────────────┘            │ HISTÓRICO DE    │
                                    │ CUPONS (Legacy) │
                                    └─────────────────┘
```

---

## 📊 Mudanças Principais

### ❌ O que foi removido da Home:
- ❌ Botão "Escanear Cupom Fiscal" (grande, principal)
- ❌ Botão "Ver Histórico & Logs"
- ❌ Seção de "Produtos Vencendo" (agora no Inventário)
- ❌ Seção de "Sugestões de Receitas" básica

### ✅ O que foi adicionado:
- ✅ **Carousel de receitas em destaque** (visual primeiro)
- ✅ **Receitas Favoritas** (nova tela)
- ✅ **Inventário consolidado** (cupom + barras + manual)
- ✅ **Sugestões personalizadas** (baseado em produtos)
- ✅ **Dica do dia** (culinária)

### 🔄 O que foi reorganizado:
- 🔄 QR Scanner → Acessível via Inventory
- 🔄 Histórico de Cupons → Acessível via Inventory
- 🔄 Entrada de produtos → Centralizada no Inventory

---

## 🛠️ Ferramentas de Cadastro de Produtos

O sistema oferece **3 métodos** para adicionar produtos:

### **1. 📷 Cupom Fiscal (SAT-SP)**
- Integrado com API SAT-SP
- Lê QR Code do cupom
- Extrai automáticamente todos os produtos
- Usa OCR para data de validade
- **Resultado:** N produtos cadastrados de uma vez

### **2. 🔍 Código de Barras**
- Câmera aponta para código do produto
- Busca informações na BD (futuro)
- Manual para quantidade e validade
- **Resultado:** 1 produto por leitura

### **3. ✍️ Entrada Manual**
- Formulário simples
- Preenchimento manual de dados
- Suporte para OCR de data (futura)
- **Resultado:** 1 produto por entrada

---

## 🎨 Paleta de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| Home/Principal | `#4CAF50` | Receitas, CTAs principais |
| Favoritas | `#FF69B4` | Receitas favoritas |
| Inventory | `#B4E5FF` | Gestão de produtos |
| Status OK | `#E8F5E9` | Validade ok |
| Status Warning | `#FFF3E0` | Vencendo (3 dias) |
| Status Error | `#FFEBEE` | Vencido |
| Background | `#F5F5F5` | Fundo geral |
| Cards | `#FFFFFF` | Conteúdo |

---

## 📈 Fluxo de Usuário (Ideal)

```
1. Usuário abre app
   ↓
2. Vê carousel de receitas em destaque
   ↓
3. Clica em receita que gosta
   ↓
4. Vê detalhes (ingredientes, modo de preparo)
   ↓
5. Clica "Comprar Ingredientes"
   ↓
6. Vai para Inventário
   ↓
7. Adiciona produtos via:
   - Cupom fiscal (vários produtos)
   - Código de barras (busca rápida)
   - Manual (entrada customizada)
   ↓
8. Sistema sugere receitas com produtos que tem
   ↓
9. Adiciona às favoritas (❤️)
   ↓
10. Consulta Receitas Favoritas para planejar semana
```

---

## 🚀 Próximas Implementações

### Phase 1 (Atual - Mockado)
- ✅ Receitas como foco principal
- ✅ Inventário consolidado
- ✅ 3 métodos de entrada de produtos

### Phase 2 (Integração)
- [ ] API de receitas integrada
- [ ] Sincronização de ingredientes com inventário
- [ ] Sistema de recomendação de receitas
- [ ] Integração com código de barras real

### Phase 3 (Machine Learning)
- [ ] Classificação automática de alimentos (é alimento?)
- [ ] Modelo treinado com feedback do usuário
- [ ] Sugestões personalizadas por preferência
- [ ] Histórico de receitas preparadas

### Phase 4 (Social/Avançado)
- [ ] Compartilhamento de receitas
- [ ] Comunidade de usuários
- [ ] Reviews de receitas
- [ ] Integração com supermercados

---

## 📱 Compatibilidade

- ✅ React Native
- ✅ Expo
- ✅ iOS & Android
- ✅ Responsive (vários tamanhos de tela)

---

## 💾 Mock Data

Todos os dados estão em `src/services/mockRecipesData.js`:
- `mockRecipesCarousel` - 5 receitas principais
- `mockAllRecipes` - 8 receitas totais
- `mockRecipeDetails` - Detalhes completos
- `mockProductCategories` - Categorias

---

**Status:** ✅ Pronto para visualização
**Foco:** RECEITAS são o star, produtos são ferramentas
**Data:** 2025-11-11
