# Inteligência do CookMe

O CookMe não é um CRUD de receitas. O diferencial é um conjunto de algoritmos que conecta o que o usuário **tem em casa** com o que ele **pode cozinhar agora** — e aprende com cada interação.

Esta página documenta os sistemas de inteligência que tornam isso possível.

---

## 1. Motor de Matching — Despensa → Receitas

`ReceitaBancoService` — `backend/src/modules/receitas/services/receita-banco.service.ts`

O coração do CookMe. Dado o inventário do usuário, calcula quais receitas são possíveis — e ordena por relevância real, não por contagem simples de ingredientes.

### O Problema do Matching Ingênuo

> **Churrasco sem carne é uma fogueira.**

Um sistema simples compararia: "você tem 8 dos 10 ingredientes → 80% de cobertura". Isso falha em um caso real:

- Receita: **Frango Assado com Alho e Ervas**
- Ingredientes: `frango`, `alho`, `azeite`, `sal`, `pimenta`, `orégano`, `tomilho`
- Usuário tem: `alho`, `azeite`, `sal`, `pimenta`, `orégano`, `tomilho` (falta o frango)

Matching ingênuo: **6/7 = 85% — "disponível"**. Mas sem frango, a receita é impossível.

### Sistema de Pesos

Cada ingrediente recebe um peso baseado na sua importância para a receita:

| Peso | Tipo | Exemplos |
|------|------|---------|
| **3** | Protagonista | `frango`, `carne`, `macarrão`, `feijão`, `salmão`, `berinjela`, `batata` |
| **1** | Base | Aromáticos e vegetais que definem o prato mas não são o nome dele |
| **0.3** | Auxiliar | `sal`, `pimenta`, `alho`, `cebola`, `azeite`, `orégano` — todo mundo tem |

**Posição como sinal:** `ingredientes_chave[0]` é o protagonista por definição (o IA sempre coloca o ingrediente principal primeiro). Mesmo que não esteja na lista hardcoded de protagonistas, posição 0 recebe peso 3 automaticamente.

**Contexto-sensível:** `farinha` vale 3 em bolos/pães, 0.3 em pratos salgados. `açúcar` vale 3 em sobremesas, 0.3 em pratos principais.

```
Frango Assado sem frango:
  frango (peso 3) → ausente → pesoEncontrado: 0
  alho (peso 0.3) → presente
  azeite (peso 0.3) → presente
  sal (peso 0.3) → presente
  
  Cobertura ponderada = 0.9 / 3.9 = 23% → NÃO DISPONÍVEL
```

### Threshold Adaptativo

Uma receita entra na lista se:
- **Tem protagonista presente** → threshold mínimo: 15% (receita relevante mesmo incompleta)
- **Sem protagonista** → threshold mínimo: 40% (evita lixo)

Disponível para executar agora: cobertura ≥ **70%** (ponderada).

### Três Categorias de Resultado

```
receitas/disponiveis
├── disponivel: true  (cobertura ≥ 70%) → fundo verde no mobile
├── disponivel: false, temProtagonista: true  → cinza com "faltam X ingredientes"
└── disponivel: false, temProtagonista: false → parcial, aparece por último
```

### "Quase Possíveis" — Diferencial CookMe

`GET /receitas/quase-possiveis`

Receitas com cobertura 40-74%, ordenadas por **menor número de ingredientes faltando**. Gera a mensagem motivacional:

- *"Falta só 1 ingrediente!"*
- *"Faltam 2 ingredientes — vale a pena comprar?"*

Isso fecha o ciclo com `POST /receitas/:id/comprar-faltando` → adiciona os faltantes direto na lista de compras.

---

## 2. Normalização de Ingredientes

`IngredientNormalizerService` — `backend/src/modules/receitas/services/ingredient-normalizer.service.ts`

Converte qualquer forma de ingrediente para um nome canônico que permite matching.

### Pipeline de Normalização

