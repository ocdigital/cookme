# Análise Crítica de Mercado — CookMe: Continuar, Pivotar ou Colher Ativos

> Análise de 2026-07-03, complementar à `AUDITORIA.md` (due diligence técnica da mesma data).
> Papel assumido: estrategista cético fazendo a pergunta que dói — **este produto tem chance de mercado
> que justifique o próximo ano de esforço?** Números de mercado citados com fonte no fim.

---

## 1. Veredito em um parágrafo

O CookMe está tecnicamente à frente do que o mercado da categoria costuma entregar no Brasil — mas está numa **categoria estruturalmente ruim** (retenção D30 mediana de ~3,9% em food & drink, concorrentes globais gratuitos, hábito de "escanear cupom" já capturado por quem paga dinheiro de volta). A recomendação **não é matar nem dobrar a aposta**: é executar um **lançamento barato de validação em 4-6 semanas** (o código está ~90% pronto para isso), com **métricas de corte pré-definidas**, e preparar em paralelo o pivô que aproveita o ativo mais defensável do projeto — o pipeline de ingestão de cupom fiscal + taxonomia de ingredientes BR — caso os números de retenção confirmem o padrão da categoria.

---

## 2. Os fatos duros do mercado (o que não dá para ignorar)

### 2.1 A categoria "receitas + despensa" é um cemitério de retenção

- Retenção D30 mediana em food & drink: **~3,9%** (AppsFlyer/Statista). D1 já é só ~16,5%. De cada 100 instalações, ~4 pessoas abrem o app no dia 30.
- O padrão documentado da subcategoria: apps de receita/cozinha em casa têm entusiasmo inicial que **decai quando o usuário enfrenta o esforço real** de manter planejamento e inventário. É exatamente o "problema fatal da categoria" que a tese 2 do CookMe (depleção estimada) tenta resolver — a tese está certa sobre o problema; a questão é se um app solo chega vivo ao ponto de resolvê-lo.

### 2.2 A economia de apps por assinatura é brutal para entrantes

- Só **17,3%** dos apps novos atingem US$ 1K de receita recorrente mensal em até 2 anos; só **4,6%** chegam a US$ 10K (RevenueCat, 115 mil apps analisados).
- Apps lançados antes de 2020 concentram **69%** de toda a receita de assinaturas; lançamentos recentes ficam com ~3% — o mercado premia incumbência e distribuição, não features.
- Tradução para o CookMe: mesmo executando bem, o cenário mediano é receita de hobby. O cenário de sucesso exige um canal de distribuição que hoje não existe no projeto.

### 2.3 Os concorrentes diretos são gratuitos ou têm patrocinador infinito

| Concorrente | O que faz | Por que é ameaça |
| --- | --- | --- |
| **SuperCook** | Receitas pelo que você tem em casa (o core pitch do CookMe) | Gratuito, anos de mercado, multilíngue |
| **Samsung Food** (ex-Whisk) | Despensa + IA + planejamento + integração com geladeiras | Subsidiado pela Samsung, pré-instalado em hardware |
| **KitchenPal** | Despensa/geladeira/freezer + listas + receitas | Freemium maduro, exatamente o mesmo escopo |
| **TudoGostoso** | Conteúdo de receitas BR | Maior site de receitas da América Latina; dona do SEO culinário brasileiro |
| **iFood** | "O que vou jantar?" resolvido com dinheiro | 60M usuários, 160M pedidos/mês; o jantar é o horário nobre (487M pedidos/ano) — o concorrente real do CookMe não é outro app de receita, é **não cozinhar** |

### 2.4 O hábito "escanear cupom fiscal" já tem dono no Brasil — e ele paga o usuário

**Méliuz** (50M+ usuários) paga cashback em dinheiro por escanear o QR da NFC-e. O CookMe pede o mesmo gesto (escanear cupom) em troca de um benefício mais abstrato (despensa organizada). Competir pelo mesmo gesto contra dinheiro na conta é perder. Implicação: **a ingestão por cupom não é diferencial de aquisição — é infraestrutura**. O diferencial teria que estar no que se faz *depois* do cupom.

### 2.5 A tese B2B de dados de consumo já foi executada por incumbentes

A tese 1 do briefing ("preço por item como ativo estratégico + futuro B2B de dados") esbarra em:

- **Horus**: 35M+ notas fiscais coletadas **por mês**, cobertura de 86% do varejo alimentar, parceria com FGV IBRE.
- **Scanntech**: dados granulares direto do PDV de dezenas de milhares de lojas.
Um app precisaria de milhões de usuários ativos escaneando cupom para ter um dataset vendável — e ainda seria menor e mais enviesado que o dos incumbentes. **O B2B de dados de consumo não é um pivô viável para o CookMe.** O preço por item continua valioso, mas como *feature de produto* ("quanto custa sua cozinha"), não como ativo de dados.

