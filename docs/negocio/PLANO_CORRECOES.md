# Plano de Correções — CookMe

> **STATUS DE EXECUÇÃO (2026-07-04):** Fases 1-7 implementadas na branch
> `fix/plano-correcoes` (base: `feat/ocr-compras-receitas-gemini-fallback`), um commit
> por fase, 112/112 testes verdes. Executado em branch única (não uma por fase) porque a
> base ainda não estava mergeada na main — empilhar 7 PRs sobre branch não mergeada
> complicaria os merges. Pendências: **6.3** (rota QR nacional — aguarda decisão
> InfoSimples vs parsers próprios + fixtures reais de QR v2) e **7.4** (ligar
> `ocr-validade` no mobile). Migrations criadas precisam rodar no deploy
> (`npm run migration:run`).

> Briefing de execução para agente de IA (Claude Code). Origem: `AUDITORIA.md` (due diligence
> técnica 2026-07-03) + análise do pipeline de canonização de ingredientes.
> Cada item traz evidência `arquivo:linha`, o que fazer e critério de aceite.
> Linhas citadas podem ter drifted — localize pelo símbolo/trecho, não pelo número cego.

## Regras gerais (aplicar em TODOS os itens)

1. **TDD obrigatório**: escrever o teste que falha ANTES da correção. Todo item lista seu teste.
2. **Git**: nunca commitar direto na `main`. Uma branch por fase (`fix/fase-1-vazamento-juridico`, etc.), PR com CI verde antes de merge.
3. **Migrations**: alterações de schema via migration TypeORM versionada em `backend/src/database/migrations/` — nunca `synchronize` nem SQL manual solto. Colunas boolean nullable sempre com `type: 'boolean'` explícito (crash conhecido do TypeORM).
4. **Validar cada fase**: `cd backend && npx tsc --noEmit && npm test` verde antes de abrir PR.
5. **Não fazer nesta rodada**: microsserviço Python (cookme-ai-service), features novas de receita, refactor do matching/protagonistas, multi-UF na SEFAZ, mexer no admin panel além do necessário.
6. **Escopo mobile**: só onde indicado explicitamente. API mobile usa IP fixo `192.168.86.9:3000`.

---

## FASE 1 — Vazamento jurídico (CRÍTICO, fazer primeiro)

Contexto: banco público deve conter APENAS receitas geradas por IA (`url_fonte IS NULL AND autor_id IS NULL`).
Receitas importadas (com `autor_id`) são biblioteca pessoal — visíveis SÓ ao importador, nunca entram em
matching, RAG ou contexto de geração. Hoje vazam por 3 caminhos. Risco: Lei 9.610/98 + vazamento de
biblioteca pessoal entre usuários. O padrão CORRETO já existe em `listarDisponiveisParaUsuario`
(`receita-banco.service.ts:231-232` público estrito + `:244-246` importadas só do dono) — replicá-lo.

### 1.1 Matching de geração inclui importadas

- **Onde**: `backend/src/modules/receitas/services/receita-banco.service.ts:166` — `buscarPorIngredientes` usa `.andWhere('(r.url_fonte IS NULL OR r.autor_id IS NOT NULL)')`.
- **Fazer**: trocar por `.andWhere('r.url_fonte IS NULL').andWhere('r.autor_id IS NULL')`.

### 1.2 RAG busca em tudo e o flag de proteção é inócuo

- **Onde**: `backend/src/modules/receitas/services/recipe-rag.service.ts`
  - `:104` — assinatura `buscarSimilares(..., apenasPublicas = false)`;
  - `:129-131` — quando `apenasPublicas=true`, o filtro aplicado é `AND (url_fonte IS NULL OR autor_id IS NOT NULL)` — mesmo erro do 1.1, não bloqueia importadas;
  - `:157` — `gerarComRAG` chama `buscarSimilares` sem o parâmetro → sem filtro nenhum.
- **Fazer**: tornar o filtro **incondicional** no SQL de `buscarSimilares`: `AND url_fonte IS NULL AND autor_id IS NULL`. Remover o parâmetro `apenasPublicas` (e limpar a chave de cache que o inclui) — nenhum caminho legítimo precisa de receitas importadas no RAG.

