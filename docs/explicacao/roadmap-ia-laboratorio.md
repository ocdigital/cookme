# Roadmap de IA para Programadores — CookMe como Laboratório

> Análise de cada tema: o que é, o que aprender, e se o CookMe serve como laboratório prático ou se vale criar um projeto separado.

---

## 1. Fundamentos de IA e LLMs para Programadores

### O que é

Entender como Large Language Models funcionam por baixo: tokenização, temperatura, context window, embeddings, atenção, e por que modelos "alucinam". Não é matemática de PhD — é o suficiente para tomar decisões de engenharia conscientes (qual modelo usar, quando usar RAG vs fine-tuning, como interpretar um output estranho).

Conceitos-chave: tokens vs palavras, probabilidade condicional, temperatura/top-p, context window limits, modelos multimodais, diferença entre LLM base e instruction-tuned.

### CookMe como laboratório?

**SIM — excelente base.** O CookMe já usa Claude Haiku (geração de receitas), Gemini (embeddings + classificação de produtos) e pgvector (HNSW). Você pode:

- Observar na prática como temperatura afeta criatividade nas receitas geradas
- Comparar outputs de modelos diferentes (Haiku vs Sonnet vs Gemini) para a mesma tarefa
- Ver o impacto real do context window ao passar muitos ingredientes no prompt
- Entender por que o OCR às vezes "inventa" produtos que não existem na nota

**Não precisa de projeto novo.** Instrumentar o `RecipeGeneratorService` com logs de tokens/temperatura já ensina muito.

---

## 2. APIs de IA Generativa e Prompt Engineering

### O que é

A camada prática de trabalhar com LLMs via API: autenticação, rate limits, structured outputs, function calling, streaming, multimodal inputs. Prompt engineering é a arte de escrever instruções que produzem outputs consistentes — inclui few-shot examples, chain-of-thought, system prompts, role prompting e como formatar o retorno para ser parseável.

Conceitos-chave: system/user/assistant roles, few-shot prompting, chain-of-thought (CoT), structured output (JSON mode), tool use/function calling, streaming SSE, retry com backoff exponencial.

### CookMe como laboratório?

**SIM — laboratório perfeito.** O CookMe tem múltiplos casos reais de prompt engineering:

- `RecipeGeneratorService`: gera JSON estruturado de receitas — testar few-shot vs zero-shot
- `ProductClassificationService`: classificar produto de nota fiscal — testar CoT ("pense passo a passo antes de classificar")
- `SocialRecipeExtractorService`: extrair receita de URL genérica — testar robustez do prompt com sites diferentes
- Você pode A/B testar prompts no endpoint `POST /receitas/gerar` e medir qualidade

**Exercício concreto:** reescrever o prompt de geração de receitas usando XML tags (estilo Anthropic) e medir se o JSON parseável aumenta de 85% para 99%.

---

## 3. MCP – Model Context Protocol

### O que é

Protocolo aberto criado pela Anthropic (2024) que padroniza como LLMs se conectam a ferramentas e fontes de dados externas. É como um "USB-C para IA": define uma interface padrão entre um host (Claude Desktop, Claude Code, sua app) e servers MCP que expõem resources (dados), tools (funções executáveis) e prompts (templates reutilizáveis).

Conceitos-chave: MCP host vs MCP server, transporte stdio/SSE, resources (contexto somente-leitura), tools (ações com side effects), prompts (templates parametrizados), schema JSON de input/output.

### CookMe como laboratório?

**SIM — mas requer esforço deliberado.** O CookMe não usa MCP nativamente, mas seria um laboratório rico:

- Criar um MCP server `cookme-inventory` que expõe o inventário do usuário como resource — Claude pode consultar "o que tenho na despensa" sem precisar de RAG
- Criar tool `buscar_receita` que o LLM chama para buscar no banco antes de gerar
- Criar tool `adicionar_produto` que o LLM usa para atualizar o inventário via conversa natural

**Vale fazer no CookMe** se o objetivo é aprender MCP em contexto real. Se quiser aprender MCP puro sem a complexidade do NestJS, um projeto menor (CLI de terminal que gerencia uma lista de tarefas via MCP) é mais rápido para iterar.

---

## 4. Criação de Agentes Autônomos

### O que é

Agentes são LLMs que executam loops de raciocínio → ação → observação até completar um objetivo. O LLM decide qual ferramenta usar, executa, interpreta o resultado, e decide o próximo passo. Vai além de um prompt simples: o agente planeja, lida com erros, e pode chamar múltiplas ferramentas em sequência.

Padrões: ReAct (Reason + Act), Plan-and-Execute, multi-agent (orquestrador + sub-agentes especializados), tool use com feedback loop, memory de curto/longo prazo.

### CookMe como laboratório?

**SIM — mas o projeto atual não tem agente, precisa construir.** Oportunidade direta:

- **Agente de compras**: recebe a lista de compras do usuário → consulta inventário → remove o que já tem → sugere quantidades baseadas no histórico → gera lista final. Requer tool use em cadeia real.
- **Agente de planejamento**: dado o modo alimentar + o que está vencendo + preferências → monta semana inteira com justificativas. Já existe endpoint `/planejamento/gerar-aleatoria`, mas sem agente.
- **Agente de validação de receitas** (mencionado em `robot_validador_receitas.md`): já está planejado — seria o laboratório ideal.

