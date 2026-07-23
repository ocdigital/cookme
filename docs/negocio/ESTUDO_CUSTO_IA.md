# Estudo de Custo de IA — CookMe

> 2026-07-06. Preços verificados hoje (tabela oficial Anthropic; Gemini/Groq de tabelas públicas
> — conferir antes de decisões grandes). Tamanhos de prompt medidos no código real
> (chars ÷ 3,5 ≈ tokens PT-BR); saídas estimadas pelos `max_tokens` configurados.
> Números são ordem de grandeza para decisão, não fatura.

---

## 1. Preços dos modelos usados

| Modelo | Papel no CookMe | Input /MTok | Output /MTok |
| --- | --- | --- | --- |
| Claude Haiku 4.5 | Geração, RAG-adaptação, validação (1ª opção) | **US$ 1,00** | **US$ 5,00** |
| Gemini 2.0 Flash | OCR cupom (Vision), classificação, fallback | ~US$ 0,10 | ~US$ 0,40 |
| Gemini embedding-001 | Embeddings RAG | ~grátis/desprezível | — |
| Groq Llama 3.3 70B | Fallback final (geração+validação) | ~US$ 0,59 (free tier generoso) | ~US$ 0,79 |

Batch API Anthropic = **−50%** (assíncrono). Prompt caching: leitura ~0,1× — **mas não se aplica a nós hoje**: o mínimo cacheável do Haiku é 4.096 tokens e nossos prompts têm ~500 (ver §6).

## 2. Custo por operação (medido do código)

| Operação | Modelo | In (tok) | Out (tok) | Custo/chamada |
| --- | --- | --- | --- | --- |
| Gerar 5 receitas | Haiku | ~500 | ~1.800 | **~US$ 0,010** |
| RAG-adaptação (1 receita) | Haiku | ~450 | ~800 | ~US$ 0,0045 |
| Validação (por receita nova) | Haiku | ~450 | ~400 | ~US$ 0,0025 |
| **Geração "fria" completa** (1 ger + 1 RAG + 5 validações) | Haiku | — | — | **~US$ 0,027** |
| OCR cupom (foto → 30 itens) | Gemini Vision | ~1.300 (img+prompt) | ~900 | ~US$ 0,0005 |
| Classificação produtos (por cupom c/ itens novos) | Gemini | ~600 | ~400 | ~US$ 0,0002 |
| Scan validade rótulo | Gemini Vision | ~600 | ~100 | ~US$ 0,0001 |
| Embedding busca RAG | Gemini | ~30 | — | ~0 (cache 1h) |

**Duas leituras importantes:**

1. **O caro é gerar receita (Haiku). O resto é pó** — todo o pipeline Gemini (OCR, classificação, validade) custa ~US$ 0,001/cupom, 30× menos que uma geração.
2. **Geração fria vs cache**: quando `buscarPorIngredientes` acha ≥5 no banco compartilhado, o custo é **zero**. O banco cresce com o uso de TODOS os usuários — o custo marginal por usuário **cai** com escala. Idem KB de canonização (menos classificações) e cache RAG.

## 3. Custo por usuário ativo/mês

Persona: 4 cupons/mês, 8 pedidos de geração, 1 scan de validade.

| Fase | % gerações frias* | Custo IA / usuário ativo / mês |
| --- | --- | --- |
| Início (banco ~170 receitas) | ~50% | **~US$ 0,11** (≈ R$ 0,60) |
| 1k MAU (banco milhares) | ~25% | ~US$ 0,06 |
| 10k+ MAU (banco maduro) | ~10% | ~US$ 0,03 (≈ R$ 0,17) |

\* fria = banco não cobre e Haiku gera. O restante sai do cache compartilhado.

**Contra a assinatura de R$ 14,90:** custo de IA é 1,5–4% do ticket. **IA não é o risco do unit economics** — CAC é.

## 4. Projeção escalando (custo mensal total de IA)

| MAU | Início do patamar | Com cache maduro + otimizações §6 |
| --- | --- | --- |
| 100 | ~US$ 11 (R$ 60) | ~US$ 4 |
| 1.000 | ~US$ 70 (R$ 390) | ~US$ 30 |
| 10.000 | ~US$ 400 (R$ 2.200) | ~US$ 180 |
| 100.000 | ~US$ 3.500 (R$ 19k) | ~US$ 1.200–1.800 |

Sub-linear por design (caches compartilhados). Mesmo o pior caso de 100k MAU = custo de 1 funcionário júnior — e nesse ponto a receita (2-4% de conversão × R$14,90) paga isso ~10×.

## 5. Fase pré-tração: quanto colocar AGORA (0 → 500 usuários, 90 dias)

Consumo projetado do trimestre inteiro: **US$ 15–40 no total.**

| Provedor | Ação | Valor |
| --- | --- | --- |
| **Anthropic** | Recarregar crédito (Haiku volta = qualidade volta) | **US$ 25** — dura o trimestre com folga; alerta em US$ 5 restantes via `/admin/metricas/llm` |
| **Google Gemini** | Ativar billing pay-as-you-go no projeto (free tier está em quota ZERO — OCR/classificação/embeddings em risco) | gasto real ~US$ 1–5/mês; budget alert em US$ 10 |
| **Groq** | Manter free tier como fallback | US$ 0 |

**Total: ~R$ 150–250 no trimestre.** É o item mais barato do lançamento — não deixar a IA cair por US$ 25 (foi exatamente o modo de falha da semana passada: crédito zerou, Gemini zerou, e só o guard determinístico segurou a despensa).

## 6. Alavancas de otimização (na ordem que vale a pena)

1. **JÁ FEITO — caches compartilhados** (banco de receitas, KB canonização, guard determinístico, cache RAG 1h): é o que torna o custo sub-linear.
2. **Validação em Batch API (−50%)**: validação não precisa ser síncrona — receita nova pode nascer `pendente` e ser validada em lote/hora. Corta ~45% do custo Haiku. Vale implementar quando passar de ~1k MAU.
3. **Roteamento por plano**: free tier gera via Groq (free/barato, qualidade menor), assinante gera via Haiku. Protege a margem exatamente onde não há receita.
4. **Prompt caching Anthropic: NÃO se aplica hoje** — mínimo cacheável do Haiku é 4.096 tokens; nossos prompts têm ~500. Só reavaliar se o prompt crescer (ex: injetar perfil de paladar + contexto grande).
5. **Não desperdiçar validação**: receita duplicada (título já existe) não deveria passar pela validação de novo — checar dedupe antes de validar.
6. **Observabilidade já instalada**: `GET /admin/metricas/llm` mostra custo estimado por provider/dia. Revisar semanalmente; alerta de fallback Groq >50% já loga sozinho.

## 7. Resumo executivo

- **Manter até tracionar: ~R$ 50–80/mês.** Coloque US$ 25 na Anthropic + billing no Gemini e esqueça o assunto por um trimestre.
- **Custo por usuário: R$ 0,17–0,60/mês**, caindo com escala — 1,5–4% da assinatura. A IA não ameaça o modelo de negócio em nenhum cenário.
- **O risco real não é preço, é DISPONIBILIDADE**: as duas quedas da semana (Anthropic sem crédito, Gemini quota 0) degradaram produto sem custar um centavo. Billing ativo + alertas da `llm_chamadas` valem mais que qualquer otimização de token.
- Em 10k+ MAU: ligar Batch na validação e roteamento free→Groq / pago→Haiku; custo estabiliza em ~R$ 0,20/usuário.
