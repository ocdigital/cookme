# CookMe — Briefing Landing Page
>
> Para: Claude Design  
> Versão: MVP · Plataforma: Android (iOS em breve) · Mercado: Brasil

---

## TL;DR — Espírito do projeto

CookMe não é um app de receitas. É um companheiro de cozinha.

A maioria das pessoas não pede delivery porque quer — pede porque não sabe o que fazer com o que tem em casa. O CookMe resolve exatamente isso: olha para o que você já comprou, entende como você come, e te diz o que cozinhar hoje. Sem desperdício, sem gasto desnecessário, sem aquela culpa de jogar comida fora.

**Posicionamento:**
> "Cozinhe mais. Peça menos. Desperdice zero."

**Tom:** Amigo que ama cozinhar e sempre tem uma ideia na manga. Quente, encorajador, brasileiro. Não é tech — é cozinha caseira com inteligência por baixo.

---

## Reposicionamento crítico (leia antes de tudo)

A tentação é destacar a tecnologia (IA, scanner de nota fiscal). **Não faça isso.**

O herói da landing não é o app. É a transformação:

| O que o usuário sente hoje | O que o CookMe entrega |
| --------------------------- | ------------------------ |
| "Não sei o que cozinhar" | Ideia na hora, com o que tem em casa |
| "Vou pedir delivery de novo" | Prato pronto, gasto 4x menor |
| "Esse tomate vai estragar" | Virou jantar de hoje |
| "Comprei coisa demais" | Despensa zero desperdício |
| "Não tenho tempo de planejar" | Semana planejada em 2 minutos |

A tecnologia aparece como **consequência**, não como feature principal.

---

## 1. Identidade Visual

### Paleta de cores

| Token | Hex | Uso |
| ------- | ----- | ----- |
| **Verde Primary** | `#3D9E52` | Botões, destaques, CTAs |
| **Verde Dark** | `#2E7D3F` | Hover, bordas |
| **Verde Light** | `#DFF2E3` | Backgrounds de cards, badges |
| **Verde Pálido** | `#F2FAF3` | Seções alternadas de fundo |
| **Âmbar** | `#F5A623` | Alertas de vencimento, urgência positiva |
| **Off-white quente** | `#FAFAF8` | Background geral (não branco puro — levemente amarelado, como papel, como cozinha) |
| **Ink Dark** | `#1A1610` | Títulos e textos principais |
| **Ink Mid** | `#5C564D` | Textos secundários |
| **Ink Light** | `#9E9890` | Textos terciários |

> ⚠️ O off-white `#FAFAF8` é intencional. Não usar branco `#FFFFFF` — o app tem personalidade de cozinha real, não de startup fria.

### Mood visual

- **Fotografia:** comida de verdade, feita em casa, imperfeita e gostosa. Nada de foto de restaurante estrelado.
- **Texturas:** madeira de tábua de corte, pano de prato, bancada de cozinha. Quente, real, acolhedor.
- **Ícones:** traço arredondado, orgânico. Sem ícones metálicos ou tech demais.
- **Referências de mood:** mercado de bairro, cozinha de avó modernizada, horta em apartamento.

### Tipografia

- Display/H1: **700 weight**, tracking negativo (`letter-spacing: -0.4`)
- Corpo: **500 weight**, sem serifa, legível
- Micro/badge: **700 weight**, `letter-spacing: +0.4` (caixa alta funciona bem)
- Sem fonte serifada — não é app de gastronomia fine dining, é cozinha do dia a dia

### Logo

- Nome: **CookMe** (sem espaço, sem hífen)
- Ícone base: 🍳 panela
- Cor de fundo do ícone: `#FF6B6B` (coral quente — contraste intencional com o verde do app)

---

## 2. Estrutura da Landing Page

### Visão geral (fluxo narrativo)

```
HERO             → Identidade + chamada emocional
TENSÃO           → O problema que todo mundo reconhece
DADOS            → Prova concreta da dor (números reais)
SOLUÇÃO          → Como o CookMe entra no dia a dia
FUNCIONALIDADES  → Em linguagem de momento, não de feature
PERFIL           → Personalização sem esforço
MANIFESTO        → O espírito maior (ambiente + economia)
CTA              → Download grátis
FOOTER
```

---

### SEÇÃO 1 — HERO

**Objetivo:** Identificação imediata. A pessoa vê e pensa "isso é pra mim".

**Headline principal (escolher uma):**

> **Cozinhe mais. Peça menos. Desperdice zero.**

> **Tá sem ideia do que cozinhar? Calma. É pra isso que estou aqui.**

> **O que tem na sua geladeira vira janta hoje.**

**Subheadline:**
> O CookMe olha para o que você já comprou, entende como você come, e te diz o que cozinhar — do seu jeito, com o que você já tem em casa.

**Visual do hero:**

- Mockup de celular mostrando a tela Home do app (carrossel de sugestões "faça agora" / "use antes que vença")
- Ao fundo: cozinha de apartamento, bancada com ingredientes reais, luz natural quente
- NÃO usar foto de chef, restaurante ou comida de estúdio