### 1.3 `GET /receitas/:id` sem checagem de dono

- **Onde**: `backend/src/modules/receitas/controllers/receitas-usuario.controller.ts:458-461` — `buscarPorId` retorna qualquer receita por ID a qualquer usuário autenticado.
- **Fazer**: após carregar a receita, se `receita.autor_id !== null && receita.autor_id !== user.id` → `NotFoundException` (404, não 403 — não confirmar existência).

### 1.4 Teste de regressão (escrever ANTES dos fixes 1.1-1.3)

Teste de integração (ou unit com repo mockado consistente):

- Semear: receita pública (`autor_id=null, url_fonte=null`), receita importada do usuário A (`autor_id=A, url_fonte='https://...'`).
- Afirmar: (a) `buscarPorIngredientes` nunca retorna a importada; (b) `buscarSimilares` nunca retorna a importada; (c) `GET /receitas/:id` da importada como usuário B → 404; como usuário A → 200 com badge `fonte.tipo='web'`.
- **Critério de aceite da fase**: os 3 asserts passam; `listarDisponiveisParaUsuario` continua incluindo importadas do próprio dono (não regredir a listagem).

---

## FASE 2 — Fixes rápidos de corretude

### 2.1 Filtro de dieta desligado na geração (fix de 1 linha)

- **Onde**: `backend/src/modules/receitas/services/recipe-generator.service.ts:83` — chama `this.ragService.gerarComRAG(ingredientes)` omitindo `modoAlimentar`, que a função aceita e usa para filtrar `tags_dieta`.
- **Fazer**: propagar `modoAlimentar` (e `tipoRefeicao` se disponível no fluxo) do chamador até esta chamada. Verificar assinatura da cadeia acima (`gerarReceitas`/controller) e adicionar o parâmetro onde faltar.
- **Teste**: mock do `ragService`; chamar geração com `modo_alimentar='vegano'`; afirmar que `gerarComRAG` recebeu `'vegano'`.

### 2.2 Endpoints duplicados de "executar receita" (dupla contagem)

- **Onde**: dois caminhos vivos gravando `receitas_executadas` e incrementando `vezes_executada`:
  - `backend/src/modules/receitas/controllers/receitas-usuario.controller.ts:526` — `POST :id/executar` (registra + incrementa + responde "Algum ingrediente acabou?");
  - `backend/src/modules/receitas/controllers/recipe-execution.controller.ts:37,86` — `POST :id/executar` (iniciar) + `:id/executar/:execucao_id/finalizar` (incrementa de novo).
  Nota: ambos os controllers usam prefixo `receitas` — provável colisão de rota em `:id/executar`; verificar qual responde de fato e o que o mobile chama (grep em `mobile/` por `executar`).
- **Fazer**: manter UM caminho — preferir o de `recipe-execution` (ciclo iniciar/finalizar serve a futura depleção), **incorporando** a resposta `"Algum ingrediente acabou?"` + `ingredientes_receita` no `finalizar`. Remover o endpoint duplicado do outro controller e atualizar o mobile se ele o consumir.
- **Teste**: executar fluxo completo iniciar→finalizar → `vezes_executada` incrementa exatamente 1; `receitas_executadas` tem exatamente 1 linha.

### 2.3 JWT via argv do subprocess Python

- **Onde**: `backend/src/modules/scraper/scraper.service.ts:253-267` — token JWT de 2h passado como `--token` em argumento de linha de comando (visível em `ps`/`/proc`).
- **Fazer**: passar via variável de ambiente do processo filho (`spawn(..., { env: { ...process.env, COOKME_SESSION_TOKEN: userToken } })`) e ajustar `lib/captcha_manual.py` para ler `os.environ['COOKME_SESSION_TOKEN']` com fallback para `--token` (compatibilidade durante transição).
- **Teste**: unit do service afirmando que `spawn` não recebe `--token` nos args.

### 2.4 Remover `mobile/.env.production` do versionamento

- **Fazer**: `git rm --cached mobile/.env.production`, adicionar ao `.gitignore`, criar `mobile/.env.production.example` com as chaves sem valores. Conteúdo atual é público (EXPO_PUBLIC_*), sem necessidade de rotação.

