# Roadmap: Dev PHP Sênior na Era da IA

> *"O risco não é 'IA substitui devs' — é 'dev que entende o que a IA faz substitui dev que não entende.'"*

Eduardo Ferreira — Guia de Evolução Técnica 2025–2026.  
**O CookMe é o projeto âncora de todo esse aprendizado** — cada nível tem aplicação direta aqui.

---

## Nível 1 — Fundamentos que a IA não substitui

Base que permite validar e corrigir o que a IA gera. Sem isso, você é dependente da saída.

### Sistemas Distribuídos

- Circuit Breaker, SAGA, idempotência, eventual consistency
- Comunicação sync (REST/gRPC) vs async (filas)
- 📖 Livro: *"Designing Data-Intensive Applications"* — Kleppmann (referência padrão)
- 🎓 Curso: "Microsserviços na prática" — Full Cycle (fullcycle.com.br)

**No CookMe:** o `RecipeGeneratorService` já implementa cadeia de fallback (Claude → Gemini → mock) — isso é circuit breaker na prática. O `ProductClassificationService` usa cache-first para evitar chamadas desnecessárias à API.

### Observabilidade

- Logs estruturados (JSON), métricas (Prometheus), traces distribuídos (OpenTelemetry)
- Dashboards e alertas: Grafana, CloudWatch
- 📖 Recurso: documentação oficial OpenTelemetry + curso gratuito Grafana Labs

**No CookMe:** o backend já loga com `Logger` do NestJS. Próximo passo: adicionar logs estruturados JSON e rastrear custo por token nas chamadas à IA.

### Segurança em código

- OWASP Top 10 — **IA gera código vulnerável com frequência**
- Injeção SQL, XSS, IDOR, exposição de dados sensíveis
- 📖 Recurso: owasp.org/www-project-top-ten (gratuito)

**No CookMe:** JWT guard global, `@Exclude()` na senha do usuário, TypeORM como ORM (proteção SQL injection). Revisar: rate limiting nas rotas de IA, validação de input nos DTOs.

### SQL Profundo

- EXPLAIN / EXPLAIN ANALYZE, índices, query planning
- 📖 Recurso: "Use The Index, Luke" — use-the-index-luke.com (gratuito)

**No CookMe:** `inventario` tem índice em `(usuario_id, produto_id, data_validade)`. `receitas` tem índice em `ingredientes_chave` (array). Praticar EXPLAIN nas queries de matching do `ReceitaBancoService`.

---

## Nível 2 — Entender IA como ferramenta

O que separa quem usa bem de quem usa mal. Você precisa saber onde a IA erra.

### Como LLMs funcionam (sem matemática pesada)

- Tokens, janela de contexto, temperatura, alucinação
- Por que a IA "inventa" código que parece certo mas não funciona
- 🎓 Recurso: "A Developer's Introduction to LLMs" — fast.ai (gratuito)

**No CookMe:** o sistema de classificação em batch (`classificarEmBatch`) existe exatamente porque LLMs têm custo por token — 1 chamada com 50 produtos é 95% mais barata que 50 chamadas.

### Prompt Engineering para código

- Chain-of-thought: peça raciocínio passo a passo antes do código
- Few-shot: dê exemplos do padrão de código que você usa no projeto
- Contexto: estruturar system prompt com arquitetura e convenções do projeto
- 📖 Recurso: promptingguide.ai (gratuito)

**No CookMe:** o `CLAUDE.md` na raiz do projeto é um system prompt estruturado. Os gotchas TypeORM (coluna `senha`, não `senha_hash`; `simple-array` não filtra com LIKE) estão lá para guiar a IA e evitar alucinações específicas do projeto.

### RAG — Retrieval-Augmented Generation

- Conectar IA à sua base de código, docs internas, runbooks
- Embeddings, vector databases (Pinecone, pgvector)
- 🎓 Recurso: "LangChain for LLM Application Development" — DeepLearning.AI (gratuito)

**No CookMe:** o `product_knowledge_base` é um RAG artesanal — cache de classificações que cresce com o uso. O próximo passo natural é usar `pgvector` para busca semântica de receitas por similaridade de ingredientes.

### Avaliação de output de IA

- Como escrever testes para validar código gerado
- Code review sistemático: segurança, performance, edge cases

**No CookMe:** os 52 testes Jest existentes são a base. TDD é a metodologia adotada — escreve teste antes de implementar.

---

