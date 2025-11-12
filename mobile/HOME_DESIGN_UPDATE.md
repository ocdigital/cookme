# 🍳 Home Screen - Design Profissional e Focado em Comida

## 📋 Mudanças Principais

### ❌ Removido:
- ❌ Saudação pessoal do usuário (ex: "Olá, Eduardo!")
- ❌ Botão de logout simples no canto
- ❌ Emojis em títulos de seção

### ✅ Adicionado:
- ✅ **Avatar/Foto do usuário** (canto superior direito) com clique para sair
- ✅ **Alerta proeminente** de produtos vencendo
- ✅ **Botão direto** para receitas com produtos que estão vencendo
- ✅ **Design profissional** com paleta de cores focada em comida

---

## 🎨 Nova Paleta de Cores

Inspirada em alimentos naturais e aquecidos:

| Elemento | Cor | Uso |
|----------|-----|-----|
| **Header** | `#FF8C42` (Laranja) | Barra superior, logo |
| **Alerta** | `#FF6B35` (Vermelho-alaranjado) | Box de produtos vencendo |
| **Destaque** | `#FFB84D` (Ouro) | Dica do dia, destaques |
| **Fundo** | `#FFFBF0` (Bege claro) | Background principal |
| **Cards** | `#FFFFFF` (Branco) | Cartões de conteúdo |
| **Texto Principal** | `#2C1810` (Marrom escuro) | Títulos, texto importante |
| **Texto Secundário** | `#6B4423` (Marrom médio) | Subtítulos, descrições |
| **Bordas** | `#F0E5D8` (Bege médio) | Separadores, bordas |
| **Indicadores Inativos** | `#E8D5C4` (Bege quente) | Carousel pagination |

---

## 📱 Estrutura da Home Atualizada

### **1. Header (Logo + Avatar)**
```
[CookMe]                      [👤]
```
- Logo "CookMe" em branco sobre laranja
- Avatar redondo à direita
- Clique no avatar para logout
- Altura: 60px com padding

### **2. Alert Box - Produtos Vencendo**
```
┌─────────────────────────────────────┐
│ ⏰ 3 produtos vencendo              │
│    Use-os em receitas antes do      │
│    vencimento                       │
│                                     │
│ • Frango Peito                   2d │
│ • Queijo Meia Cura               1d │
│ • Tomate                         3d │
│                                     │
│  Receitas com esses alimentos →    │
└─────────────────────────────────────┘
```
- Fundo: `#FFF3E0` (bege alaranjado)
- Borda esquerda: `#FF6B35` (alaranjado)
- Lista de produtos com:
  - Dot vermelho à esquerda
  - Nome do produto
  - Dias restantes em badge
- Botão Call-to-Action para receitas com esses alimentos

### **3. Receitas em Destaque (Carousel)**
```
[Imagem 1] [Imagem 2] [Imagem 3]
   ● ●  ○
```
- 5 receitas principais
- Indicadores de página (laranja quando ativo)
- Clique para detalhes

### **4. Navegação Principal (2 Botões)**
```
┌──────────────┐  ┌──────────────┐
│ 🍳           │  │ 📦           │
│ Todas as     │  │ Meu          │
│ Receitas     │  │ Inventário   │
│              │  │              │
│ Explore      │  │ Cadastre e   │
│ receitas...  │  │ gerencie...  │
└──────────────┘  └──────────────┘
```
- Dois botões com 50% da largura
- Cores suaves: `#FFE4C4` e `#FFEFD5`
- Descrição breve de cada ação

### **5. Acesso Rápido (Grid 2x2)**
```
┌──────┐ ┌──────┐
│ 📖   │ │ 🍽️   │
│      │ │      │
└──────┘ └──────┘
┌──────┐ ┌──────┐
│ 📋   │ │ ❤️   │
│      │ │      │
└──────┘ └──────┘
```
- Buscar Receitas
- Produtos Cadastrados
- Histórico de Cupons
- Receitas Favoritas