---

## FASE 3 — EAN ponta a ponta (destrava depleção estimada e taxonomia)

Contexto: EAN chega no body do OCR (`compras.controller.ts:110`), é usado transitoriamente para casar
produto (`compras.service.ts:473-487`) e descartado. EAN é a chave canônica definitiva: uma vez
aprendido `EAN → ingrediente`, recompra resolve com zero ambiguidade.

### 3.1 Migration

```sql
ALTER TABLE compra_itens ADD COLUMN codigo_barras VARCHAR(14);
ALTER TABLE product_knowledge_base ADD COLUMN codigo_barras VARCHAR(14);
CREATE INDEX idx_pkb_codigo_barras ON product_knowledge_base (codigo_barras) WHERE codigo_barras IS NOT NULL;
```

Atualizar entities correspondentes (`compra-item.entity.ts`, `product-knowledge-base.entity.ts`).

### 3.2 Persistir na ingestão (ambos os caminhos)

- Caminho OCR: em `salvarItensCupomNoInventario` (`compras.service.ts`), gravar `item.codigo_barras` no `CompraItem`.
- Caminho QR/Python: verificar payload que `lib/captcha_manual.py` envia ao `POST /compras` (o item da SEFAZ tem código EAN); garantir que o DTO aceita e grava.

### 3.3 EAN como estágio 0 da canonização

- **Onde**: `backend/src/modules/product-classification/services/ocr-alias.service.ts:276` — `resolverNomeCanônico` começa por abreviações.
- **Fazer**: novo estágio ANTES de todos: se o chamador tiver EAN, lookup `product_knowledge_base.codigo_barras` → retorna canônico direto. Toda resolução bem-sucedida COM EAN presente grava o EAN na KB (aprende para sempre). Requer propagar EAN pela assinatura (`resolverNomeCanônico(nomeOcr, codigoBarras?)` e `resolverLote`).
- **Teste**: resolver `("CR LEITE ITALAC 200GR", "7891234567890")` → grava EAN na KB; segunda chamada com MESMO EAN e nome totalmente diferente (`"CREME LEITE TRAD 200G"`) → resolve pelo EAN sem passar pelos outros estágios.

---

## FASE 4 — Canonização: acurácia mensurável e fixes

### 4.1 Fix: marca na frente quebra o estágio de abreviações

- **Onde**: `backend/src/modules/product-classification/services/abbreviation.service.ts:326-358` — `expand()` só testa prefixos de 1-3 tokens do INÍCIO. `"ITALAC CR LEITE 200GR"` não casa (marca primeiro é ordem comum em cupom).
- **Fazer**: antes do matching em `resolverNomeCanônico`, pré-limpar o nome removendo `BRAND_WORDS` e `PACKAGING_PATTERNS` (ambos já existem em `ocr-alias.service.ts:11-66`) e SÓ ENTÃO chamar `expand()`. Alternativa complementar: janela deslizante de 1-3 tokens sobre a string toda em vez de só prefixo.
- **Teste**: `"ITALAC CR LEITE 200GR"` → `creme de leite`; `"CR LEITE ITALAC 200GR"` → `creme de leite` (não regredir).

### 4.2 Golden test set + métrica de acurácia

- **Fazer**: criar `backend/test/fixtures/cupom-golden.json` com ~100-200 pares reais `{nome_ocr, esperado}` (extrair exemplos de `compra_itens.nome_ocr` + `ingrediente_canonical` já validados no banco, completar manualmente). Teste Jest que roda `resolverLote` no set e falha se acurácia < limiar (começar com o valor medido atual, ratchet para cima).
- **Critério de aceite**: teste no CI reportando acurácia numérica; baseline documentado no próprio arquivo de teste.

### 4.3 Contadores por estágio

- **Fazer**: em `resolverNomeCanônico`, contar resoluções por estágio (`ean | abreviacao | kb_exato | fuzzy | regex | normalizer | fallback`). Persistência simples (incremento em tabela `canonizacao_stats` ou log estruturado agregável). Expor `GET /admin/canonizacao/stats`.
- **Por quê**: % caindo em `fallback` = fila de curadoria; medir efeito de cada melhoria.

