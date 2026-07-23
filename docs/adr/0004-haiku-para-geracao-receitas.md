# ADR-0004: Claude Haiku para geração de receitas

- **Status:** Aceito
- **Data:** 2026-07-22 *(registrado retroativamente)*
- **Decisores:** Equipe CookMe

## Contexto

Quando o banco local + RAG não trazem receitas suficientes para os ingredientes do usuário, é preciso **gerar receitas originais** via LLM. Essa geração acontece com frequência e precisa ser barata o bastante para caber no custo por usuário (alvo: 1,5–4% do ticket), mantendo qualidade aceitável.

## Decisão

Vamos usar **Claude Haiku** (Anthropic) como modelo de geração de receitas, dentro da cadeia:

```
banco local → RAG (embedding Gemini + Haiku adapta receita similar) → Haiku gera do zero
```

Haiku também adapta receitas encontradas pelo RAG para os ingredientes específicos do usuário.

### Alternativas consideradas

- **Modelos Claude maiores (Sonnet/Opus)** — descartado para o caminho quente: qualidade marginalmente melhor não justifica o custo por geração num fluxo de alto volume.
- **Gemini como gerador primário** — mantido apenas como *fallback* (e para embeddings do RAG), não como gerador principal de receitas.

## Consequências

- ✅ Custo de geração baixo (~US$0,027 por geração fria) — sustentável no modelo de negócio.
- ✅ Latência menor que modelos maiores.
- ✅ Cadeia com fallback: se Haiku falhar (ex.: saldo Anthropic zerado), o RAG com Gemini ainda responde — o sistema degrada, não quebra.
- ⚠️ Qualidade inferior a Sonnet/Opus em casos complexos; mitigada pela **validação em 2 estágios** (determinística + semântica) antes de aprovar a receita.
- ⚠️ Dependência de disponibilidade/saldo da API Anthropic — o risco é *disponibilidade*, não preço.
- 🔗 Toda receita gerada passa por validação antes de ir ao banco público; nunca auto-aprova em erro. Ver [Explicação: Inteligência](/explicacao/inteligencia).
