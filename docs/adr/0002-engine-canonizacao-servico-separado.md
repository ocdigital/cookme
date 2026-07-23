# ADR-0002: Engine de canonização como serviço separado

- **Status:** Aceito
- **Data:** 2026-07-22 *(registrado retroativamente)*
- **Decisores:** Equipe CookMe

## Contexto

O OCR da nota fiscal produz descrições sujas ("REFRIG COCA 2L", "LEITE ITALAC INT 1L"). Para virar itens úteis na despensa, cada linha precisa ser **canonizada** para um produto limpo ("refrigerante", "leite" + marca "Italac").

Ao mesmo tempo, foi identificado que essa capacidade de canonização de cupom fiscal brasileiro tem **valor de mercado próprio** (potencial API B2B — ver docs de negócio), com clientes fora do CookMe (finanças, nutrição, cashback, CRMs de varejo).

Se a canonização vivesse acoplada dentro do backend do CookMe, ela nunca poderia ser vendida/consumida por terceiros sem arrastar o CookMe junto.

## Decisão

Vamos extrair a canonização para um **serviço HTTP separado** (`cookme-engine-api`), com contrato B2B próprio (autenticação via `x-api-key`), banco Postgres dedicado, e rodando em porta independente (`:3111`, banco `:5433`).

O CookMe passa a ser **cliente nº 1 da Engine, sem privilégio** — consome a mesma API que qualquer outro cliente consumiria, via `EngineClientService` → `POST /engine/canonizar`.

**Sem fallback para motor local:** se a Engine estiver indisponível, o item volta com `confianca: 0` e `estagio: "pendente"` — honesto, em vez de fingir que resolveu. Canonização é *enriquecimento*, não bloqueio: o cupom ainda é processado.

### Alternativas consideradas

- **Manter dentro do backend CookMe** — descartado: impede o produto B2B; acopla o roadmap de canonização ao do app.
- **Biblioteca compartilhada (pacote npm)** — descartado: não permite clientes em outras linguagens nem cobrança por uso; versionamento vira problema.

## Consequências

- ✅ A Engine pode ser vendida como API independente (CookMe é só o primeiro cliente).
- ✅ Bancos isolados — dados da Engine nunca se misturam com os do CookMe (governança multi-cliente).
- ✅ Contrato explícito e testável; o CookMe não tem atalho privilegiado.
- ⚠️ Mais um serviço para subir/operar no ambiente de dev e em produção.
- ⚠️ Latência de rede na canonização (mitigada por timeout de 3s + degradação graciosa para "pendente").
- 🔗 Setup local agora exige subir a Engine (`:3111`) e seu Postgres (`:5433`) além do CookMe — ver [How-to: Setup Rápido](/how-to/setup-rapido).