---

## 3. O que o CookMe tem de verdade (inventário de ativos, da auditoria)

Classificado por valor de mercado real, não por esforço investido:

**Ativos com valor fora do produto atual (reaproveitáveis num pivô):**

1. **Pipeline de ingestão de cupom BR** — QR NFC-e/SAT-SP via SEFAZ + OCR Gemini Vision como caminho universal, com preço e validade por item. Nicho técnico chato que pouca gente fez direito. É o ativo mais defensável.
2. **Classificação de produto + knowledge base** (309 itens, cache compartilhado, log com custo/tokens) + `abbreviation_expansions` + `ingrediente_canonical` — o embrião da taxonomia "descrição suja de cupom → ingrediente canônico". Problema real para qualquer fintech, app de cashback, ERP de mercearia ou app de nutrição no Brasil.
3. **Taxonomia culinária BR** (`protagonistas.ts`, matching ponderado, contexto churrasco≠fogueira) — conhecimento de domínio codificado que não existe em produto internacional.

**Ativos com valor apenas dentro do produto:**
4. Cadeia de geração com fallback triplo (Haiku→Gemini→Groq) + RAG pgvector.
5. Backend completo com Stripe, limites de plano, LGPD implementada, admin.
6. Aprendizado de preferências (construído, desconectado — ver auditoria D-1).

**O que o projeto NÃO tem (e é o que o mercado cobra):**

- Distribuição: zero usuários, zero canal, zero audiência.
- Métrica: zero instrumentação de retenção (auditoria D-3) — hoje é impossível saber se o produto retém.
- Fôlego financeiro para CAC: adquirir usuário em food & drink no Brasil via mídia paga contra players gratuitos é queimar dinheiro.

---

## 4. As opções na mesa

### Opção A — Continuar o plano atual como está (B2C assinatura, roadmap cheio)

Seguir construindo (depleção estimada, taxonomia, perfil de paladar) e depois lançar.
**Avaliação: NÃO.** É investir mais 2-3 meses de features numa hipótese de retenção nunca medida, numa categoria cuja retenção mediana é 3,9%. As teses 2-4 da auditoria são boas respostas para um problema que só importa **se** alguém ficar no app até lá.

### Opção B — Lançamento de validação barato, com critérios de corte (RECOMENDADA)

O código está a ~2-3 semanas do publicável (Fases 0-2 da auditoria: fix jurídico C-1, instrumentação D7/D30, paywall, APK). Lançar na Play Store com **zero mídia paga**, aquisição orgânica (conteúdo TikTok/Reels de "escaneei meu mercado do mês", comunidades de fitness/economia doméstica), e deixar os números decidirem.

- **Custo:** ~4-6 semanas de trabalho já planejado + custo de API baixo (fallback Gemini/Groq gratuito segura).
- **Critérios de corte (definir ANTES de lançar, por escrito):** com ≥300-500 instalações orgânicas em 90 dias — D7 < 10% ou D30 < 5% ou conversão paywall < 1% → **parar de investir no B2C e ir para a Opção C**. D30 > 8-10% com uso recorrente do fluxo cupom→despensa→receita → categoria desafiada com sucesso; aí sim investir nas teses 2-4.
- Por que vale: o custo marginal é pequeno, o aprendizado é definitivo, e um app publicado com dados reais vale mais (inclusive para portfólio e para vender o pivô) do que um repositório privado perfeito.

### Opção C — Pivô B2B: "ingestão de cupom como serviço" (o plano se o B2C falhar)

Empacotar os ativos 1+2+3 como **API**: `POST cupom (QR/foto) → JSON {itens, EAN, preço, ingrediente canônico, categoria, validade estimada}`.

- **Quem compra:** apps de cashback menores que o Méliuz, apps de finanças pessoais (categorização de gasto de mercado item a item), apps de nutrição/dieta (transformar compra em diário alimentar), ERPs/CRMs de varejo pequeno, e até times que hoje tentam fazer isso com prompt cru no GPT.
- **Por que é mais defensável que o B2C:** vende para quem já tem a distribuição que o CookMe não tem; o valor está na taxonomia BR acumulada (cada cupom processado melhora a KB — flywheel real); concorre com "fazer em casa", não com Horus (que vende *insight agregado*, não *parsing por transação*).
- **Riscos honestos:** venda B2B solo é lenta; SEFAZ multi-UF vira requisito rápido; incumbente pode achatar preço. Validação barata: landing page + 5 conversas com apps de finanças/nutrição BR antes de escrever qualquer código novo.

### Opção D — Pivô de nicho B2C: fitness/dieta como cunha

