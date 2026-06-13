# CookMe — Backlog de Funcionalidades Desativadas

Features implementadas mas desativadas por falta de dados ou maturidade. Reativar quando os pré-requisitos estiverem prontos.

---

## GBrain — Memória e Busca Vetorial para Agentes IA

**Status:** Avaliar quando banco tiver 10.000+ receitas e matching atual mostrar limitação  
**Repo:** https://github.com/garrytan/gbrain (MIT — uso comercial livre)

### O que é

Sistema de memória para agentes IA com busca híbrida (vetorial + keyword + reranking), grafo de conhecimento e síntese de respostas com citações. Stack TypeScript + PostgreSQL + pgvector — 100% compatível com CookMe.

### Onde encaixaria no CookMe

| Feature | Aplicação |
|---------|-----------|
| Busca vetorial (pgvector) | "Receitas parecidas com essa" — similaridade semântica de ingredientes |
| Grafo de conhecimento | Relação produto → receita → preferência do usuário |
| Memória de agente | Contexto persistido entre sessões (avaliações influenciando sugestões futuras) |
| Síntese com citações | Explicar "por que essa receita foi sugerida" |

### Por que não agora

CookMe já tem `AprendizadoService`, `MOIEngineService` e `ReceitaBancoService` cobrindo recomendação e matching. GBrain resolve um problema que só aparece em escala — adicionar agora seria over-engineering sem retorno imediato.

### Gatilho para reavaliar

- Banco com 10.000+ receitas e busca por ingredientes ficando lenta ou imprecisa
- Usuários pedindo "receitas parecidas com X" (busca semântica)
- Necessidade de explicar o motivo das recomendações (transparência de IA)

---

## Monetização — Estratégia (sem propaganda explícita)

Dois modelos complementares que preservam UX. Implementar quando tiver base de usuários.

### Modelo 1 — Dados Agregados B2B

**O que é:** venda de insights anonimizados e agregados, nunca dados individuais.

**Por que é valioso:** CookMe coleta preço real pago pelo consumidor final via OCR de cupom fiscal. Supermercados escondem esse dado entre si. IBGE faz pesquisa manual cara e lenta. CookMe coleta em escala automaticamente.

**Produtos possíveis:**
- Preço médio de produto por cidade/estado/período ("frango peito R$19,80/kg em SP na semana passada")
- Índice de inflação alimentar em tempo real por região
- Padrão de consumo por perfil (fitness, vegetariano, família)
- Benchmark de preço para redes de varejo

**Quem paga:** fintechs, comparadores de preço, institutos de pesquisa, redes de supermercado, marcas de alimentos, governo (IPCA alimentar).

**O que já existe no CookMe:**
- `compra_itens.valor_unitario` — preço por produto já salvo
- Tela `comparacao/` no mobile já existe
- CNPJ do estabelecimento no cupom → cruzar com Receita Federal para geolocalizar compra

**Pré-requisito principal:** geocodificação da compra via CNPJ do cupom fiscal.

---

### Modelo 2 — Patrocínio Nativo de Marcas

**O que é:** marca paga para aparecer como sugestão contextual, não como banner.

**Formatos que não destroem UX:**
- Ingrediente na receita com sugestão de marca + preço + onde comprar: "2 latas de creme de leite — Nestlé disponível no Pão de Açúcar por R$4,90"
- Receita patrocinada aparece em destaque quando usuário tem ingredientes da marca na despensa
- "Adicionar à lista" com produto de marca específica (CPA — custo por ação)
- Seção "Receitas com Quaker" no feed fitness

**Regra de ouro:** marca aparece como opção útil, nunca como obrigação. Nunca forçar marca específica como ingrediente da receita — usuário percebe e perde confiança.

**Modelo de cobrança:**
| Formato | Métrica |
|---------|---------|
| Produto sugerido na lista de compras | CPM (por impressão) |
| Receita patrocinada no feed | CPC (por clique) |
| "Adicionar à lista" com marca | CPA (por ação) |

---

### Combinação dos dois modelos

```
Usuário usa o app gratuitamente
    ↓
Gera dados de compra/preferência via OCR
    ↓
Marcas pagam por placement contextual (Modelo 2)
    ↓
Dados agregados viram produto B2B (Modelo 1)
```

Receita dupla sem propaganda explícita. Mesmo modelo de Nubank, iFood, Rappi — o app é o produto, os dados são o negócio real.

---

## Filtro Regional de Receitas

**Status:** Desativado em 2026-05-17  
**Tag nos arquivos:** `REGIONAL_FILTER_DISABLED`

### O que está implementado

- **Backend** — `planejamento.service.ts` → `gerarAleatoria(userId, semana, apenasRegional)`:
  - Lê `pref.regiao_culinaria` do usuário
  - Quando `apenasRegional=true`, filtra `todasReceitas` por `r.regiao_origem === regiaoUser || 'nacional'`
  - `scorearReceitas()` já pontua receitas regionais (+35), tradições do dia (+25), categoria (+10)

- **Backend** — `planejamento.controller.ts` → `POST /planejamento/semana/:semana/aleatorio`:
  - Aceita `body.apenas_regional: boolean` (ainda ativo, endpoint não mudou)

- **Mobile** — `semana.tsx`:
  - UI card com `Switch` + texto de região/estado
  - Busca `GET /usuarios/preferencias` para ler `estado` e `regiao_culinaria`
  - Passa `apenasRegional` para `gerarAleatoria` do hook

- **Mobile** — `settings.tsx`:
  - Seletor de estado com mapeamento `ESTADO_REGIAO` → `regiao_culinaria` (norte/nordeste/etc)
  - `salvarPref({ estado, regiao_culinaria })` ao selecionar estado (ainda funciona)

- **Entidades**:
  - `Receita.regiao_origem` — string (norte, nordeste, sudeste, sul, centro_oeste, nacional)
  - `Receita.dias_semana_tradicionais` — array (segunda, terca…) para scoring de dia
  - `PreferenciaUsuario.regiao_culinaria` e `.estado`
  - `Produto.regional` — string de região de origem

### Por que foi desativado

Banco de receitas atual tem `regiao_origem = null` em quase todas as receitas scraped do TudoGostoso. O filtro seria aplicado mas retornaria vazio ou conjunto aleatório sem significado regional real.

### Pré-requisitos para reativar

1. Alimentar `regiao_origem` nas receitas — opções:
   - Campo manual no admin para editar receitas em lote
   - IA classifica região a partir do título/ingredientes (ex: "feijão tropeiro" → sudeste/centro-oeste)
   - Scraper dedicado por categoria regional do TudoGostoso (ex: `/categorias/culinaria-nordestina`)

2. Mínimo de ~20 receitas por região para o filtro ter sentido

3. Reativar no mobile: descomentando blocos `REGIONAL_FILTER_DISABLED` em `semana.tsx`

4. Reativar no backend: descomentando bloco `REGIONAL_FILTER_DISABLED` em `planejamento.service.ts`

### Arquivos afetados

| Arquivo | O que está comentado |
|---|---|
| `mobile/app/(app)/(tabs)/semana.tsx` | States, useEffect, JSX do card, estilos |
| `backend/src/modules/planejamento/planejamento.service.ts` | Lógica do filtro em `gerarAleatoria` |
| `mobile/app/(app)/settings.tsx` | Nada — seletor de estado continua ativo (salva preferência para uso futuro) |
| `mobile/src/services/planejamento.service.ts` | Nada — `apenas_regional` ainda passado mas sempre `false` |