```
"2 dentes de alho amassado"
  → lowercase + remove acentos para processamento
  → remove quantidade: "dentes de alho amassado"
  → remove unidade: "de alho amassado"
  → remove "de": "alho amassado"
  → remove adjetivos de preparo: "alho"
  → lookup em SINONIMOS: "alho" (já canônico)
  → result: "alho"
```

```
"500g de farinha de trigo peneirada"
  → remove quantidade + unidade: "farinha de trigo peneirada"
  → remove adjetivos: "farinha de trigo"
  → result: "farinha de trigo"
```

```
"macaxeira"
  → lookup SINONIMOS_REGIONAIS: "mandioca"
  → result: "mandioca"
```

### Sinonímia Regional Brasileira

O sistema conhece variações regionais do Brasil:

| Nordeste | Sul/Sudeste | Canônico |
|----------|------------|---------|
| macaxeira | aipim | `mandioca` |
| jerimum | moranga | `abobora` |
| cará | taro | `inhame` |
| jabá | charque | `carne seca` |
| feijão de corda | feijão verde | `feijao de corda` |

### Ingredientes "A Gosto"

Sal, pimenta, azeite, orégano etc. são marcados como `aGosto: true`. Eles **não bloqueiam** uma receita — se você não tiver orégano, ainda pode fazer o frango assado.

### Termos de Busca para Scraping

`termosParaBusca("bisteca")` → `["bisteca de porco", "bisteca suína", "chuleta de porco", "costeleta suína"]`

Usado pelo scraper para encontrar receitas relevantes em sites externos.

---

## 3. Auto-Classificação de Tags Dietéticas

`ReceitaClassificacaoService` — `backend/src/modules/receitas/services/receita-classificacao.service.ts`

Ao salvar qualquer receita (scraping, IA ou usuário), o sistema classifica automaticamente as tags de dieta baseado nos ingredientes — sem precisar de input humano.

### Lógica

```
ingredientes_chave = ["frango", "alho", "azeite", "limao"]

temCarne(ingredientes) → true (frango está em CARNES)
  → sem tags vegetariano/vegano

ingredientes_chave = ["grao de bico", "tomate", "cebola", "azeite"]
temCarne → false
temProdutoAnimal → false
  → tags: ["vegano", "vegetariano"]

ingredientes_chave = ["ovo", "queijo", "espinafre"]
temCarne → false
temProdutoAnimal → true (ovo, queijo estão em NAO_VEGANO)
  → tags: ["vegetariano"]  (não é vegano)
```

### Detecção Fitness

Ativado por qualquer um dos três:
1. Tag `fitness` no scraping original
2. Título contém: `fitness`, `fit`, `proteico`, `low-carb`, `integral`, `sem glúten`
3. Ingredientes contêm: `aveia`, `quinoa`, `chia`, `linhaça`, `whey`

---

## 4. Classificação de Produtos do OCR

`ProductClassificationService` — `backend/src/modules/product-classification/services/product-classification.service.ts`

Quando o usuário scanneia uma nota fiscal, cada item precisa ser classificado: é um alimento que vai para a despensa? É produto de limpeza? Precisa ir pro inventário como ingrediente?

### Arquitetura Cache-First

```
classificarProduto("ARROZ TIPO 1 5KG")
  ↓
1. Normaliza nome: "arroz tipo 1"
2. Busca no product_knowledge_base
   ├── encontrado + confidence ≥ 75% → retorna do cache (0ms, $0)
   └── não encontrado ou baixa confiança
         ↓
3. Chama Claude API (ou Gemini como fallback)
4. Salva resultado no cache
5. Próximo usuário que tiver "arroz tipo 1" usa o cache
```

O cache é **compartilhado entre todos os usuários**. Cada classificação nova beneficia todos.

### Threshold de Confiança

- **≥ 75%** → auto-confirmado (badge verde no mobile, sem perguntar ao usuário)
- **< 75%** → mostra ao usuário: "Isso é um alimento?" [Sim] [Não]

### Aprendizado por Validação

