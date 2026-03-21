# 🛒 Quick Start - Módulo de Compras

## 📱 Como Acessar

### No App Mobile:

1. **Abra o app:** `npm start`
2. **Login** com suas credenciais
3. **Veja o menu inferior** - deve ter 5 abas:
   - 🏠 Início
   - 📚 Categorias
   - 🔍 Pesquisa
   - **🛒 Compras** ← NOVA ABA
   - ❤️ Favoritos

4. **Clique na aba "Compras"**

---

## 🎯 O Que Você Verá

### Tela Principal (ComprasScreen)

```
┌─────────────────────────┐
│  Minhas Compras         │
│  Acompanhe seu histórico│
├─────────────────────────┤
│                         │
│  📊 Total Gasto:        │
│     R$ 2.176,83         │
│                         │
│  ✅ Economizado:        │
│     R$ 80,22            │
│                         │
│  📈 Média por Compra:   │
│     R$ 435,37           │
│                         │
│  🛍️  Total de Compras:  │
│     5                   │
│                         │
│ ┌───────────────────┐   │
│ │ 20/03/2026        │   │
│ │ Hipermarket       │   │
│ │ R$ 417,18         │   │
│ │ 22 itens | -45,32 │   │
│ │                   │   │
│ │ [COMPARAR]        │   │
│ │ [DETALHES]        │   │
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │ 13/03/2026        │   │
│ │ Supermercado      │   │
│ │ R$ 498,50         │   │
│ │ 28 itens | -12,50 │   │
│ └───────────────────┘   │
│                         │
└─────────────────────────┘
```

### Funcionalidades Disponíveis

Ao clicar em uma compra, aparecem 2 botões:

#### 🔄 **COMPARAR**
Compara a compra atual com a anterior:
- Mostra o que ficou mais caro/barato
- Quanto economizou no total
- Item por item

#### 👁️ **DETALHES**
(Futura) Mostra os itens da compra

---

## 🗂️ Navegação Interna

Dentro do módulo de Compras, você pode:

### 1. **Compras** (padrão)
   - Lista de todas as compras
   - Stats gerais

### 2. **Comparação** (ao clicar COMPARAR)
   - Tabela comparativa
   - Diferenças de preço
   - Análise detalhada

### 3. **Histórico de Preços**
   - Gráficos de preço ao longo do tempo
   - Análise de tendência
   - Min/Max/Média

### 4. **Análise**
   - Dashboard de gastos
   - Gráficos mensais
   - Insights inteligentes
   - Recomendações

---

## 📊 Dados Fictícios (Mockup)

Todos os dados são 100% fictícios para demonstração:

**5 Compras Mockadas:**
```
1. 20/03/2026 - Hipermarket - R$ 417,18 - 22 itens
2. 13/03/2026 - Supermercado - R$ 498,50 - 28 itens
3. 06/03/2026 - Hipermarket - R$ 520,75 - 25 itens
4. 27/02/2026 - Supermercado - R$ 445,90 - 20 itens
5. 20/02/2026 - Mercado do Bairro - R$ 389,50 - 18 itens
```

**Produtos Mockados:**
- BOLO PANCO ABACAXI 300G
- CAFÉ MORGES VACUO 500G
- AGUA MIN BIOLEUE PRIME
- BISCOITO INTEGRAL 200G
- LEITE INTEGRAL 1L
- FRANGO PEITO 800G
- etc...

---

## 🎨 Cores & Significado

| Cor | Significado |
|-----|------------|
| 🟢 Verde | Economizou nesta compra |
| 🔴 Vermelho | Gastou mais que a anterior |
| 🔵 Azul | Informações gerais |
| 🟠 Laranja | Alertas e dicas |

---

## 💡 Dicas

1. **Expandir Compra**: Clique em uma compra para ver os botões de ação

2. **Comparar**: Ver diferença entre 2 compras lado a lado

3. **Histórico**: Ver como o preço de um produto variou nos últimos meses

4. **Análise**: Dashboard completo com insights automáticos

---

## 🔄 Fluxo Completo

```
🛒 Compras (início)
    ↓
Clica em uma compra
    ↓
Aparecem 2 botões:
├─→ 🔄 COMPARAR
│   ├─→ Resumo (diferença total, %)
│   ├─→ Itens mais baratos (verde)
│   ├─→ Itens mais caros (vermelho)
│   └─→ Botão "Salvar Comparação"
│
└─→ 📊 DETALHES
    └─→ (Futura implementação)
```

---

## 📱 Abas Relacionadas

Do **ComprasScreen**, você ainda pode acessar via botões de navegação interna:

- **Comparação** - Compare 2 compras
- **Histórico** - Veja histórico de preços
- **Análise** - Dashboard com insights

---

## 🚀 Próximas Versões

Quando quiser conectar com backend:

1. **Remover dados fictícios**
2. **Adicionar chamadas de API**
3. **Integrar com OCR** (cupom fiscal)
4. **Salvar comparações do usuário**
5. **Alertas de preço por email**

---

## ✅ Status

- ✅ Aba visível e acessível
- ✅ 4 telas funcionais
- ✅ Dados mockados realistas
- ✅ UI/UX polida
- ✅ Gráficos funcionando
- ✅ Pronto para demonstração

**Divirta-se explorando o módulo!** 🎉