### 4.4 Correção do usuário fecha o loop

- **Fazer**: localizar o fluxo de validação manual do mobile (`product-validation` / tela `validacao.tsx`). Garantir que correção do usuário: (a) atualiza `canonical_ingredient` na KB para aquele `normalized_name` (e EAN, se houver); (b) incrementa contador de confiança. Se já fizer parte, cobrir com teste; se não, implementar.
- **Teste**: usuário corrige `"X"` de `errado` para `certo` → próxima resolução de `"X"` retorna `certo` sem IA.

---

## FASE 5 — Instrumentação (ANTES do paywall)

### 5.1 Eventos de uso (retenção D7/D30)

- **Migration**:

```sql
CREATE TABLE eventos_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento VARCHAR(40) NOT NULL,
  metadata JSONB,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_eventos_uso_usuario_data ON eventos_uso (usuario_id, criado_em);
CREATE INDEX idx_eventos_uso_evento_data ON eventos_uso (evento, criado_em);
```

- **Eventos mínimos** (service `EventosUsoService` + chamadas nos pontos): `app_open` (novo endpoint leve `POST /eventos/app-open` chamado pelo mobile ao abrir), `cupom_lido` (fim do OCR e do QR), `receita_gerada` (`POST /receitas/gerar`), `receita_feita` (finalizar execução), `paywall_visto`, `assinatura_criada` (webhook Stripe).
- **Query D7/D30**: view ou endpoint admin `GET /admin/metricas/retencao` — cohort por semana de cadastro × % com `app_open` em D7/D30.
- **LGPD**: adicionar `eventos_uso` à cascata de exclusão (o CASCADE da FK cobre) e mencionar na documentação de dados coletados.

### 5.2 Observabilidade da cadeia de LLM

- **Molde já existe**: `ai_classification_logs` tem tokens, custo decimal(10,6) e latência (`ai-classification-log.entity.ts:41-47`). Replicar para geração.
- **Migration**: tabela `llm_chamadas (id, contexto VARCHAR(30) /* geracao|rag_adaptacao|validacao */, provider VARCHAR(20), modelo VARCHAR(60), tokens_in INT, tokens_out INT, latencia_ms INT, sucesso BOOLEAN, erro TEXT, custo_estimado DECIMAL(10,6), criado_em TIMESTAMP DEFAULT now())`.
- **Instrumentar**: os 3 ramos do fallback em `recipe-generator.service.ts` (Haiku `:193-209`, Gemini `:214-222`, Groq `:227+`), o RAG (`recipe-rag.service.ts` embedding + adaptação Haiku) e a validação (`recipe-validation.service.ts`). Registrar TAMBÉM as falhas (é o dado que faltou quando o crédito Anthropic zerou).
- **Alerta mínimo**: no `GET /admin/metricas/llm` (novo), incluir `taxa_fallback_groq_24h`; logar `logger.error` quando Groq > 50% das gerações nas últimas 24h.
- **Teste**: mock dos providers; forçar falha do Haiku → afirmar 2 linhas em `llm_chamadas` (haiku sucesso=false, gemini sucesso=true).

---

## FASE 6 — Caminho QR: robustez e rota nacional

### 6.1 Sessões persistentes

- **Onde**: `backend/src/modules/scraper/scraper.service.ts:23-25` — `activeSessions` é `Map` em RAM; restart do pm2 perde sessões em andamento; `MAX_CONCURRENT_SESSIONS=5` global.
- **Fazer**: persistir sessões em Redis (container `cookme_redis` já roda) ou tabela `scraper_sessoes`; na inicialização do módulo, marcar sessões órfãs (`status='em_andamento'` sem processo) como `erro` com mensagem amigável.

### 6.2 Mensagem clara fora de SP (paliativo até o 6.3 cobrir a UF)

- Cobertura atual: NFC-e SP (`lib/captcha_manual.py:487`) e SAT-SP (`:527`) apenas. QR de outra UF hoje vira erro genérico.
- **Fazer**: no parse inicial do QR (backend, antes de spawnar o Python), detectar UF pela chave de acesso (posições 1-2 da chave de 44 dígitos = código IBGE da UF; SP=35). Se a UF não for suportada → resposta imediata orientando usar a foto do cupom (OCR), sem gastar sessão.
- **Teste**: QR com chave iniciando em `52...` (GO) → erro amigável com `sugestao: 'ocr'`, sem spawn.