Quando o usuário clica "Sim" ou "Não":
```
POST /receitas/ocr/classify-items → retorna itens com confiança
  → usuário confirma na tela de validação
  → sistema atualiza confidence_score no product_knowledge_base
  → próxima vez: maior confiança, menos perguntas
```

### Batch para Economia

Um cupom fiscal tem ~20-50 itens. Em vez de 50 chamadas à API:

```
classificarEmBatch(["ARROZ 5KG", "SABÃO PÓ 1KG", "FRANGO CONGELADO", ...])
  → 1 chamada única com todos os produtos
  → economiza ~95% de custo de API
```

---

## 5. Motor de Aprendizado por Usuário

`AprendizadoService` — `backend/src/modules/receitas/services/aprendizado.service.ts`

Com o tempo, o CookMe aprende o que cada usuário gosta — sem precisar perguntar explicitamente.

### Como Aprende

Cada vez que o usuário executa uma receita e dá nota (`POST /planejamento/:id/feita` com `avaliacao`):

```sql
SELECT e.avaliacao, p.nome as ingrediente, r.tags_dieta
FROM receitas_executadas e
JOIN receitas r ON r.id = e.receita_id
JOIN receita_ingredientes ri ON ri.receita_id = r.id
JOIN produtos p ON p.id = ri.produto_id
WHERE e.usuario_id = $1 AND e.avaliacao IS NOT NULL
```

**Nota ≥ 4:**
- Cada ingrediente da receita: `score += 0.3` em `INGREDIENTE_FAVORITO`
- Se executou mais de 1 vez: `score += 0.2` (reforço)
- Cada tag de dieta: `score += 0.2` em `CATEGORIA_FAVORITA`

**Nota ≤ 2:**
- Cada ingrediente: `score += 0.5` em `INGREDIENTE_AVERSAO`
- Cada tag: `score += 0.3` em `CATEGORIA_AVERSAO`

### Perfil de Aprendizado

`GET /receitas/perfil-aprendizado`

```json
{
  "ingredientes_favoritos": 60,    // % preenchido (cap 100%)
  "gostos_e_aversoes": 30,
  "ritmo_de_cozinha": 45,
  "categorias_preferidas": 20,
  "total_avaliacoes": 9
}
```

Exibido no mobile como "o CookMe está te conhecendo melhor". Com mais avaliações, as sugestões ficam mais precisas.

---

## 6. Geração de Receitas com IA

`RecipeGeneratorService` — `backend/src/modules/receitas/services/recipe-generator.service.ts`

Quando o banco de receitas não tem opções suficientes para o inventário do usuário, o sistema gera receitas novas com IA.

### Cadeia de Fallback

```
1. Banco local (ReceitaBancoService)
   ↓ < 8 receitas disponíveis
2. Scraping TudoGostoso (RecipeSearchService + Puppeteer)
   ↓ scraping falha ou sem resultado
3. Anthropic Claude API
   ↓ Claude sem créditos / erro
4. Google Gemini API
   ↓ Gemini falha
5. Mock recipes (garantia de resposta sempre)
```

### Banco Compartilhado

Receitas geradas pela IA são salvas no banco global (`receitas` com `origem: 'ia_gerada'`). A próxima pessoa que tiver ingredientes similares já encontra sem precisar gerar de novo.

```
usuário A pede receitas com [frango, brócolis, alho]
  → IA gera "Frango com Brócolis no Alho"
  → salva no banco
usuário B com [frango, brócolis, cenoura, alho]
  → banco já tem "Frango com Brócolis no Alho"
  → retorna do banco (0 custo de IA)
```

### Geração por Modo Alimentar

Quando o banco tem menos de 8 receitas de um modo específico, dispara em background:

```ts
// Background — não bloqueia a resposta
if (resultado.length < 8) {
  this.recipeGeneratorService.popularModoAlimentar('vegetariano').catch(() => {});
}
```

---

## 7. OCR de Nota Fiscal

`ReceiptOcrService` + `ReceiptOcrController`

Fluxo completo do scan de cupom para despensa:

