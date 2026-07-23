# Auditoria Estratégica e Técnica — CookMe

> Due diligence de código realizada em 2026-07-03 sobre a branch `feat/ocr-compras-receitas-gemini-fallback`.
> Regra aplicada: **o código é a verdade**; o briefing foi tratado como hipótese a verificar.
> Nenhum código foi alterado. Todas as evidências citam `arquivo:linha`. Cada achado foi verificado
> lendo o trecho citado nesta rodada (esta versão corrige e completa uma auditoria anterior —
> ver "Correções sobre a rodada anterior" no fim).

---

## 1. Sumário executivo

O CookMe é substancialmente **mais completo** do que o briefing sugere: motor de sugestão multifator (MOI) funcional, serviço de aprendizado de preferências, taxonomia culinária embrionária (`produtos.categoria_culinaria`, `sempre_a_gosto`, `alternativas_ids`), pipeline QR/SEFAZ via subprocess Python (NFC-e SP **e** SAT-SP), **preço por item persistido** (`compra_itens.preco_unitario/preco_total` — 82 de 143 itens no banco local têm preço), upload R2/S3, limites de plano por uso, busca web personalizada com "ignorar".

Porém há **um vazamento jurídico real, em três caminhos**, contradizendo a tese 5: o matching de geração (`buscarPorIngredientes`), o RAG (`buscarSimilares` — cujo próprio filtro "apenasPublicas" está escrito errado) e o `GET /receitas/:id` (sem checagem de dono) servem receitas importadas de terceiros a qualquer usuário. A listagem principal (`listarDisponiveisParaUsuario`) está correta — o vazamento é nos caminhos de geração/acesso direto.

A tese 4 (perfil de paladar) está **meio-construída e desconectada**: `AprendizadoService` deriva favoritos/aversões, mas `recipe-generator.service.ts` não injeta nada disso — nem sequer `modo_alimentar` — no prompt; `gerarComRAG` aceita o parâmetro de dieta e o generator o omite. A tese 2 (depleção) tem o fluxo manual guiado por receita funcionando ("fez a receita? algum ingrediente acabou?"), mas a baixa é binária (flag `esgotado`), sem subtração de quantidade — e existem **dois endpoints paralelos de "executar receita"** duplicando lógica.

Infra: CI existe (contradiz o briefing) mas cobre só tsc+testes do backend; sem deploy/rollback. Observabilidade de LLM existe **apenas** para classificação de produtos (`ai_classification_logs` com tokens e custo) — a cadeia de geração Haiku→Gemini→Groq só loga tokens do Haiku em texto, o que explica o crédito Anthropic zerar sem alerta.

**Prioridade imediata:** fechar o vazamento jurídico (3 pontos, ~0,5-1 dia), depois instrumentar retenção + observabilidade de LLM antes de ligar o paywall.

---

## 2. Funcionalidades não documentadas (descobertas no código)