**CTA:**
> **Baixar grátis** · Google Play
> *(micro-copy abaixo: "Grátis · Sem cartão · Android 8.0+")*

---

### SEÇÃO 2 — A TENSÃO (o problema que todo mundo reconhece)

**Objetivo:** Empatia. Mostrar que o CookMe entende a vida real.

**Título:**
> "Mais um dia sem saber o que cozinhar."

**Layout sugerido — 3 cenas do cotidiano:**

```
😔 18h. Geladeira aberta.          🛵 De novo o delivery.           🗑️ Segunda vez essa semana.
"Tem coisa aqui, mas não sei       R$ 65 por um prato que           O tomate que você comprou
 o que fazer com isso tudo."        você faria em casa               na segunda foi pro lixo.
                                    por R$ 15.
```

**Texto de conexão:**
> Não é preguiça. Não é falta de tempo. É falta de ideia.  
> E ideia é exatamente o que o CookMe tem por você.

---

### SEÇÃO 3 — OS NÚMEROS (prova da dor)

**Objetivo:** Dar peso real ao problema. Apelar pra razão depois da emoção.

**Layout:** 3 stats grandes, visual impactante

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   R$ 800/mês    │  │      30%        │  │   4x mais caro  │
│                 │  │                 │  │                 │
│ Gasto médio em  │  │ da comida       │  │ Delivery vs     │
│ delivery no     │  │ comprada vai    │  │ cozinha em      │
│ Brasil          │  │ para o lixo     │  │ casa            │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Texto de transição:**
> Cozinhar em casa não é difícil. O difícil é saber o que fazer.  
> O CookMe resolve a única parte que te trava.

---

### SEÇÃO 4 — COMO FUNCIONA (momentos do dia, não features)

**Objetivo:** Mostrar o app no contexto da vida real. Sem linguagem técnica.

**Título:**
> "O CookMe entra na sua rotina sem você precisar mudar nada."

**3 momentos (com mockup de tela ao lado de cada um):**

---

**🛒 Antes de ir ao mercado**
> Diz o que você quer comer na semana.  
> O CookMe monta a lista com exatamente o que falta — nada sobrando, nada faltando.

*(Tela: lista de compras organizada por categoria, com estimativa de gasto)*

---

**🏠 Ao chegar em casa**
> Escaneia a nota fiscal ou digita o que comprou.  
> O app atualiza sua despensa e já te mostra o que dá pra fazer hoje.

*(Tela: despensa com ingredientes + sugestão "faça agora")*

---

**🍽️ Na hora do "o que tem pra comer?"**
> Abre o app. Vê o que o CookMe sugere.  
> Receita completa, com o que você tem, do jeito que você come.

*(Tela: detalhe de receita com modo de preparo)*

---

### SEÇÃO 5 — FUNCIONALIDADES (linguagem humana, não técnica)

**Título:**
> "Tudo que você precisa para cozinhar mais e se preocupar menos."

**6 cards — layout em grid 2x3 ou 3x2:**

---

🍳 **Receitas com o que você tem**
Chega de entrar no app de receitas e descobrir que falta metade dos ingredientes. O CookMe só sugere o que você já pode fazer.

---

📋 **Planejamento da semana pronto**
Segunda a domingo, almoço e jantar. O app monta, você aprova. Muda o que quiser. Em menos de 2 minutos.

---

🛒 **Lista de compras inteligente**
Planejou a semana? A lista já está pronta — organizada por categoria, com preço estimado. Só ir ao mercado.

---

⏰ **Alerta de vencimento**
O pepino está para vencer amanhã? O CookMe avisa e já sugere uma receita que usa ele hoje. Menos culpa, mais aproveitamento.

---

🌿 **Do seu jeito alimentar**
Fitness, vegetariano, vegano ou sem restrição. Configura uma vez. O app nunca mais te mostra receita que não combina com você.

---

📊 **Despensa sempre atualizada**
Escaneia a nota do mercado ou adiciona manualmente. O app sabe o que você tem, o que acabou e o que está chegando ao fim.

---

### SEÇÃO 6 — MODO ALIMENTAR (destaque especial)

**Título:**
> "Para o seu jeito de comer. Não para um jeito genérico."

**Subtítulo:**
> Configura uma vez. O app aprende e adapta tudo automaticamente — receitas, planejamento e lista de compras.

**4 cards visuais — cor distinta para cada um:**

| Modo | Cor do card | Ícone | Tagline |
| ------ | ------------- | ------- | --------- |
| **Normal** | Verde `#3D9E52` | 🍽️ | "Sem restrições. Sem limites." |
| **Fitness** | Âmbar `#F5A623` | 💪 | "Proteína, energia, resultado." |
| **Vegetariano** | Verde claro `#5CB870` | 🥦 | "Sem carne. Com muito sabor." |
| **Vegano** | Verde escuro `#2E7D3F` | 🌱 | "Natural de verdade, do início ao fim." |

---

### SEÇÃO 7 — MANIFESTO (o espírito maior)

**Objetivo:** Criar identificação emocional profunda. Mostrar que CookMe tem um propósito além de ser um app.

