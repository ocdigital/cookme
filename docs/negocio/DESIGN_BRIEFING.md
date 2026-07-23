# CookMe — Design Briefing

## O que é

App mobile brasileiro de **gestão de despensa + geração de receitas por IA**.

Fluxo core:

1. Usuário fotografa nota fiscal do supermercado
2. OCR + IA detecta e classifica os produtos automaticamente
3. Usuário confirma apenas itens com baixa confiança da IA
4. Produtos entram no inventário
5. IA sugere receitas usando o que tem em casa
6. Usuário executa a receita; app dá baixa nos ingredientes

---

## Stack (contexto técnico para o design)

- React Native + Expo Router
- iOS + Android
- Sem hover states (touch only)
- Imagens de receitas: ~740px wide (Freepik)

---

## Público

Brasileiros, 25–45 anos, cozinham em casa, querem reduzir desperdício e economizar. Classe média, mobile-first.

---

## Telas existentes (precisam de design)

### 1. Inventário

**O que faz:** Lista todos os ingredientes que o usuário tem em casa.

**Dados exibidos por item:**

- Nome do produto
- Quantidade disponível + unidade (ex: "2 un", "500g")
- Categoria: alimento / não-alimento
- Confiança da classificação IA (0–100%)

**Interações:**

- Filtro: "Alimentos" / "Tudo"
- Editar quantidade (modal)
- Remover item
- Pull-to-refresh

**Estados especiais:**

- Badge verde + checkmark = IA confirmou com alta confiança (≥75%)
- Badge amarelo = baixa confiança, usuário confirmou manualmente
- Inventário vazio → CTA para escanear nota

---

### 2. Validação de Produtos (pós-OCR)

**O que faz:** Usuário revisa produtos detectados pela câmera antes de salvar.

**Lógica de UX (importante):**

- Itens com confiança ≥75% → aparecem com badge verde + checkmark, SEM botões (IA já decidiu)
- Itens com confiança <75% → aparecem com botão "Não é alimento" para o usuário corrigir
- Barra de progresso mostrando % validado
- Botão "Confirmar tudo" ao final

**Dados por item:**

- Nome do produto (como veio na nota)
- Categoria detectada pela IA
- Nível de confiança

---

### 3. Receitas Sugeridas

**O que faz:** IA gera receitas baseadas nos ingredientes do inventário.

**Estados:**

- Loading: IA processando (pode levar 5–10s)
- Lista de cards de receita
- Erro / sem receitas

**Dados por card:**

- Imagem (foto real, ~740px)
- Nome da receita
- Tempo de preparo
- Porções
- Badge: "Pode fazer agora" (tem todos ingredientes) ou "Faltam X ingredientes"

---

### 4. Detalhe da Receita

**Seções:**

- Imagem hero (topo)
- Nome + meta (tempo, porções, dificuldade)
- Lista de ingredientes com status: ✅ tenho / ❌ não tenho
- Modo de preparo (passo a passo numerado)
- Botão CTA: "Executar receita" → dá baixa no estoque

---

### 5. OCR da Nota (câmera)

**Steps:**

1. Escolher: câmera ou galeria
2. Capturar foto(s) — até 10 fotos
3. Processando (loading)
4. Resultado: lista de itens detectados → vai para tela de Validação

---

### 6. Lista de Compras

- Múltiplas listas
- Itens com quantidade, preço, categoria
- Marcar como comprado
- Total calculado automaticamente

---

### 7. Notificações

- Bell icon no header com badge de contagem
- Página de notificações com lista

---

## Design System necessário

### Cores

Precisa transmitir: fresco, apetitoso, confiável, moderno.
Sugestão de direção: Verde (natureza/ingredientes) + Laranja/Âmbar (culinária/calor) + fundo claro.
Evitar: tons muito frios, muito escuros, muito infantis.

### Componentes a definir

- Botões (primary, secondary, destructive, ghost)
- Cards (receita, produto, lista)
- Badges (confiança IA: alta/baixa/confirmado)
- Inputs + selects
- Modais (confirmação, edição)
- Loading states (skeleton, spinner, progress)
- Empty states (inventário vazio, sem receitas)
- Barra de progresso (validação)
- Header + Tab bar

### Tipografia

App brasileiro, legibilidade em telas pequenas é prioridade.

---

## Referências de mercado

Apps similares para referência visual:

- **Yummly** — cards de receita com foto grande
- **Mealime** — clean, ingredientes organizados
- **Tasty** — vibrante, muito visual
- **Pantry Check** — inventário doméstico

Direção desejada: entre Mealime (funcional/clean) e Tasty (apetitoso/visual).

---

## Prioridade de entrega

1. **Design System** (cores, tipo, componentes base)
2. **Tela: Receitas Sugeridas** (mais impacto visual)
3. **Tela: Inventário** (mais usada no dia a dia)
4. **Tela: Validação** (UX crítica — confiança na IA)
5. Restante das telas

---

## Notas finais

- O app já está **funcionando** — o design é uma evolução, não do zero
- Componentes são React Native (sem HTML/CSS web)
- Toda navegação é por gestos (swipe back, tab bar)
- Suporte a dark mode seria bonus, não obrigatório agora
