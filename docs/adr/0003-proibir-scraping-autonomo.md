# ADR-0003: Proibir scraping autônomo de receitas

- **Status:** Aceito
- **Data:** 2026-07-22 *(registrado retroativamente)*
- **Decisores:** Equipe CookMe

## Contexto

Uma forma "fácil" de popular o banco de receitas seria raspar sites de culinária (ex.: TudoGostoso) automaticamente. Versões iniciais do projeto chegaram a ter esse caminho.

Porém, receitas com texto autoral são **obra protegida** pela Lei 9.610/98 (direitos autorais). Copiar em massa e redistribuir pelo app cria risco jurídico real — o banco público do CookMe é compartilhado entre todos os usuários.

## Decisão

O banco público conterá **apenas** receitas geradas por IA — origem `ia_gerada`, identificadas por `url_fonte IS NULL AND autor_id IS NULL`. Scraping autônomo no fluxo principal é **proibido**.

Isso é reforçado no código e coberto por teste:

```sql
-- recipe-rag.service.ts: busca APENAS no banco público
AND url_fonte IS NULL
```

A regra tem teste dedicado (`separacao-juridica.spec.ts`) que trava o invariante.

**Exceção controlada:** o *usuário* pode importar uma receita específica de uma URL/rede social que ele mesmo escolheu (`SocialRecipeExtractorService`). Essa receita vai para a **biblioteca pessoal** dele, com badge de fonte, **visível só para ele** — nunca entra no banco público nem na geração para outros usuários.

### Alternativas consideradas

- **Scraping autônomo com atribuição de fonte** — descartado: atribuir a fonte não elimina a redistribuição não autorizada; o risco autoral permanece.
- **Licenciar conteúdo de terceiros** — descartado nesta fase: custo e complexidade contratual incompatíveis com o estágio do projeto.

## Consequências

- ✅ Risco jurídico (Lei 9.610/98) eliminado no banco compartilhado.
- ✅ Diferencial de produto: receitas geradas sob medida para os ingredientes do usuário, não cópias.
- ⚠️ O banco cresce mais devagar — depende de geração por IA (custo de LLM) em vez de raspagem gratuita.
- 🔗 A separação público × pessoal é um **invariante crítico**: qualquer feature que leia receitas para geração/RAG deve filtrar `url_fonte IS NULL AND autor_id IS NULL`. Ver [Explicação: Inteligência](/explicacao/inteligencia).