| Funcionalidade | Arquivo | Estado | Propósito aparente |
| --- | --- | --- | --- |
| **MOIEngineService** — motor de sugestão multifator (cobertura 40pt + preferências 25pt + histórico 20pt + popularidade + penalidades) | `backend/src/modules/receitas/services/moi-engine.service.ts` (411 linhas) | **Completo e vivo** — serve `/receitas/sugestoes`, `sugestoes-inventario`, `similares` (`receitas.service.ts:255-271`) | Recomendação personalizada. Redundante com `recipe-suggestion.service.ts` (13.7K) — dois motores de sugestão coexistem |
| **AprendizadoService** — deriva preferências de avaliações | `receitas/services/aprendizado.service.ts` | Parcial — funciona, mas não alimenta geração (ver D-1) | Base da tese 4. Exposto em `GET /receitas/perfil-aprendizado` (`receitas-usuario.controller.ts:552`) |
| **protagonistas.ts** — mapa prato→ingredientes | `receitas/services/protagonistas.ts` (14.4K) | Completo | Taxonomia culinária BR hardcoded, muito mais rica que o briefing descreve |
| **Inteligência culinária em `produtos`** | `produtos/entities/produto.entity.ts` (`categoria_culinaria`, `sempre_a_gosto`, `opcional_por_natureza`, `bloqueia_receita_se_ausente`, `regional`, `alternativas_ids`) | Colunas existem | Semente da tese 3 |
| **Preço por item persistido** | `compras/entities/compra-item.entity.ts:43-47` | Completo (82/143 itens locais com preço) | Ativo "quanto custa sua cozinha" já capturado |
| **Validade por item** + canônico | `compra-item.entity.ts:57-74` (`ingrediente_canonical`, `validade_escaneada/manual/final`, `lote`) | Completo | Insumo direto para tese 3 e alertas de vencimento |
| **ai_classification_logs** — log de chamadas IA com `tokens`, `custo` (decimal 10,6), latência | `product-classification/entities/ai-classification-log.entity.ts:41-47` | Completo (só p/ classificação) | **Molde pronto para a observabilidade de LLM que falta na geração** (F-2) |
| **abbreviation_expansions** — expansão de abreviações de cupom | `product-classification/entities/abbreviation-expansion.entity.ts` | Existe | Normalização de descrição SEFAZ/OCR |
| **UploadService R2 (S3)** — avatar, foto de receita de usuário | `upload/upload.service.ts:28-49`; chamadas em `usuarios.controller.ts:87`, `moderacao-usuario.controller.ts:46` | Completo | **Não** usado para nota fiscal (LGPD ok) |
| **Limites de plano por uso** | `SubscriptionService.registrarUso` (`compras.controller.ts:90,120`) + `SubscriptionLimitFilter` global (`main.ts`) | Completo | Enforcement de paywall já no backend |
| **Busca web personalizada com "ignorar"** | `receitas-usuario.controller.ts:560+` (`POST /receitas/web/buscar`), `TipoPreferencia.RECEITA_URL_IGNORADA` (`preferencia-aprendida.entity.ts:18`) | Completo (commits recentes) | Descoberta de receitas web filtrando importadas/ignoradas |
| **Dois endpoints de execução de receita** | `receitas-usuario.controller.ts:526` (`POST :id/executar`) **e** `recipe-execution.controller.ts:37,86` (`:id/executar` + `finalizar`) | Ambos vivos | Duplicação: ambos gravam `receitas_executadas` e incrementam contador — risco de dupla contagem (B-3) |
| **affiliate** — assinaturas, transações, cliques, recomendações | `affiliate/entities/*` (4 entidades com CASCADE p/ usuário) | Existe | Monetização, não citado no briefing |
| **comparacoes / barcode / health / ia** módulos | `modules/comparacoes`, `modules/barcode`, `modules/health`, `modules/ia` | Existem | Comparação de preços; lookup EAN; healthcheck; serviços IA |
| **Scrapers múltiplos** | `receiteria-scraper`, `recipe-crawler`, `tudogostoso-scraper`, `social-recipe-extractor`, `recipe-search` (todos em `receitas/services/`) | Existem | Só invocados em fluxos explícitos de importação/seed (não achei uso autônomo no fluxo de geração) |
| **Jobs** | `inventario/inventario-expiracao.job.ts`, `receitas/jobs/recipe-cleanup.job.ts` | Existem | Alertas de validade; limpeza de receitas |
| **Redis** | container `cookme_redis` rodando | Existe | Uso no código não mapeado nesta rodada |
| **Rastreabilidade compra→inventário** | `inventario.entity.ts:45-46` (`compra_item_id`) | Existe | Base pronta para depleção estimada (tese 2) |

---

## 3. Tabela de verificações (item G)

