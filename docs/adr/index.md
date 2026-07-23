# Architecture Decision Records (ADR)

Registro histórico das decisões arquiteturais do CookMe. Cada ADR captura **uma** decisão importante: o contexto da época, a escolha feita, e as consequências assumidas.

## Por que ADR?

Decisões técnicas se perdem. Seis meses depois, ninguém lembra *por que* escolhemos X em vez de Y — e alguém propõe reverter sem conhecer o contexto original. O ADR preserva esse raciocínio de forma permanente.

## Regras (formato Michael Nygard)

1. **Numerados** sequencialmente (`0001`, `0002`…), em ordem cronológica.
2. **Imutáveis.** Um ADR aceito nunca é editado. Mudou a decisão? Crie um novo ADR que **substitui** (`Substitui ADR-XXXX`) o anterior — e marque o antigo como `Substituído`.
3. **Curtos.** Uma página. Contexto → Decisão → Consequências.
4. **Status explícito:** `Proposto` · `Aceito` · `Substituído` · `Depreciado`.

## Como criar um novo

1. Copie [`template.md`](/adr/template) para `docs/adr/NNNN-titulo-curto.md` (próximo número).
2. Preencha. Abra PR. A decisão é discutida **no PR**, não em reunião perdida.
3. Ao mergear com status `Aceito`, adicione a linha no índice abaixo.

## Índice

| # | Decisão | Status |
| --- | --------- | -------- |
| [0001](/adr/0001-pgvector-para-rag) | pgvector para busca semântica (RAG) | Aceito |
| [0002](/adr/0002-engine-canonizacao-servico-separado) | Engine de canonização como serviço separado | Aceito |
| [0003](/adr/0003-proibir-scraping-autonomo) | Proibir scraping autônomo de receitas | Aceito |
| [0004](/adr/0004-haiku-para-geracao-receitas) | Claude Haiku para geração de receitas | Aceito |