### **6. Sugestões para Você**
```
┌─────────────────────────────────────┐
│ 📌 Recomendado                      │
│                                     │
│ Receitas com seus produtos          │
│ Com base no seu inventário atual    │
│                                     │
│ [Explorar]                          │
└─────────────────────────────────────┘
```
- Card colorido com fundo laranja
- Badge "Recomendado"
- Sugestões dinâmicas

### **7. Dica do Dia**
```
┌─────────────────────────────────────┐
│ 🥗 Prepare ingredientes com          │
│    antecedência                     │
│                                     │
│    O "mise en place" deixa a        │
│    culinária mais fácil...          │
└─────────────────────────────────────┘
```
- Card branco com borda esquerda ouro
- Ícone e conteúdo descritivo

---

## 🎯 User Flow Esperado

1. **Usuário abre o app**
   - Vê header com seu avatar

2. **Logo vê alerta de produtos vencendo**
   - Destaque em caixa alaranjada
   - Produto com dias restantes

3. **Dois caminhos possíveis:**
   - **Opção A:** Clica em "Receitas com esses alimentos"
     - Vai direto para RecipesList
     - Sistema filtra receitas com aqueles produtos

   - **Opção B:** Navega pela home explorar
     - Carousel de receitas destacadas
     - Botão "Todas as Receitas"
     - Botão "Meu Inventário"

---

## 🔧 Componentes Técnicos

### Avatar
- Imagem redonda de 40x40px
- Avatar API: `https://ui-avatars.com/api/?name={NAME}&background=FF8C42&color=fff`
- Clique = Logout com confirmação

### Alert Box
- Condicional: Só mostra se há produtos vencendo
- Produtos mockados em `mockExpiringProducts`
- Map para renderizar lista dinâmica

### Botão de Ação
- "Receitas com esses alimentos" leva a `RecipesList`
- Futuro: Filtrar receitas automaticamente pelo inventário

---

## 🎨 Tipografia

| Elemento | Tamanho | Weight | Cor |
|----------|---------|--------|-----|
| App Title | 28px | Bold | #fff |
| Section Title | 18px | 700 | #2C1810 |
| Alert Title | 14px | 700 | #D84315 |
| Alert Subtitle | 12px | Regular | #E64A19 |
| Button Text | 12px | 700 | #fff |
| Card Text | 13-14px | 600 | #2C1810 |
| Body Text | 12px | Regular | #6B4423 |

---

## 📐 Espaçamento

- Header: 40px top, 20px bottom
- Seções: 16px horizontal, 20px vertical entre seções
- Cards: 14px padding interno
- Gaps: 8-12px entre elementos

---

## 🌈 Contraste e Acessibilidade

- ✅ Contraste WCAG AAA em textos principais
- ✅ Ícones com tamanho mínimo de 20px
- ✅ Áreas de clique mínimo de 44x44px
- ✅ Cores não como único meio de comunicação

---

## 📱 Responsividade

- Tablet: Mantém mesmo layout (cards adaptativos)
- Landscape: Carousel ajusta altura
- Diferentes densidades de pixel: Suportado via fontSize escalável

---

## ✨ Detalhes de Polimento

1. **Sombras Suaves:**
   - Alerta: `shadowOpacity: 0.08`
   - Cards: `shadowOpacity: 0.08`

2. **Bordas Arredondadas:**
   - Alert box: 14px
   - Buttons: 8px
   - Avatar: 20px (circular)

3. **Transições:**
   - Botões: `activeOpacity: 0.7`
   - Scroll suave com `scrollEventThrottle`

---

## 🔮 Futuras Melhorias

- [ ] Foto real do usuário (integração com profile)
- [ ] Integração com API de produtos vencendo real
- [ ] Filtro automático de receitas ao clicar no alerta
- [ ] Notificações push para produtos vencendo
- [ ] Tema claro/escuro
- [ ] Animações ao carregar página
- [ ] Linguagem dinâmica (PT-BR, EN, ES)

---

**Design versão:** 1.0
**Data:** 2025-11-11
**Status:** Implementado e pronto para teste