| Afirmação do briefing | Veredito | Evidência |
| --- | --- | --- |
| `DELETE /usuarios/me` cascateia 12 tabelas + anonimiza audit_logs | **CONFIRMADO** | Anonimização: `usuarios.service.ts:88-90` (`UPDATE audit_logs SET user_id=NULL, user_email='[removido]'...`) antes de `remove()` L93. Exatamente **12 entidades** com `onDelete: 'CASCADE'` referenciando usuário: affiliate-click, recipe-recommendation, subscription, transaction, compra, inventario, lista, product-validation, receita-executada, receita-favorita, preferencia-aprendida, preferencia |
| Purge de logs 90 dias via `@Cron` 3am | **CONFIRMADO** | `audit-log.service.ts:121` `@Cron(CronExpression.EVERY_DAY_AT_3AM)`, corte 90 dias e delete L124-127 |
| Score de validação ≥ 70 → ok | **CONFIRMADO** | `recipe-validation.service.ts:169-171`: `>=70` ok, `>=50` em_revisao, `<50` descartar. Nota: erro/indisponibilidade do Haiku → `em_revisao` (L155,158), **não** auto-aprova |
| Fallback Haiku→Gemini→Groq automático | **CONFIRMADO** | `recipe-generator.service.ts:197` (claude-haiku-4-5), `:209` warn Haiku→Gemini, `:214-218` Gemini Flash, `:222` warn→Groq, `:227-230` Groq Llama 3.3 70B |
| Webhooks Stripe prontos | **CONFIRMADO** | `stripe-webhook.controller.ts:32` `@Post('webhook')`; trata `customer.subscription.updated` L77, `.deleted` L83, `invoice.payment_failed` L89-93; assinatura validada via `constructEvent` (`stripe.service.ts:82`) |
| Receitas importadas exibem badge + invisíveis a terceiros | **DIVERGENTE** | Badge existe e é completo (`receitas-usuario.controller.ts:466-484`: tipo cookme/web/usuario + domínio + autor). Invisibilidade **não se sustenta em 3 caminhos**: matching (`receita-banco.service.ts:166`), RAG (`recipe-rag.service.ts:104,129-131`) e `GET /receitas/:id` sem checagem de dono (`receitas-usuario.controller.ts:458-461`). Ver C-1 |
| "Sem CI/CD" (briefing/memória) | **DIVERGENTE** | `.github/workflows/ci.yml` existe: Node 20, `tsc --noEmit` + `npm test` do backend em push/PR para main. Sem build mobile, sem deploy, sem rollback |
| "Foto processada em memória, nunca persistida" | **CONFIRMADO** (com nuance) | Foto chega como `image_base64` no body (`compras.controller.ts:83-92`), vai direto ao Gemini (`compras.service.ts:277-283`), sem `writeFile`/`diskStorage`/S3 no caminho. `UploadService` (R2) só recebe avatar e foto de receita. **Nuance LGPD:** a imagem é enviada ao Google (Gemini) como operador — deve constar na política de privacidade |
| QR NFC-e/SAT consultando SEFAZ | **CONFIRMADO (só SP)** | NFC-e SP: `lib/captcha_manual.py:487`; SAT-SP: `:527` (`satsp.fazenda.sp.gov.br`). Selenium/Chrome headless via subprocess (`scraper.service.ts:258`) |

---

## 4. Achados por auditoria

### A. Pipeline de ingestão QR/SEFAZ + OCR

**A-1 · ALTO · Consulta SEFAZ restrita a SP, subprocess frágil, sessões só em RAM**
`scraper.service.ts:258` faz `spawn()` de `lib/captcha_manual.py` (60.9K, Selenium+Chrome headless) por sessão. Cobertura: NFC-e SP (`lib/captcha_manual.py:487`) e SAT-SP (`:527`) — nenhuma outra UF. Sessões vivem num `Map` em memória (`scraper.service.ts:23`), com `MAX_CONCURRENT_SESSIONS = 5` global (`:24`) e timeout 10min (`:25`). Falha de SEFAZ/captcha/nota não sincronizada vira status de erro em RAM — sem retry, sem fila; restart do pm2 perde tudo.
*Recomendação:* persistir sessões (tabela ou Redis — o container `cookme_redis` já roda); mensagem clara ao usuário fora de SP; OCR como caminho universal.