```
1. Usuário fotografa nota (pode ser múltiplas fotos)
2. POST /receitas/ocr/extract-from-image
   → Gemini Vision (gemini-2.5-flash) lê o texto
   → retorna linhas: "ARROZ TIPO 1 5KG 2 UN x 18,90 37,80"
3. POST /receitas/ocr/process
   → parser extrai: { nome, quantidade, valor_unitario, valor_total }
   → deduplicação entre fotos (item que aparece em 2 fotos = 1 item)
   → se duplicatas ambíguas → status: "review_required" → usuário confirma
4. POST /receitas/ocr/classify-items
   → ClassificationService em batch classifica alimento/não-alimento
5. Tela de validação
   → confiança ≥ 75%: badge verde, auto-confirmado
   → confiança < 75%: botão Sim/Não
6. POST /compras/ocr-cupom/salvar-itens
   → salva no inventário do usuário
   → cria registro em compras com valor total
```

---

## 8. Alerta de Vencimento → Prioridade de Receita

Integração sutil mas poderosa: quando uma receita usa ingredientes que estão prestes a vencer, ela é **destacada** no mobile.

```ts
// Em receitas/disponiveis:
const nomesVencendo = vencendo
  .filter(inv => inv.produto?.ingrediente_receita && !inv.esgotado)
  .map(inv => inv.produto.nome_display.toLowerCase());

receitas.map(r => ({
  ...r,
  usa_vencendo: nomesVencendo.filter(nome =>
    r.receita.ingredientes_chave.some(k => k.includes(nome) || nome.includes(k))
  )
}))
```

No mobile: receitas com `usa_vencendo.length > 0` aparecem com badge laranja "Use antes que vença".

---

## Fluxo Completo — Da Despensa à Receita

```
Usuário tem em casa:
  frango 500g (vence em 3 dias)
  brócolis
  alho, azeite, sal, pimenta (sempre tem)

GET /receitas/disponiveis
  → IngredientNormalizerService: normaliza inventário
  → ReceitaBancoService: calcula cobertura ponderada para 200 receitas
  → ReceitaClassificacaoService: já aplicou tags ao salvar
  → resultado:
      "Frango Grelhado com Brócolis" — 100% — usa_vencendo: [frango]  ← badge laranja
      "Frango ao Molho Pardo"        — 85%  — disponível
      "Strogonoff de Frango"         — 72%  — disponível (falta creme de leite, mas tem protagonista)
      "Macarrão à Bolonhesa"         — 23%  — parcial (falta carne, peso 3)

Usuário abre "Frango ao Molho Pardo" → GET /receitas/:id
  → ingredientes_produtos: lista para "Fiz essa receita" marcar o que acabou

Usuário faz a receita → POST /receitas/:id/executar
  → incrementa vezes_executada global
  → salva em receitas_executadas

Usuário dá nota 5 → AprendizadoService.derivarPreferencias
  → frango: INGREDIENTE_FAVORITO score += 0.3
  → normal: CATEGORIA_FAVORITA score += 0.2
```

---

## Resumo dos Serviços Inteligentes

| Serviço | Arquivo | O que faz |
|---------|---------|----------|
| `ReceitaBancoService` | `receitas/services/receita-banco.service.ts` | Matching ponderado inventário↔receitas |
| `IngredientNormalizerService` | `receitas/services/ingredient-normalizer.service.ts` | Normalização + sinonímia regional |
| `ReceitaClassificacaoService` | `receitas/services/receita-classificacao.service.ts` | Auto-tag vegano/vegetariano/fitness |
| `ProductClassificationService` | `product-classification/services/` | OCR → alimento/não-alimento (cache compartilhado) |
| `AprendizadoService` | `receitas/services/aprendizado.service.ts` | Preferências derivadas de avaliações |
| `RecipeGeneratorService` | `receitas/services/recipe-generator.service.ts` | Claude → Gemini → mock, banco compartilhado |
| `ReceiptOcrService` | `receitas/services/receipt-ocr.service.ts` | Parser de cupom + deduplicação multi-foto |