**Alternativa projeto separado:** um agente CLI que monitora uma pasta de PDFs e extrai dados estruturados — mais simples para aprender o padrão sem toda a stack do CookMe.

---

## 5. Ferramentas de IA para UX & UI

### O que é

Como usar IA para acelerar e melhorar o processo de design e desenvolvimento de interfaces: geração de wireframes, análise de usabilidade, geração de componentes, testes A/B com IA, acessibilidade automatizada, e ferramentas como Figma AI, v0.dev, Cursor para frontend, e análise de heatmaps com IA.

Conceitos-chave: geração de componentes via prompt, design systems + IA, análise de screenshots para bugs de UI, geração de variações de copy, testes de acessibilidade automatizados.

### CookMe como laboratório?

**PARCIALMENTE.** O mobile (Expo/React Native) e o admin (Next.js) existem e têm telas reais. Dá para:

- Usar v0.dev para gerar variações da tela de receitas e comparar com o atual
- Usar Claude com screenshot das telas para auditoria de acessibilidade
- Gerar componentes para a tela de paywall (que ainda não existe no mobile)

**Limitação:** testar UX real requer usuários reais. Para aprender as ferramentas de geração de UI, um projeto greenfield simples (landing page, dashboard) permite iterar mais rápido sem se preocupar com consistência do design system existente.

---

## 6. Ferramentas de IA para DevOps

### O que é

IA aplicada ao ciclo de vida de infraestrutura: geração de IaC (Terraform, CloudFormation), análise de logs com LLM, alertas inteligentes, auto-healing, geração de pipelines CI/CD, análise de performance de código em produção, e assistentes de on-call.

Conceitos-chave: LLM para análise de stack traces, geração de Dockerfile/docker-compose, análise de métricas com linguagem natural, pipelines CI/CD gerados por IA, observabilidade com LangSmith/Helicone.

### CookMe como laboratório?

**SIM — gap real a preencher.** O MEMORY.md anota explicitamente: "CI/CD não existe, deploys manuais rsync+pm2". Isso é uma oportunidade:

- Usar IA para gerar o pipeline GitHub Actions do zero (build → test → deploy no VPS)
- Usar LangSmith para observabilidade das chamadas LLM (já mencionado no `cookme-ai-service`)
- Configurar análise automática dos logs do pm2 no VPS com um LLM

**É o laboratório certo** porque o problema é real (não há CI/CD) e a dor é sentida. Aprender DevOps+IA em um projeto fictício tem menos impacto.

---

## 7. Ferramentas de IA para Gestão de Projetos

### O que é

IA aplicada a planejamento, estimativas, retrospectivas e comunicação de projeto: ferramentas que analisam o backlog e sugerem priorização, geram relatórios de sprint, estimam complexidade de tasks, detectam riscos no roadmap, e resumem discussões de PRs/issues.

Conceitos-chave: análise de backlog com LLM, estimativa por story points via IA, geração automática de release notes, análise de sentimento em code reviews, assistentes de reunião.

### CookMe como laboratório?

**LIMITADO.** O CookMe é projeto solo — gestão de projeto com IA brilha em times. Dá para:

- Usar Claude para analisar o `BACKLOG.md` e sugerir priorização baseada no checklist de investidor
- Gerar release notes a partir do `git log` automaticamente
- Criar um script que lê o MEMORY.md e gera um briefing semanal de status

**Recomendação:** aprenda as ferramentas (Linear AI, GitHub Copilot for PRs, Notion AI) em contexto de trabalho real se você tem um time. Para projeto solo, o valor é menor — investir tempo aqui tem ROI baixo no CookMe.

---

## 8. Arquitetura de Sistemas com IA

### O que é

Como desenhar sistemas que incorporam LLMs de forma robusta: padrões de fallback (quando o LLM falha), caching de respostas, rate limiting por usuário, latência vs qualidade, arquiteturas RAG, pipelines de dados para alimentar os modelos, e como decidir entre modelo local vs API vs fine-tuning.

Conceitos-chave: RAG (Retrieval-Augmented Generation), semantic cache, circuit breaker para APIs de LLM, streaming para UX responsiva, model routing (usar modelo barato para tarefa simples), arquitetura de multi-agentes.

### CookMe como laboratório?

**SIM — o melhor tema para explorar no CookMe.** O sistema já tem arquitetura em cadeia (banco → RAG → Haiku) com fallback real. Pode explorar:

- Adicionar **semantic cache** antes do RAG: se alguém já pediu receitas com "frango + arroz", reutilizar sem chamar o LLM
- Implementar **model routing**: classificação de produto (task simples) → Haiku; geração de receita elaborada com restrições → Sonnet
- Construir o `cookme-ai-service` Lambda (já planejado no CLAUDE.md) — arquitetura de microsserviço IA real
- Medir latência P95 da cadeia atual e identificar gargalos

**É onde o CookMe mais brilha como laboratório** — problemas reais de produção, não exercícios artificiais.