**A-2 · MÉDIO · Preço persiste; EAN morre no caminho**
Preço confirmado em `compra-item.entity.ts:43-47`. O `POST /compras/ocr-cupom/salvar-itens` **aceita** `codigo_barras` no body (`compras.controller.ts:110`), usa-o só para casar produto existente (`compras.service.ts:473-487`) e não grava — `compra_itens` não tem coluna de EAN. Teses 2 e 3 dependem de EAN por item.
*Recomendação:* migration `ALTER TABLE compra_itens ADD COLUMN codigo_barras VARCHAR(14)` + gravar na ingestão (ambos os caminhos).

**A-3 · MÉDIO · Dois caminhos de ingestão com normalização/classificação separadas**
Caminho QR (Python → API) e caminho OCR (`compras.service.ts:277` Gemini Vision) convergem tarde. Cada um normaliza por conta própria; `abbreviation_expansions` e `ingrediente_canonical` existem mas não há um serviço único de ingestão.
*Recomendação:* `ItemIngestionService` único recebendo `{descricao, ean, qtd, unidade, preco, validade}` de ambas as fontes.

**A-4 · BAIXO · JWT de 2h passado ao subprocess via argv**
`scraper.service.ts:253-267`: token assinado com `expiresIn: '2h'` e passado como `--token` em argumento de linha de comando — visível em `ps`/`/proc`. VPS single-tenant → risco baixo, mas trocar para stdin/env é trivial.

**A-5 · INFO · SSRF mitigado por design**
O Python não faz fetch da URL crua do QR: extrai a chave via regex `[?&]p=([0-9]{44})` (`lib/captcha_manual.py:490`), valida 44 dígitos numéricos (`:519`) e monta URL fixa dos domínios SP. Sem SSRF para host arbitrário.

---

### B. Inventário e depleção

**B-1 · MÉDIO · Depleção manual funciona, mas é binária**
Fluxo guiado existe: `POST /receitas/:id/executar` responde `"Receita registrada! Algum ingrediente acabou?"` com `ingredientes_receita` (`receitas-usuario.controller.ts:526-550`); usuário marca via `marcarEsgotado` (`inventario.service.ts:404`), que seta `esgotado=true`/`esgotado_em` e dispara push sugerindo lista de compras (`:419-425`). **Não subtrai `quantidade_disponivel`** — 200g usados de um pacote de 1kg viram "acabou tudo" ou nada. `finalizarExecucao` também não toca inventário — só incrementa `vezes_executada` (`recipe-execution.service.ts:135-141`).
Consequência: sem quantidade evoluindo no tempo, não há sinal para taxa de consumo nem reconciliação por recompra. Depleção *manual* resolvida; falta a base da *estimada*.

**B-2 · POSITIVO · Schema já tem ~80% do necessário**
`inventario.entity.ts`: `quantidade_disponivel` decimal(10,3) (L31), `unidade` enum (L34), `compra_item_id` (L45), `metodo_atualizacao` (L49), timestamps. `compra_itens` tem `validade_final` e `ingrediente_canonical`. Falta: quantidade inicial, evento de decremento, EAN (A-2).
*Migration proposta (tese 2):*

```sql
ALTER TABLE compra_itens ADD COLUMN codigo_barras VARCHAR(14);      -- A-2
ALTER TABLE inventario  ADD COLUMN quantidade_inicial DECIMAL(10,3);
ALTER TABLE produtos    ADD COLUMN consumo_medio_dias INT;          -- prior por categoria
CREATE TABLE inventario_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID REFERENCES inventario(id) ON DELETE CASCADE,
  tipo VARCHAR(20),            -- 'compra' | 'receita_feita' | 'baixa_manual' | 'estimado'
  delta DECIMAL(10,3),
  origem_id UUID,              -- receita_id ou compra_item_id
  criado_em TIMESTAMP DEFAULT now()
);
```