### 6.3 Reescrever o caminho QR: consulta autenticada pela URL do QR (rota nacional, mata o captcha)

**Contexto — o código atual faz do jeito difícil.** O QR v2 da NFC-e (padrão nacional ENCAT) contém a
URL de consulta da UF + a chave + um hash de autenticação (`cHashQRCode`, assinado com o CSC do
emissor). Esse hash prova que a consulta veio do cupom físico — por isso o endpoint de consulta VIA QR
das SEFAZes retorna a nota **sem captcha** na maioria das UFs. O portal nacional
(<http://nfc-e.encat.org/>) lista as URLs de consulta das 27 UFs. O `lib/captcha_manual.py` hoje descarta
a URL do QR, extrai só a chave e entra pela **consulta pública manual** — que é a rota COM captcha, daí
o Selenium/Chrome headless e a fragilidade toda do achado A-1.

- **Fazer (arquitetura nova do caminho QR):**
  1. Novo serviço no backend (Node, sem Python/Selenium): recebe o texto do QR; se for URL v2 com
     parâmetros completos → `fetch` direto da URL (HTTP simples) → parser do HTML de resposta da UF →
     itens `{descricao, ean, qtd, unidade, preco}`.
  2. Um parser por UF, começando por SP + as 2-3 UFs com mais usuários; registrar UF suportada em
     config. UF sem parser → cair no 6.2 (mensagem + OCR).
  3. Manter o caminho Python/Selenium apenas como fallback do SAT-SP (CF-e, que é outro fluxo) até
     decidir aposentá-lo.
  4. **Alternativa comprada (avaliar ANTES de escrever parsers):** API unificada de consulta NFC-e da
     InfoSimples (<https://infosimples.com/consultas/sefaz-nfce/>) — cobertura nacional imediata, custo
     por consulta. Decisão: se o custo por consulta for baixo o suficiente para caber no limite do plano
     grátis, usar na fase de validação e trocar por parsers próprios quando o volume justificar.
     Registrar o custo por leitura em `llm_chamadas`/tabela análoga para o unit economics ficar visível.
- **Validações de segurança**: chave = 44 dígitos numéricos; URL do QR só é fetchada se o host estiver
  na allowlist das URLs oficiais das SEFAZes (nunca fetch de host arbitrário — anti-SSRF).
- **Teste**: QR v2 de SP (fixture real) → itens extraídos sem Selenium; QR com host fora da allowlist →
  rejeitado; QR de UF sem parser → resposta do 6.2.
- **Efeito colateral positivo**: elimina sessões longas do 6.1 para NFC-e (consulta vira request de
  segundos, sem processo filho), reduz o problema de RAM a praticamente só o SAT-SP.

---

## FASE 7 — Validade dos alimentos: destravar o loop anti-desperdício

Contexto: a feature de validade está ~80% construída e invisível por falta de DADO. Existe:
`data_validade` indexada (`inventario.entity.ts:40-42`), `validade_escaneada/manual/final` em
`compra_itens` (`compra-item.entity.ts:64-74`), boost de receita com item vencendo ≤7 dias
(`recipe-suggestion.service.ts:249`, `+0.1` no score, campo `usa_vencendo`), tela mobile dedicada
(`mobile/app/(app)/vencendo/index.tsx`) + seção na Home. O que NÃO existe: origem automática da data
(cupom não traz validade; ninguém digita item a item → tudo null → feature vazia), push de vencimento,
e o boost é fraco e restrito ao `paraMim`. O comentário em `compra-item.entity.ts:72` já prevê
"manual > escaneada > estimada" — a estimada nunca foi implementada.

### 7.1 Validade estimada por categoria (o fix que destrava tudo)

- **Fazer**: migration `ALTER TABLE produtos ADD COLUMN validade_padrao_dias INT;` + seed de defaults
  por categoria (referência inicial: hortifrúti folhas 5, frutas 7, carne/frango/peixe resfriado 3,
  congelados 90, leite/iogurte fresco 7, queijos 15, ovos 30, pães 5, grãos/massas/enlatados 365,
  temperos secos 180). Aplicar na ingestão (ambos os caminhos, OCR e QR): se o item não tem validade
  escaneada nem manual, `validade_final = data_compra + validade_padrao_dias` da categoria do produto,
  e propagar para `inventario.data_validade` com `metodo_atualizacao` indicando estimativa.
- **UX**: valor estimado é editável — na tela de despensa, badge sutil "estimada" no item; ajuste manual
  sobrescreve e nunca é re-estimado por cima.
- **Teste**: salvar cupom com "PEITO FRANGO" sem validade → item entra no inventário com
  `data_validade = compra + 3 dias`; item com validade manual preexistente NÃO é sobrescrito.

### 7.2 Push de vencimento (re-engajamento)

- **Fazer**: novo cron diário (ex: 10h) no módulo de inventário/notificações: para cada usuário com
  itens `data_validade <= hoje+3` e `esgotado=false`, enviar UM push agregado
  (`"🥩 Frango e creme de leite vencem em breve — veja 3 receitas para usar hoje"`) com deep link para
  `/(app)/vencendo`. Máximo 1 push de validade por usuário/dia; não repetir para os mesmos itens em
  dias consecutivos (guardar último aviso por item — coluna `validade_avisada_em` no inventário ou
  registro em tabela de notificações).
- **Reaproveitar**: `PushService.enviarParaUsuario` já usado em `inventario.service.ts:419-425`.
- **Teste**: usuário com 2 itens vencendo → exatamente 1 push com deep link; rodar o job de novo no
  mesmo dia → zero push.

### 7.3 Peso do "vencendo" no ranking

- **Onde**: `recipe-suggestion.service.ts:304-308` — hoje `temVencendo` soma `+0.1` (menos que favorito
  `+0.3`), e só no `paraMim`.
- **Fazer**: subir para `+0.25` (usar o que está vencendo importa mais que preferência num horizonte de
  3 dias) e aplicar o mesmo sinal em `listarDisponiveisParaUsuario` (`receita-banco.service.ts`) como
  critério de desempate/boost de ordenação, marcando o resultado com `usa_vencendo` para a UI exibir o
  badge ("aproveite o frango antes de vencer").
- **Teste**: duas receitas com mesma cobertura, uma usa item vencendo → ela vem primeiro e carrega
  `usa_vencendo` preenchido.

### 7.4 Ligar `ocr-validade` no mobile (menor prioridade da fase)

- Backend `POST /compras/ocr-validade` existe; mobile nunca chama. Adicionar na tela de item da
  despensa/validação a ação "📷 escanear validade do rótulo" preenchendo `validade_escaneada`.
  Fazer por último — escanear rótulo é fricção; a estimativa (7.1) já resolve 90% do valor.

---

## Ordem de execução e PRs

| PR | Fases | Branch sugerida |
| --- | --- | --- |
| 1 | Fase 1 (jurídico) | `fix/vazamento-receitas-importadas` |
| 2 | Fase 2 (corretude) | `fix/dieta-execucao-token-env` |
| 3 | Fase 3 (EAN) | `feat/ean-ponta-a-ponta` |
| 4 | Fase 4 (canonização) | `feat/canonizacao-acuracia` |
| 5 | Fase 5 (instrumentação) | `feat/metricas-retencao-llm` |
| 6 | Fase 6 (QR: sessões + UF + rota nacional 6.3) | `feat/qr-consulta-nacional` |
| 7 | Fase 7 (validade/anti-desperdício) | `feat/validade-estimada-push` |

Nota de priorização: se o objetivo imediato for retenção (lançamento de validação), a Fase 7 pode ser
promovida para logo depois da Fase 2 — os itens 7.1+7.2 são o principal gancho de re-engajamento do
produto e alimentam diretamente as métricas D7/D30 da Fase 5.

Cada PR: descrição citando o item deste plano, testes incluídos, CI verde. Após merge de cada PR,
atualizar a seção correspondente da `AUDITORIA.md` marcando o achado como corrigido (com hash do commit).