---

## 9. Processamento de Dados e Fine Tuning

### O que é

Pipeline de dados para IA: coleta, limpeza, anotação, e como preparar datasets para fine-tuning de modelos. Fine-tuning é treinar um modelo base em dados específicos do seu domínio para melhorar performance em tarefas narrow (ex: classificar produtos de supermercado com 99% de acurácia ao invés de 80% do modelo genérico).

Conceitos-chave: curadoria de dataset, anotação humana vs sintética, RLHF simplificado, LoRA/QLoRA (fine-tuning eficiente), avaliação de modelos (benchmarks, human eval), quando fine-tuning vale vs prompt engineering.

### CookMe como laboratório?

**PARCIALMENTE — dados existem, mas fine-tuning tem custo alto.** O CookMe tem dados reais:

- Histórico de classificações de produtos do OCR (produto → categoria) — dataset para fine-tuning de classificador
- Receitas geradas + avaliações dos usuários — dataset para RLHF de qualidade de receita
- `IngredientCleanerService` produz dados limpos vs sujos — dataset de limpeza de texto

**Limitação real:** fine-tuning de LLMs requer GPU ou $ significativo. Para aprender o conceito, o CookMe fornece os dados, mas o treinamento em si precisará de outro ambiente (Google Colab, Modal, Replicate).

**Projeto separado útil:** um classificador de produtos de supermercado com dataset público do IBGE — escopo menor, iteração mais rápida, sem depender da stack do CookMe.

---

## 10. Segurança e Governança em IA

### O que é

Como garantir que sistemas com IA sejam seguros, justos, auditáveis e conformes com regulações: prompt injection (atacar o sistema via input malicioso), jailbreak, vazamento de dados via LLM, LGPD/GDPR aplicado a sistemas de IA, auditoria de decisões automatizadas, bias em modelos, e políticas de uso aceitável.

Conceitos-chave: prompt injection, indirect injection (via conteúdo externo), PII leakage, output filtering, rate limiting de segurança, AI Act (regulação europeia), LGPD Art. 11 (dados sensíveis), explicabilidade de decisões automatizadas.

### CookMe como laboratório?

**SIM — e já tem implementação real de LGPD.** O CookMe é dos projetos mais ricos para este tema:

- **LGPD já implementada**: consentimento dados de saúde (Art. 11), direito ao esquecimento, purge automático de logs — estudar o código existente ensina conformidade real
- **Prompt injection real**: o `SocialRecipeExtractorService` extrai receitas de URLs de usuário — uma página maliciosa poderia injetar instruções no conteúdo parseado pelo LLM
- **PII no OCR**: a nota fiscal contém CPF do comprador — garantir que o LLM não armazene isso é um exercício prático de governança
- **Auditoria**: as decisões do `ProductClassificationService` afetam o inventário — como auditar decisões automatizadas?

**Exercício concreto de segurança:** testar se o `SocialRecipeExtractorService` é vulnerável a prompt injection injetando instruções ocultas em uma página de receita controlada.

---

## Resumo — CookMe como Laboratório

| # | Tema | CookMe serve? | Observação |
| --- | ------ | :---: | --- |
| 1 | Fundamentos de LLMs | ✅ Ótimo | Observar comportamento real dos modelos já em uso |
| 2 | APIs e Prompt Engineering | ✅ Ótimo | Múltiplos prompts reais para otimizar e A/B testar |
| 3 | MCP | ✅ Com esforço | Criar MCP server para inventário/receitas — ótimo exercício |
| 4 | Agentes Autônomos | ✅ Com esforço | Agente de validação de receitas já planejado |
| 5 | UX & UI com IA | ⚠️ Parcial | Útil para paywall mobile; UI nova aprende mais rápido |
| 6 | DevOps com IA | ✅ Dor real | CI/CD não existe — gap real para resolver |
| 7 | Gestão de Projetos | ⚠️ Limitado | Projeto solo — valor maior em times reais |
| 8 | Arquitetura com IA | ✅ Excelente | Melhor tema — problemas reais de produção |
| 9 | Dados e Fine Tuning | ⚠️ Parcial | Dados existem; GPU/$ para fine-tuning vem de fora |
| 10 | Segurança e Governança | ✅ Ótimo | LGPD já implementada; prompt injection testável |

### Veredicto geral

**O CookMe é um laboratório excelente para 7 dos 10 temas.** Não precisar criar projeto novo para a maioria — o valor está em aprofundar o que já existe. Os únicos casos onde um projeto separado acelera o aprendizado são:

- **MCP** (tópico 3): se quiser aprender o protocolo puro, um projeto CLI simples itera mais rápido do que navegar toda a stack NestJS
- **UX/UI** (tópico 5): para experimentar geradores de componente (v0.dev, etc.) sem se preocupar com consistência do design system existente  
- **Fine-tuning** (tópico 9): os dados do CookMe são úteis, mas o treinamento precisa de infraestrutura separada de qualquer forma

Para os demais, **o problema real é o melhor professor** — exercícios artificiais em projetos vazios ensinam a ferramenta, mas não a julgamento de quando e como aplicá-la.