Reconciliação: intervalo entre recompras do mesmo EAN → taxa; decremento ao finalizar receita; baixa manual como correção.

**B-3 · MÉDIO · Dois endpoints paralelos de "executar receita"**
`receitas-usuario.controller.ts:526` (`executar` — grava execução + incrementa) e `recipe-execution.controller.ts:37/86` (`iniciarExecucao`/`finalizarExecucao` — grava execução, e finalizar incrementa de novo). Se o mobile usar ambos, `vezes_executada` e `receitas_executadas` dobram — corrompe tanto o ranking do matching (ordena por `vezes_executada`) quanto o futuro event log da tese 4.
*Recomendação:* escolher um (o de `recipe-execution` tem ciclo iniciar/finalizar, melhor para depleção) e aposentar o outro.

---

### C. Matching e RAG

**C-1 · CRÍTICO · Receitas importadas vazam por 3 caminhos (viola tese 5)**

1. **Matching de geração** — `receita-banco.service.ts:166`: `buscarPorIngredientes` filtra `(r.url_fonte IS NULL OR r.autor_id IS NOT NULL)`. A segunda metade **inclui** importadas de qualquer usuário. Usada por `recipe-generator.service.ts:69`.
2. **RAG** — `recipe-rag.service.ts:104`: `buscarSimilares(..., apenasPublicas = false)` por default; `gerarComRAG` chama sem o parâmetro (`:157`) → sem filtro nenhum. **Pior:** mesmo quando `apenasPublicas=true`, o filtro aplicado é o mesmo errado — `AND (url_fonte IS NULL OR autor_id IS NOT NULL)` (`:129-131`). Ou seja, o flag não protege nada contra importadas.
3. **Acesso direto** — `GET /receitas/:id` (`receitas-usuario.controller.ts:458-461`) busca qualquer receita por ID sem checar `autor_id` vs usuário logado. IDs vazados pelos caminhos 1-2 ficam legíveis na íntegra por terceiros.

Contraste: a listagem `listarDisponiveisParaUsuario` está **correta** — público estrito `autor_id IS NULL AND url_fonte IS NULL` (`receita-banco.service.ts:231-232`) + importadas só do próprio usuário (`:244-246`). O padrão certo já existe no arquivo; os outros caminhos divergiram dele.
*Recomendação (baixo esforço, prioridade máxima):*

- `receita-banco.service.ts:166` → `AND r.url_fonte IS NULL AND r.autor_id IS NULL`;
- `recipe-rag.service.ts:129-131` → filtro incondicional `AND url_fonte IS NULL AND autor_id IS NULL` (e remover o parâmetro enganoso, ou corrigi-lo);
- `buscarPorId`/`GET :id` → permitir se `autor_id IS NULL` ou `autor_id = user.id`, senão 404;
- teste de integração: inserir receita importada e afirmar ausência nos 3 caminhos.

**C-2 · MÉDIO · Pesos de matching prontos para virar prior por usuário (tese 4)**
`PROTAGONISTAS` (`receita-banco.service.ts:14`), `AUXILIARES` (`:42`), `CONTEXTO_SENSIVEL` (`:63`) + `protagonistas.ts`. `pesoIngrediente()` é função pura `(chave, receitaNome) → peso` (`:118`), chamada em dois pontos (`:182`, `:295`). Dá para sobrepor multiplicador por usuário (`peso * (1 + prefScore(usuarioId, chave))`) sem reescrever nada — os sets viram prior global, como a tese 4 pede.

**C-3 · MÉDIO · Coluna `embedding` fora da entity e fora de sync entre ambientes**
`embedding` não existe na entity `Receita` — é coluna raw criada manualmente. **No banco local ela nem existe** (query falha com `column "embedding" does not exist`; pgvector está instalado). Indexação só via `POST /admin/receitas/rag/indexar`; receita nova nasce sem embedding; nenhum job/trigger varre `embedding IS NULL` (zero referências a embedding em `receita-banco.service.ts` e nos jobs).
*Recomendação:* migration formal da coluna (+ índice HNSW) versionada; gerar embedding assíncrono ao salvar receita nova; job diário varrendo `embedding IS NULL`.