Mesma base, reposicionada: "escaneie sua compra e saiba se sua despensa fecha com sua dieta e seus macros". Disposição a pagar em fitness é a maior do mobile; o CookMe já tem `modo_alimentar`, tags de dieta e informações nutricionais nas entidades.
**Avaliação:** não fazer como pivô separado agora — **embutir na Opção B**: medir no lançamento se usuários fitness retêm melhor (o evento log da auditoria D-3 responde isso de graça). Se sim, o reposicionamento é de marketing, não de engenharia.

### Opção E — Congelar e colher

Publicar como está, deixar rodar, extrair a taxonomia/classificador como projeto aberto ou lib, seguir para outra ideia.
**Avaliação:** prematuro. Vale apenas se nem a Opção B (4-6 semanas) couber na vida do fundador.

---

## 5. Recomendação e sequência

**Não é hora de pivotar — é hora de parar de construir e começar a medir.** Pivotar agora seria decidir sem dado, exatamente o erro que continuar cegamente também seria.

1. **Semanas 1-3:** Fases 0-2 da auditoria (fix jurídico C-1 → instrumentação D7/D30 + `llm_chamadas` → paywall mobile → APK → Play Store). Nada de feature nova.
2. **Antes do lançamento:** escrever os critérios de corte da Opção B num arquivo no repo (compromisso público consigo mesmo — a tentação de mover a régua depois é grande).
3. **Semanas 4-16:** aquisição orgânica apenas. Medir D7/D30 geral e por segmento (fitness vs normal; quem usou cupom vs quem não usou). A hipótese central a validar não é "gostam de receitas?" — é **"o gesto de escanear cupom sem cashback sobrevive à segunda semana?"**
4. **Dia ~90, decisão fria:**
   - Números acima do corte → dobrar no B2C: teses 2 e 4 da auditoria (depleção estimada + perfil de paladar) viram o roadmap.
   - Números abaixo do corte → **Opção C**: o app vira o "primeiro cliente" da API de ingestão; nada do trabalho técnico se perde — pipeline, KB e taxonomia são exatamente o produto do pivô.
5. **Em paralelo (custo ~zero):** 5 conversas exploratórias com potenciais compradores da Opção C (apps de finanças/nutrição BR). Se aparecer demanda forte antes do dia 90, a decisão antecipa.

**O que não fazer em nenhum cenário:**

- Não construir o microsserviço Python/Lambda (refactor sem efeito em nenhuma métrica de decisão).
- Não comprar instalação via mídia paga (queima caixa medindo a coisa errada: retenção paga ≠ retenção orgânica).
- Não perseguir o B2B de *dados agregados* (Horus/Scanntech venceram essa).
- Não adicionar mais nenhuma feature de receita antes do dia 90.

---

## 6. Fontes

- [RevenueCat — State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) e [resumo 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/) — 17,3% atingem $1K MRR; mediana $8,3K/mês aos 18 meses; concentração de receita em apps pré-2020.
- [UXCam — Mobile App Retention Benchmarks](https://uxcam.com/blog/mobile-app-retention-benchmarks/) e [Statista — retention por categoria](https://www.statista.com/statistics/259329/ios-and-android-app-user-retention-rate/) — food & drink D30 ~3,9%, D1 ~16,5%.
- [Méliuz — Nota Fiscal com cashback](https://www.meliuz.com.br/blog/meliuz-nota-fiscal/) e [app Google Play](https://play.google.com/store/apps/details?id=br.com.meliuz&hl=en_US) — 50M+ usuários, cashback por QR de NFC-e.
- [Horus & FGV IBRE](https://cestaconsumo.ehorus.com.br/) e [Horus no LinkedIn](https://www.linkedin.com/company/horusinteligencia) — 35M notas/mês, 86% do varejo alimentar. [Scanntech Brasil](https://br.linkedin.com/company/scanntech-brasil).
- [SuperCook](https://play.google.com/store/apps/details?id=com.supercook.app&hl=en_US), [Samsung Food](https://apps.apple.com/us/app/samsung-food-meal-planner/id1133637674), [KitchenPal](https://kitchenpalapp.com/en/) — concorrentes diretos gratuitos/freemium.
- [TudoGostoso — Quem Somos](https://www.tudogostoso.com.br/quem-somos) — maior site de receitas da América Latina.
- [iFood — retrospectiva 2025 / TechTudo](https://www.techtudo.com.br/noticias/2025/12/ifood-libera-retrospectiva-de-2025-veja-o-que-voce-mais-pediu-no-app-edapps.ghtml) — 60M usuários, 160M pedidos/mês.

*Documento de análise. Nenhum código alterado. Decisões de corte propostas na seção 5 devem ser registradas antes do lançamento.*