## Nível 3 — Construir com IA (diferencial de mercado)

Quem constrói sistemas que **usam** IA tem demanda e salário maiores.

### APIs de LLM

- Anthropic (Claude) e OpenAI API — autenticação, streaming, rate limits
- Tool use / function calling — permite que IA execute ações reais
- 📖 Recurso: docs.anthropic.com/en/docs (Claude API)

**No CookMe:** `ProductClassificationService` chama Claude diretamente via HTTP (`fetch` para `api.anthropic.com/v1/messages`). `RecipeGeneratorService` usa `@anthropic-ai/sdk`. Você já usa as duas formas.

### Agentes e automação

- Agentes: LLM + ferramentas + loop de decisão
- Frameworks: LangChain (Python/JS), CrewAI (multi-agente), Vercel AI SDK (JS/TS)
- Projeto sugerido: agente que analisa PR e sugere code review automaticamente

**No CookMe:** o `cookme-ai-service` (próximo passo) será um agente LangChain em Python rodando no Lambda. Ver seção [Projeto Âncora](#projeto-âncora-cookme-ai-service).

### MCP — Model Context Protocol

- Padrão Anthropic para conectar IA com ferramentas externas (banco, APIs, filesystem)
- Relevante para integrar IA em sistemas internos de empresas
- 📖 Recurso: modelcontextprotocol.io (gratuito)

**No CookMe futuro:** MCP server que expõe inventário e receitas como ferramentas para um agente Claude. Usuário pergunta "o que posso fazer hoje?" e o agente consulta o banco diretamente.

### Observabilidade em pipelines de IA

- Rastrear latência, custo por token, taxa de erro em chamadas LLM
- Ferramentas: LangSmith, Helicone, ou instrumentação manual via OpenTelemetry

**No CookMe:** `AIClassificationLog` já registra `tempo_requisicao_ms`, `confidence_score`, `from_cache`. Próximo passo: adicionar custo por token e integrar LangSmith no `cookme-ai-service`.

---

## Nível 4 — Posicionamento

Não técnico, mas determina quais vagas aparecem e qual salário é negociado.

### Construção de reputação técnica

- 1 projeto open source real vale mais que 10 certificados de curso
- Escrever sobre o que você constrói: LinkedIn, dev.to, Substack
- Contribuir com repos PHP conhecidos (Laravel, Symfony ecosystem)

**No CookMe:** o matching ponderado por protagonista ("churrasco sem carne é uma fogueira") é exatamente o tipo de decisão técnica não-óbvia que vale um artigo no LinkedIn.

### Especialização vertical

- Fintech + IA: nicho escasso, bem pago — base com PicPay/Rated Global
- PHP backend + sistemas de pagamento + IA aplicada = perfil raro

### Inglês técnico

- Experiência UK — usar isso. Vagas internacionais pagam 3–5x mais
- Praticar: contribuir em issues de repos em inglês, escrever artigos em inglês

---

## Nível 5 — Dados, Infra & Cloud

Expansão para vagas Data+AI. Horizonte: 12 meses.

### Python — Backend e APIs

- FastAPI ou Flask para APIs de produção
- Tipagem, testes com pytest, async com asyncio
- 📖 Recurso: fastapi.tiangolo.com (gratuito)

**No CookMe:** o `cookme-ai-service` é Python + FastAPI. Começa aqui.

### Data Engineering — Fundamentos

- Batch vs streaming, data lake vs data warehouse, particionamento
- Modelagem dimensional: star schema, fact/dimension tables
- Orquestração: Apache Airflow (padrão de mercado)
- 📖 Livro: *"Fundamentals of Data Engineering"* — Reis & Housley
- 🎓 Recurso: curso gratuito dbt Core — courses.getdbt.com

### BigQuery

- Sintaxe SQL específica, particionamento, clustering, controle de custo por query
- Integração com dbt para transformações analíticas
- 🎓 Recurso: Google Cloud Skills Boost — "BigQuery for Data Analysts" (gratuito com trial)

### GCP — Google Cloud Platform

| GCP | AWS (já conhecido) |
| ----- | ------------------- |
| Cloud Run | Lambda |
| Cloud Storage | S3 |
| Pub/Sub | SQS/SNS |
| BigQuery | Redshift |

- 🎓 Certificação entry point: Associate Cloud Engineer

### Kubernetes — Fundamentos Operacionais

- Pods, Deployments, Services, ConfigMaps, Secrets
- Liveness/readiness probes, HPA (auto-scaling)
- `kubectl`: apply, logs, exec, port-forward
- 📖 Livro: *"Kubernetes: Up and Running"* — Burns et al.
- 🎓 Recurso: labs.play-with-k8s.com (gratuito)
- Meta: operar workloads existentes com autonomia, não virar especialista

---

## Prioridade — Próximos 3 Meses

1. **Sistemas distribuídos** — aprofunda circuit breaker, SAGA, observabilidade. Resolve gap direto em vagas como PicPay.
2. **1 projeto real com API de LLM** — o `cookme-ai-service` cobre isso.
3. **Segurança em código gerado por IA** — diferencial imediato em code review e entrevistas técnicas.

---

## Timeline Completa

| Período | Foco |
| --------- | ------ |
| Meses 1–2 | Finalizar scraper Python + estrutura FastAPI do `cookme-ai-service` |
| Meses 2–4 | LangChain + APIs LLM + deploy Lambda + observabilidade |
| Meses 4–6 | GCP basics + BigQuery + dbt |
| Meses 6–9 | Kubernetes operacional + certificação GCP Associate |
| Meses 9–12 | Projeto integrador completo + pipeline de dados + IA + dashboard React |

**Vagas PHP/fintech (PicPay):** candidatar agora — stack já atende.  
**Vagas Data+AI:** candidatar em 6–9 meses com portfólio CookMe completo.

---

## Projeto Âncora — CookMe AI Service

Projeto real com problema real. Adicionar microsserviço Python + Lambda **sem reescrever o backend NestJS**.

### Arquitetura

```
inventário do usuário
        ↓
NestJS API → invoke Lambda → cookme-ai-service (Python + FastAPI)
                                      ↓
                           LangChain + Claude/Gemini API
                                      ↓
                    receitas geradas + substituições + alertas de vencimento
```

### Stack

- **Runtime:** Python 3.12
- **Framework:** FastAPI
- **IA:** LangChain + Anthropic SDK
- **Deploy:** AWS Lambda (Serverless Framework)
- **Observabilidade:** LangSmith + CloudWatch

### Estrutura de pastas

```
cookme-ai-service/
├── src/
│   ├── main.py              # FastAPI app + Lambda handler
│   ├── chains/
│   │   └── recipe_chain.py  # LangChain chain principal
│   ├── models/
│   │   ├── input.py         # Pydantic: IngredientesInput
│   │   └── output.py        # Pydantic: ReceitaGerada
│   └── prompts/
│       └── recipe.py        # Prompt templates
├── tests/
│   └── test_recipe_chain.py
├── serverless.yml
├── requirements.txt
└── .env.example
```

### Contrato de API

**Input (NestJS → Lambda):**

```json
{
  "ingredientes": [
    { "nome": "arroz", "quantidade": 500, "unidade": "g", "vencimento": "2026-06-20" }
  ],
  "modo_alimentar": "normal",
  "refeicao": "almoco",
  "max_receitas": 3
}
```

**Output (Lambda → NestJS):**

```json
{
  "receitas": [{
    "nome": "Arroz com legumes",
    "ingredientes_usados": ["arroz", "cenoura"],
    "ingredientes_faltantes": ["azeite"],
    "instrucoes": "...",
    "tempo_preparo": 30,
    "alertas": ["arroz vence em 9 dias"]
  }]
}
```

### Variáveis de ambiente

```env
ANTHROPIC_API_KEY=...
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=cookme-ai
LOG_LEVEL=INFO
```

### Integração com NestJS

- `RecipeGeneratorService` (já existe) passa a invocar o Lambda
- Manter fallback para Gemini/mock caso Lambda falhe
- Variável: `COOKME_AI_LAMBDA_ARN` ou `COOKME_AI_SERVICE_URL`

### Habilidades praticadas

- Python backend real (FastAPI, tipagem, pytest)
- AWS Lambda com Python runtime
- LangChain: chains, prompts, tool use
- APIs LLM: autenticação, streaming, rate limits
- Observabilidade: logs estruturados, custo por token
- Arquitetura de microsserviços: contrato de API, separação de responsabilidades

### Valor de portfólio

- Projeto real com problema real — não é CRUD de exercício
- Stack visível no GitHub: NestJS + Python + Lambda + LangChain
- Demonstra integração de IA em produção, não apenas uso de chatbot
- Alinha com vagas Data+AI que pedem "LLMs em produção"