---

### D. Dados de comportamento

**D-1 · ALTO · Perfil de paladar existe mas está desconectado da geração — e a dieta também**
`AprendizadoService` popula `preferencias_aprendidas` (tipos: ingrediente/categoria favorito/aversão + `RECEITA_URL_IGNORADA`, `preferencia-aprendida.entity.ts:13-18`). Mas `recipe-generator.service.ts` tem **zero** referências a preferência/perfil/modo_alimentar (grep = 0 matches). Agravante: `gerarComRAG` **aceita** `modoAlimentar` e filtra dieta, mas o generator chama `gerarComRAG(ingredientes)` sem o parâmetro (`recipe-generator.service.ts:83`) — o filtro de dieta existe e está desligado no caminho principal.
*Recomendação:* (1) fix de 1 linha: passar `modoAlimentar` na L83; (2) perfil compacto (top-N favoritos/aversões) no system prompt; (3) re-ranking por embedding médio das receitas nota ≥ 4 com decay.

**D-2 · MÉDIO · Eventos existem mas dispersos**
Sinais: `receitas_executadas` (feita+avaliação), `preferencias_aprendidas` (derivado — só 3 linhas no banco local), `inventario.esgotado/esgotado_em` (baixa manual), `RECEITA_URL_IGNORADA` (aversão web), favoritas. Nenhuma tabela consolida "quem fez o quê quando".
*Recomendação:* generalizar `inventario_eventos` (B-2) para `user_eventos` — base única para tese 4 e métricas.

**D-3 · ALTO · Zero instrumentação de retenção D7/D30**
Nenhum SDK/tabela de analytics (grep amplitude/mixpanel/posthog/segment = 0 no src). `audit_logs` registra requests mas com purge de 90 dias e sem semântica de evento de produto.
*Recomendação mínima (antes do paywall):* tabela `eventos_uso(usuario_id, evento, criado_em)` + 4 eventos (`app_open`, `cupom_lido`, `receita_gerada`, `receita_feita`); D7/D30 = cohort simples por data de cadastro.

---

### E. Conhecimento de produto

**E-1 · MÉDIO · `product_knowledge_base` é cache por NOME, não por EAN**
Schema (`product-knowledge-base.entity.ts`): chave única é `varchar(255)` de nome do produto (L25), com categoria, confiança, contadores de uso/validação e `classification_metadata` jsonb. 309 linhas no banco local. Não há coluna EAN — dois produtos com nomes de cupom diferentes e mesmo EAN são entradas distintas. `abbreviation_expansions` ajuda na normalização de nomes, mas a âncora estável (EAN) não participa.
*Recomendação (tese 3):* adicionar `codigo_barras` à KB (nullable, index único parcial), e evoluir `produtos` com propriedades culinárias estruturadas:

```sql
ALTER TABLE product_knowledge_base ADD COLUMN codigo_barras VARCHAR(14);
ALTER TABLE produtos ADD COLUMN funcao_culinaria VARCHAR(20)[];  -- {gordura,acido,liga,umami,amido}
ALTER TABLE produtos ADD COLUMN densidade_g_ml DECIMAL(6,2);
CREATE TABLE ingrediente_substituto (
  ingrediente_id UUID, substituto_id UUID,
  razao_conversao DECIMAL(5,2), nota TEXT,
  PRIMARY KEY (ingrediente_id, substituto_id)
);
```

Base já existente a favor: `alternativas_ids` em produtos, `ingrediente_canonical` em compra_itens, `abbreviation_expansions`.

---

### F. Infra e operação

