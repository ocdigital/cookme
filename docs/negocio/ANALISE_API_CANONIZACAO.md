# Análise de Mercado e Desafios — API de Canonização de Cupom Fiscal ("a Engine")

> 2026-07-07. Decisão de contexto: a Engine será **API compartilhada** — o CookMe é o primeiro
> cliente e a mesma base atende terceiros. Este documento avalia mercado, concorrência e — o
> desafio central levantado pelo fundador — **o problema da acurácia** ("a API não pode errar
> nomes de produtos"), com números medidos, não promessas. Antes de qualquer código.

---

## 1. O produto em um parágrafo

API que recebe um cupom fiscal brasileiro (foto, QR NFC-e/SAT ou lista de descrições cruas) e
devolve itens **estruturados e canonizados**:

```
POST /v1/cupom            (imagem ou QR)
POST /v1/itens            (lista de descrições)
→ [{
    "descricao_original": "CR LEITE ITALAC 200GR",
    "produto_canonico": "creme de leite",
    "categoria": "laticínios",
    "eh_alimento": true,
    "ean": "7891234567890",
    "preco": 4.99,
    "quantidade": 1,
    "validade_estimada_dias": 180,
    "confianca": 0.97,
    "estagio": "ean"          // ean | dicionario | kb | fuzzy | ia
  }, ...]
```

O valor não é o OCR (commodity) — é a **última milha brasileira**: entender que
"CR LEITE ITALAC 200GR", "CREME LT PIRAC 200G" e "ESC COLGATE" são, respectivamente, creme de
leite, creme de leite e uma escova de dentes que não é alimento.

## 2. O mercado existe e paga — referência global de preço

| Player global | Preço/documento | Acurácia prometida |
|---|---|---|
| [Veryfi](https://www.veryfi.com/pricing/) | mínimo **US$ 500/mês** (~6.250 cupons ⇒ ~US$ 0,08/doc) | "99%+" |
| [Taggun](https://www.taggun.io/pricing) | US$ 0,05–0,08/scan | "90%+ (99% em campos-chave)" |
| [Mindee](https://www.mindee.com/pricing) | US$ 0,01–0,10/doc (250 grátis/mês) | "90%+, precisão >95% por campo" |
| Klippa / ABBYY | sob consulta (enterprise) | "99% field-level" |

**Leitura:** receipt-parsing como serviço é mercado estabelecido com disposição a pagar
US$ 0,05–0,10 por documento. **Nenhum desses players** trata o formato NFC-e/SAT brasileiro
nativamente, entende abreviação de PDV brasileiro, nem entrega canonização culinária/nutricional
("é ingrediente? qual? substitui o quê?") — todos param no line-item comercial.

## 3. Quem compra no Brasil (segmentos, do mais quente ao mais frio)

| Segmento | Exemplos | O que compram | Ticket estimado |
|---|---|---|---|
| **Finanças pessoais** | Mobills, Organizze, Minhas Economias | Quebrar "Mercado R$ 487" em itens categorizados — feature muito pedida e cara de construir | R$ 0,5–3k/mês |
| **Nutrição/dieta** | Dietbox, Webdiet, apps de macro | Compra → diário alimentar automático | R$ 0,5–2k/mês |
| **Cashback/fidelidade regional** | dezenas de players menores que o Méliuz | Cashback por PRODUTO (não por loja) exige item-level | R$ 1–5k/mês |
| **CRMs de varejo alimentar** | [Mercafacil](https://www.mercafacil.com/) (32% dos supermercados SP), [IZIO&Co](https://www.izio.com.br/), Propz | ⚠️ ambíguo: podem ser CLIENTES (enriquecimento/normalização de catálogo entre redes) ou já terem catálogo próprio — **descobrir em conversa, não assumir** | R$ 2–10k/mês |
| ERPs/PDV de mercearia | centenas | Cadastro de produto automático | R$ 0,2–1k/mês |

**TAM honesto:** nicho — algumas centenas de compradores plausíveis no BR × ticket médio
R$ 1–3k/mês ⇒ mercado endereçável na casa de **R$ 5–20M/ano**. Não é tese de unicórnio; é tese
de **negócio de API lucrativo** (margem >90% sobre custo de ~R$ 0,01/cupom) que 1-2 pessoas
operam — e que valoriza o conjunto CookMe+Engine para qualquer conversa de investimento.

## 4. Concorrência e ameaças (ordem de perigo real)

1. **"Faço com LLM cru"** — a maior ameaça. Qualquer dev chama o Gemini com um prompt e resolve
   80% do problema. Nossa defesa tem que ser explícita: (a) os 20% restantes são os que doem
   (abreviações, ambiguidade, PET≠petshop, queijo prato≠prato); (b) custo — nosso dicionário/KB
   resolve a maioria dos itens **grátis e em ~0ms**, LLM cobra por chamada e por item; (c) acurácia
   **medida e publicada** vs achismo; (d) a KB melhora com cada cupom de cada cliente (flywheel
   que o LLM cru não tem).
2. **Globais entrando no BR** (Veryfi et al.) — risco médio/lento; formato fiscal BR + português
   de PDV é exatamente a barreira que nos protege e os desinteressa (mercado pequeno para eles).
3. **Catálogos internos dos CRMs de varejo** — Mercafacil/IZIO já normalizam produto para seus
   clientes; competem no segmento deles, mas não vendem API avulsa. Podem ser cliente, parceiro
   ou concorrente — mapear.
4. **Horus/Scanntech** — NÃO competem: vendem insight agregado à indústria, não parsing por
   transação (já validado na análise de mercado do CookMe).

## 5. O DESAFIO CENTRAL: acurácia ("não pode errar nome de produto")

### 5.1 Onde estamos, medido

- **75,4%** de acurácia nos estágios offline (dicionário + regex + normalizador) no golden set
  de 57 casos reais — medido em CI, com catraca que impede regressão.
- Os estágios online (EAN aprendido, KB exata, fuzzy pg_trgm) elevam isso — mas **nunca medimos
  o número combinado em produção**. Os contadores por estágio já instalados respondem isso.
- Mercado promete 90–99%. **Gap real a fechar: ~75% → 92%+.**

### 5.2 A verdade técnica que muda o produto

**"Não errar nunca" é impossível — para nós e para a Veryfi.** Cupom traz abreviações ambíguas
por natureza ("BISC BWAW" é biscoito de cachorro; "MAÇA" pode ser maçã ou nada). O contrato de
produto vendável não é "0 erros"; é:

1. **Acurácia alta, medida e publicada** (benchmark reproduzível — nosso golden set vira material
   de vendas);
2. **Confidence score por item** — a API DIZ quando não tem certeza (`confianca: 0.55` +
   `estagio: "ia"`), e o cliente decide o que fazer com itens de baixa confiança (aceitar,
   revisar, descartar);
3. **Endpoint de correção** — cliente corrige um item → entra na KB → **aquele erro nunca mais
   acontece, para nenhum cliente**. É o mesmo loop que já construímos para o app (validação do
   usuário → KB). Cada erro é combustível do moat;
4. **Tiers de garantia**: automático (rápido/barato) vs revisado (item de baixa confiança passa
   por fila de curadoria humana — premium enterprise).

Quem vende "99% e nunca erra" sem confidence está vendendo mentira estatística. Vender
honestidade instrumentada é diferencial num mercado de claims infláveis.

### 5.3 Roadmap de acurácia (75% → 95%)

| Etapa | Ação | Ganho esperado | Custo |
|---|---|---|---|
| 1 | **Medir o número real combinado em produção** (contadores por estágio já existem) | baseline honesto | 0 — já instrumentado |
| 2 | Golden set 57 → **500+ casos** (coletar cupons reais variados: mercados, farmácias, atacarejo, padarias, outras regiões) | detecção fina de gaps | dias, contínuo |
| 3 | **Curadoria da fila de fallback** (itens que caem no último estágio = exatamente os erros) — rotina semanal de virar fallback em dicionário/KB | +5–10 pts | 1-2h/semana |
| 4 | **LLM só para baixa confiança** (item sem match determinístico → Gemini/Haiku com prompt de canonização + poucos exemplos) — em vez de LLM para tudo | +5–8 pts, custo controlado | 2-3 dias |
| 5 | **EAN-first crescendo** (já feito): cada recompra resolve com 100% de certeza | cresce sozinho | 0 |
| 6 | Feedback API do cliente (correção → KB) | erros não se repetem | 1-2 dias |
| 7 | (Enterprise) human-in-the-loop para confiança < X | acurácia contratual 98%+ | quando houver cliente pagando por isso |

**Metas por marco:** design partner (beta): ≥85% automático + confidence honesto em 100% dos
itens · GA: ≥92% · tier enterprise: ≥95–98% com revisão.

## 6. Projeção dos demais desafios

| Desafio | Gravidade | Mitigação |
|---|---|---|
| **Cobertura QR só SP** | alta p/ clientes nacionais | Caminho universal = foto/OCR (já nacional); QR multi-UF via URL autenticada do QR v2 ou InfoSimples (decisão pendente do PLANO 6.3) — clientes B2B podem mandar o XML/texto direto, o que elimina o problema para vários segmentos |
| **SLA de uptime num VPS de US$ 8** | alta p/ B2B | Contrato B2B exige o gatilho da Fase 2-3 do CRONOGRAMA_INFRA antecipado (managed PG + 2 nós) — custo entra no pricing |
| **LGPD — cupom com CPF do consumidor** | média | Descartar CPF no parse, nunca armazenar; DPA padrão com clientes; cláusula de uso p/ melhoria do serviço (KB) |
| **Dependência de LLM p/ cauda longa** | média | Já mitigado por design: LLM é último estágio; quota/custo limitados por confiança |
| **Venda B2B solo é lenta** | alta | Design partners (grátis/desconto) antes de vender; ciclo curto com dev-para-dev (docs boas + playground) |
| **Preço achatado por LLM barato** | média | Competir por acurácia medida + flywheel + custo determinístico, não por preço de token |
| **Latência em lote** (cliente manda 50k itens) | baixa | `resolverLote` já existe; fila (BullMQ) quando necessário |

## 7. Modelo de negócio (rascunho para as conversas)

- **Ancoragem**: globais cobram US$ 0,05–0,10/documento sem entender o Brasil.
- **Proposta**: R$ 0,10–0,25/cupom ou R$ 0,02–0,04/item · planos R$ 99 (2k itens) / R$ 499 (15k) /
  R$ 1.499 (60k + SLA) · enterprise sob medida com revisão humana.
- **Custo marginal**: ~R$ 0,01/cupom (OCR Gemini) e ~R$ 0 para itens resolvidos por
  dicionário/EAN/KB — margem cresce com o flywheel.
- **Design partners (2-3 primeiros)**: grátis por 3-6 meses em troca de volume de cupons reais
  (= golden set + KB) e case público.

## 8. Go/No-Go — critérios antes de escrever código

1. **5 conversas** com alvos dos 2 segmentos mais quentes (finanças, nutrição) + 1 CRM de varejo
   (descobrir se é cliente ou concorrente).
2. **Gatilho de construção**: ≥2 "quero testar isso" concretos ⇒ MVP da API (3-5 dias sobre a
   engine existente).
3. **Gatilho de abandono**: 5 conversas sem interesse real ⇒ engine continua como diferencial
   interno do CookMe; nada foi perdido (tudo que melhora a API melhora o app).
4. Em paralelo e independente do B2B: etapas 1-3 do roadmap de acurácia valem SÓ pelo CookMe.

## Fontes

- [Veryfi — pricing](https://www.veryfi.com/pricing/) · [planos e preços](https://faq.veryfi.com/en/articles/3743986-what-are-the-plans-prices-for-ocr-api) · [Receipts OCR API](https://www.veryfi.com/receipt-ocr-api/)
- [Taggun — pricing](https://www.taggun.io/pricing) · [line item extraction](https://developers.taggun.io/docs/line-item-extraction)
- [Mindee — pricing](https://www.mindee.com/pricing) · [receipt OCR](https://www.mindee.com/product/receipt-ocr-api)
- [Mercafacil](https://www.mercafacil.com/) · [IZIO&Co](https://www.izio.com.br/) · [Propz](https://propz.com.br/tag/supermercado/) — CRMs de varejo alimentar BR (mapear como cliente/parceiro/concorrente)
- Comparativos: [Invoice Data Extraction — Receipt OCR APIs](https://invoicedataextraction.com/blog/receipt-ocr-api) · [Tabscanner comparisons](https://tabscanner.com/tabscanner-comparisons-vs-top-receipt-ocr/)