**Layout:** Fundo verde escuro `#235F30`, texto claro, tipografia grande. Tom de manifesto, não de marketing.

**Texto:**

> ### Cozinhar em casa é um ato político
>
> É dizer não para o desperdício de 30% da comida que o Brasil joga fora todo ano.
> É dizer não para o delivery que custa 4 vezes mais e chega frio.
> É dizer sim para saber o que tem no seu prato.
> Para sentar à mesa com quem você ama.
> Para o cheiro de comida feita em casa.
>
> **Não é nostalgia. É escolha.**
>
> O CookMe está aqui para essa escolha ser fácil.

*(Opcional: linha de dado ambiental — "Cada refeição cozinhada em casa evita em média X gramas de embalagem plástica")*

---

### SEÇÃO 8 — SCREENSHOTS DO APP

**Objetivo:** Prova visual de que o app é real, bonito e fácil de usar.

**Layout sugerido:** Carrossel de 5 telas em mockup de celular (frame Pixel 7 ou iPhone 14 Pro), com legenda curta embaixo.

**Ordem e legenda:**

1. **Home** — "Suas sugestões de hoje, com o que você tem em casa"
2. **Semana** — "A semana planejada. Você só aprova."
3. **Despensa** — "Tudo o que você tem. Nada esquecido."
4. **Lista de compras** — "O que comprar. Quanto vai gastar."
5. **Receita** — "Passo a passo. Sem complicação."

> 📌 Para o designer: screenshots podem ser tirados via Expo Go no celular físico ou emulador Android. Assets do ícone em `mobile/assets/images/`.

---

### SEÇÃO 9 — CTA FINAL

**Título:**
> "Comece hoje. Sua primeira semana planejada em menos de 2 minutos."

**Botões:**

```
[  ▶  Baixar grátis no Android  ]   (badge Google Play real)
[  🔔  Avise-me quando chegar no iPhone  ]  → campo de e-mail
```

**Micro-copy:**
> Grátis · Sem cartão de crédito · Android 8.0+

**Visual:** Mockup final do app + foto de fundo de cozinha aconchegante com família/pessoa cozinhando

---

### SEÇÃO 10 — FOOTER

```
Logo CookMe

[Sobre]  [Privacidade]  [Termos]  [Contato]

Instagram: @cookme.app

"Feito com ❤️ e fome no Brasil."
```

---

## 3. Palavras-chave para usar na copy

**Usar:**
`cozinha caseira` · `em casa` · `o que você tem` · `sem desperdício` · `peça menos` · `cozinhe mais` · `sem ideia` · `calma` · `planeja por você` · `economia real` · `comida de verdade` · `do seu jeito` · `sua despensa` · `sua semana` · `menos culpa`

**Evitar:**
`OCR` · `machine learning` · `inteligência artificial` (pode dizer "inteligente" sem o nome da tecnologia) · `escanear` como destaque principal · `API` · `tecnologia de ponta` · `solução` · `plataforma` · `ecossistema`

---

## 4. Referências de mood (para inspiração)

| Referência | O que absorver |
| ----------- | ---------------- |
| **Mealime** | Limpo, foco em receitas, weekly planning visual |
| **Mercado Livre** | Clareza de CTA, confiança, conversão direta |
| **Oatly (marca)** | Manifesto com personalidade, tom humano, não corporativo |
| **Too Good To Go** | Apelo ambiental + emocional + praticidade juntos |
| **Hortifruti (marca BR)** | Comida real, colorida, calor humano brasileiro |

**O que NÃO fazer:**

- Visual frio tipo app de fintech
- Paleta toda branca sem textura
- Foto de chef profissional com prato de restaurante
- Headline genérico tipo "o melhor app de receitas"

---

## 5. Checklist para o designer

### Conteúdo

- [ ] Hero com headline emocional (não técnica) + mockup Home do app
- [ ] Seção de tensão com 3 cenas do cotidiano
- [ ] 3 stats grandes (delivery, desperdício, custo)
- [ ] 3 momentos do dia (antes do mercado / ao chegar / na hora H) com mockup de tela
- [ ] 6 cards de funcionalidade em linguagem humana
- [ ] 4 cards de modo alimentar com cor distinta
- [ ] Carrossel de 5 screenshots reais do app
- [ ] Seção de manifesto (fundo escuro, texto de propósito)
- [ ] CTA final com badge Google Play + waitlist iOS
- [ ] Footer completo

### Técnico

- [ ] Mobile-first (maioria do tráfego vem de celular)
- [ ] Responsivo para desktop também
- [ ] Versão dark opcional (app suporta dark mode)
- [ ] Performance: imagens otimizadas (usuário BR tem conexão variável)
- [ ] Animações sutis ao scroll (não exageradas — app é sobre praticidade, não show)

### Tom

- [ ] Nenhuma headline técnica acima do fold
- [ ] Linguagem "você" (não "o usuário")
- [ ] Pelo menos 1 frase de empatia antes de qualquer feature
- [ ] Manifesto presente (propósito maior visível)

---

*Briefing v2 — Maio 2026 — CookMe MVP*  
*Posicionamento: Companheiro de cozinha. Menos desperdício. Mais comida caseira.*