**F-1 · ALTO · CI mínimo, sem deploy/rollback**
`.github/workflows/ci.yml`: Node 20, `tsc --noEmit` + testes unitários do backend em push/PR para main. Sem lint, sem build do mobile/frontend, sem deploy. Deploy segue rsync+pm2 manual.
*Pipeline mínimo:* job `deploy` gated em main verde → rsync para VPS com diretório `releases/` + symlink `current` + `pm2 reload` + healthcheck `GET /health` (módulo `health` já existe); falha → symlink de volta.

**F-2 · ALTO · Observabilidade de LLM: existe para classificação, não para geração**
`ai_classification_logs` já grava tokens, custo (decimal 10,6) e latência por chamada de classificação (`ai-classification-log.entity.ts:41-47`). A cadeia de geração só loga tokens do Haiku em texto (`recipe-generator.service.ts:205`) — sem registro de qual provider serviu, custo, latência ou taxa de fallback. Foi assim que o crédito Anthropic zerou em produção sem ninguém perceber.
*Recomendação:* reutilizar o molde da `ai_classification_logs` numa `llm_chamadas(provider, modelo, tokens_in/out, latencia_ms, sucesso, custo_estimado)` gravada nos 3 ramos do fallback; alerta quando Groq (último recurso) dominar.

**F-3 · MÉDIO · Sessões de scraper em RAM + gargalo global de 5** — ver A-1.

**F-4 · BAIXO · `mobile/.env.production` versionado**
`git ls-files` confirma. Conteúdo: só `EXPO_PUBLIC_API_URL` e Google OAuth **client ID** web (públicos por design; Android/iOS vazios). Risco real baixo; remover por higiene.

**F-5 · POSITIVO · Postura de segurança do backend sólida**
`main.ts`: helmet (L31), CORS restrito a domínios cookme.com.br em produção (L37-46), `ValidationPipe` global com `whitelist+forbidNonWhitelisted` (L49-58), `JwtAuthGuard` global (L61-62), audit interceptor global (L67-69). Controllers admin com `RolesGuard`+`@Roles(ADMIN)`. Não encontrei endpoint admin desprotegido nem secrets de servidor no repo.

---

## 5. Plano de execução das 5 teses

Objetivo imediato: **Play Store → paywall → medir D7/D30**. Ordenado para desbloquear isso.

**Fase 0 — Pré-Play Store (bloqueadores) · ~2-3 dias**

1. **C-1 (tese 5)** — corrigir os 3 caminhos + teste de regressão. ~0,5-1 dia. **Bloqueador legal, fazer primeiro.**
2. **D-1 fix rápido** — passar `modoAlimentar` em `recipe-generator.service.ts:83`. ~1 linha, fazer junto.
3. **B-3** — unificar endpoints de execução (contagem dupla corrompe dados que a tese 4 vai consumir). ~0,5 dia.
4. **A-1 UX** — mensagem clara fora de SP; OCR como caminho padrão nacional. ~0,5-1 dia.

**Fase 1 — Medir antes de cobrar · ~2 dias**
5. **D-3** `eventos_uso` + **F-2** `llm_chamadas` (molde já existe em `ai_classification_logs`). Ligar **antes** do paywall.

**Fase 2 — Paywall + deploy seguro · ~3-4 dias**
6. Paywall mobile (backend pronto: Stripe webhooks + `registrarUso` + `SubscriptionLimitFilter`). ~2 dias.
7. **F-1** deploy com releases/rollback + healthcheck. ~1-2 dias.

**Fase 3 — Diferencial (pós-lançamento) · ~2-3 semanas**
8. **Tese 4 completa** — perfil compacto no prompt + re-ranking vetorial + multiplicador sobre `pesoIngrediente` (C-2). ~4-5 dias.
9. **Tese 2** — migration B-2 + decremento em `finalizarExecucao` + taxa por EAN (requer A-2). ~5-7 dias.
10. **Tese 3** — EAN na KB (E-1) + propriedades culinárias + substitutos. ~1 semana incremental.

### Resumo por tese

