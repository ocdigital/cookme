# Cronograma de Infraestrutura — CookMe

> 2026-07-06. Cenário assumido: **deu certo** — crescimento forte e contínuo pós-lançamento.
> Preços em US$/mês, ordem de grandeza (DigitalOcean/AWS mudam tabela; conferir na hora de contratar).
> Filosofia: **escalar por GATILHO MEDIDO, nunca por calendário** — o cronograma diz o que fazer
> QUANDO cada métrica estourar; as datas são a projeção otimista de quando isso acontece.

---

## Ponto de partida (hoje)

| Item | Estado |
|---|---|
| VPS | DigitalOcean 1 vCPU / **1GB RAM** / 24GB disco (~US$ 6-8/mês) |
| Stack no mesmo box | NestJS (pm2, fork único) + PostgreSQL 16 + pgvector + Nginx + Redis |
| Proteção | Cloudflare proxy + rate limit + fail2ban ✅ |
| Imagens | R2 (Cloudflare) ✅ — já é CDN, não pesa no VPS |
| Backup | **diário no MESMO disco** ⚠️ — VPS morre = backup morre |
| SPOF | tudo: 1 processo, 1 banco, 1 máquina |

A carga do CookMe é **leve por natureza**: o trabalho pesado (geração IA, OCR) é I/O externo (APIs), não CPU local. O que mata essa stack primeiro é **RAM** (PG + Node + Redis em 1GB) e depois **conexões do Postgres**.

---

## Cronograma (projeção otimista)

### FASE 0 — AGORA, antes de crescer (custo: +US$ 0-5)
*Independe de usuários — são riscos existentes.*

1. **Backup off-site**: dump diário → R2/Spaces (`pg_dump | rclone`). Hoje, perder o droplet = perder TUDO. 1h de trabalho.
2. **Monitor de uptime externo** (UptimeRobot/BetterStack free): `api.cookme.com.br/api/health` a cada 1min + alerta no seu celular.
3. pm2 rodando como **root** → voltar para usuário `cookme-app`.
4. Anotar baseline: RAM livre, p95 de latência (Nginx log), conexões PG.

### FASE 1 — Lançamento → ~2.000 MAU (M1-M4) · US$ 12-24/mês
**Gatilho:** swap ativo constante OU RAM livre <15% OU p95 >500ms.
**Ação:** resize do droplet para **2GB → 4GB RAM** (5 min de downtime, botão no painel).

É só isso. 4GB aguenta confortavelmente 2-5k MAU dessa carga. Não mexer em mais nada — cada hora de infra aqui é hora roubada de produto/retenção.

### FASE 2 — 2.000 → 10.000 MAU (M4-M8) · US$ 60-90/mês
**Gatilho:** PG disputando RAM com Node (OOM-killer, queries lentas >100ms no p95, conexões >60) OU deploy derrubando requests.

1. **Separar o banco**: Managed PostgreSQL (DO, ~US$ 15-30) com pgvector — backups/failover automáticos, e o droplet vira só app. *Maior salto de confiabilidade por dólar de toda a lista.*
2. Droplet app 4GB dedicado (~US$ 24-48).
3. pm2 em **cluster mode** (2+ workers) — usa os vCPUs e deploy sem queda (`pm2 reload`).
4. Sessões do scraper já estão em tabela (feito) — nada quebra com múltiplos workers. ✅

### FASE 3 — 10.000 → 50.000 MAU (M8-M14) · US$ 150-300/mês
**Gatilho:** 1 droplet de app não segura pico (CPU >70% sustentado) OU você perder uma noite de sono por queda.

1. **2 droplets de app + Load Balancer** (DO LB ~US$ 12) — mata o SPOF de aplicação.
2. Managed PG num plano com **standby/failover** (~US$ 60+).
3. Managed Redis (~US$ 15) — cache/fila fora do box.
4. **Fila para OCR/geração** (BullMQ sobre o Redis): picos de cupom não derrubam API.
5. CI/CD com deploy nos 2 nós (o pipeline do PLANO_CORRECOES F-1 vira obrigatório).

**Ainda DigitalOcean.** Essa arquitetura (LB + 2 app + managed PG) atende 50k MAU dessa carga com folga. AWS aqui só adicionaria custo e complexidade.