| Tese | Estado real | Esforço restante | Arquivos-chave | Risco |
| --- | --- | --- | --- | --- |
| 1 — QR/SEFAZ + preço | Funciona (SP: NFC-e+SAT), preço persiste, EAN não, sessões em RAM | ~2-3d (EAN + robustez + UX não-SP) | `scraper.service.ts`, `compra-item.entity.ts`, `lib/captcha_manual.py` | Cobertura só SP; subprocess Selenium frágil |
| 2 — Depleção | Manual guiada funciona (binária); endpoints duplicados; sem base numérica | ~5-7d | `inventario.service.ts:404`, `recipe-execution.service.ts`, migration B-2 | Precisão da estimativa; UX de correção |
| 3 — Taxonomia | KB por nome (309 itens), colunas culinárias existem, EAN ausente | ~1-2sem incremental | `product-knowledge-base.entity.ts`, `produto.entity.ts` | Curadoria de dados |
| 4 — Perfil paladar | Deriva prefs mas nada chega à geração; nem dieta chega (param omitido) | 1 linha (dieta) + ~4-5d (perfil) | `recipe-generator.service.ts:83`, `aprendizado.service.ts`, `receita-banco.service.ts:118` | Baixo — infra existe |
| 5 — Separação jurídica | **Vazando em 3 caminhos**; listagem correta prova que o padrão certo já existe | ~0,5-1d | `receita-banco.service.ts:166`, `recipe-rag.service.ts:104,129-131,157`, `receitas-usuario.controller.ts:458` | Legal — prioridade máxima |

---

## 6. O que NÃO fazer agora

- **Não reescrever matching/protagonistas.** `pesoIngrediente()` é função pura — tese 4 se sobrepõe multiplicativamente.
- **Não consolidar MOI vs recipe-suggestion agora.** São dois motores redundantes, mas ambos funcionam; unificação é refactor que não move retenção. Apenas não construir coisa nova em cima dos dois.
- **Não construir o cookme-ai-service (Lambda/LangChain).** Fallback triplo atual funciona; extração de microsserviço não muda retenção nem conversão.
- **Não expandir fontes de scraping** antes de C-1 fechado — amplia a superfície do vazamento.
- **Não perseguir multi-UF na SEFAZ** antes da Play Store — degradar com elegância fora de SP e empurrar OCR.
- **Não polir admin panel** — auth sólida (F-5), invisível ao usuário final.

---

## Correções sobre a rodada anterior desta auditoria

Esta versão re-verificou todos os achados da rodada anterior. Diferenças relevantes:

1. **MOIEngineService NÃO está quebrado** — a rodada anterior o marcou como "truncado/morto"; leitura completa mostra serviço íntegro de 411 linhas, vivo em 3 endpoints. Achado removido; redundância com `recipe-suggestion` mantida como observação.
2. **"12 tabelas" agora CONFIRMADO** (antes não verificado): exatamente 12 entidades com CASCADE.
3. **C-1 é pior do que reportado**: o filtro `apenasPublicas` do RAG é ele próprio incorreto, e `GET /receitas/:id` não checa dono (3º caminho, antes não listado).
4. **SSRF**: a validação de 44 dígitos numéricos **já existe** (`lib/captcha_manual.py:519`) — antes sugerida como melhoria.
5. **SAT-SP também é suportado** (`:527`), não só NFC-e SP.
6. **`gerarComRAG` chamado sem `modoAlimentar`** (`recipe-generator.service.ts:83`) — novo, fix de 1 linha.
7. **Observabilidade LLM parcial já existe** (`ai_classification_logs` com tokens+custo) — molde reutilizável, antes não citado.
8. Caminhos corrigidos: controller de usuário fica em `receitas/controllers/`; lib Python fica na **raiz do repo** (`lib/`), não em `backend/lib/`.

*Auditoria de leitura apenas. Nenhum arquivo de código foi modificado. Correções propostas (especialmente C-1) devem entrar como PR com testes antes de qualquer publicação.*