### FASE 4 — Migrar para AWS: 50.000+ MAU **ou** qualquer gatilho abaixo (M14+) · US$ 500-1.000/mês inicial

**AWS não é "upgrade natural" — é troca de trade-off.** Para a mesma capacidade custa 2-3× mais e exige mais expertise. Migre quando UM destes for verdade:

| Gatilho de migração | Por quê AWS resolve |
|---|---|
| Picos imprevisíveis grandes (TV, viral) | Auto-scaling real (ECS Fargate) — DO escala na mão |
| Time de eng ≥ 3 pessoas | IAM, ambientes, infra-as-code maduros |
| Investidor/enterprise/B2B exigindo compliance (SOC2, etc.) | Certificações e ferramentas prontas |
| Pivô B2B (API de ingestão) com SLA contratual | SQS, multi-AZ, observabilidade gerenciada |
| Créditos AWS Activate (startups: até US$ 5-100k) | **Migração de graça por 1-2 anos** — se conseguir os créditos, o cálculo muda e pode antecipar |

**Arquitetura alvo:** ECS Fargate (API) + RDS Postgres multi-AZ (pgvector) + SQS (filas OCR/geração/push) + ElastiCache + CloudFront/S3. Migração: ~1-2 semanas de trabalho, dual-run com o DO até validar.

### FASE 5 — 150.000+ MAU (ano 2) · US$ 1.500-3.000/mês
Read-replicas PG, workers dedicados por fila, APM (Datadog/Grafana Cloud), possivelmente região secundária. Nesse ponto há receita (150k × 3% × R$15 ≈ **R$ 67k/mês**) e time — decisões deixam de ser deste documento.

---

## Tabela-resumo

| Fase | MAU | Quando (otimista) | Infra | US$/mês | Infra ÷ receita* |
|---|---|---|---|---|---|
| 0 | 0 | agora | backup off-site + monitor | 8 | — |
| 1 | 0-2k | M1-M4 | droplet 2-4GB | 12-24 | ~2% |
| 2 | 2k-10k | M4-M8 | app 4GB + managed PG | 60-90 | ~1,5% |
| 3 | 10k-50k | M8-M14 | LB + 2 app + PG failover + fila | 150-300 | <1% |
| 4 | 50k+ | M14+ | AWS (Fargate+RDS+SQS) | 500-1.000 | <1% |
| 5 | 150k+ | ano 2 | multi-AZ, réplicas, APM | 1.500-3.000 | <1% |

\* receita = MAU × 3% conversão × R$ 15, câmbio ~5,5. Infra nunca passa de ~2% da receita — **como a IA (ver ESTUDO_CUSTO_IA.md), infra não é o risco do negócio; CAC é.**

## O que monitorar (gatilhos, não achismo)

Já existe: `/api/health`, `pm2 status`, `GET /admin/metricas/llm`. Adicionar ao hábito semanal:
- `free -h` → swap em uso constante = Fase 1
- `SELECT count(*) FROM pg_stat_activity` → >60 = Fase 2
- p95 de latência no log do Nginx → >500ms sustentado = próxima fase
- CPU >70% por >1h/dia = próxima fase

## O que NÃO fazer (em nenhuma fase antes da 4)

- **Kubernetes** — overkill absurdo para 1 dev; Fargate já é o teto de complexidade necessário.
- **Microserviços** — o monolito NestJS escala horizontalmente atrás do LB até dezenas de milhares de MAU.
- **Multi-região** — Brasil é um mercado; latência SP→NY não mata o produto.
- **Migrar para AWS "para estar preparado"** — migração sem gatilho é semanas perdidas + 2-3× custo para a mesma capacidade.
- **Trocar Postgres** — PG16+pgvector atende até a Fase 5 tranquilo.

## Resumo executivo

1. **Hoje → 2k usuários: um resize de RAM (US$ 12-24). Nada mais.**
2. **O upgrade mais importante não é tamanho, é o banco gerenciado** (Fase 2, ~10k MAU) — confiabilidade barata.
3. **AWS só com gatilho real** (~50k MAU, time maior, compliance ou créditos Activate). DigitalOcean leva o CookMe até lá inteiro.
4. **Fase 0 é urgente e quase grátis**: backup fora do VPS + monitor de uptime. O resto espera usuários.
