# CookMe — Contexto para Claude Code

## O que é o CookMe

App mobile de gestão de cozinha inteligente. Usuário fotografa nota fiscal → sistema reconhece ingredientes → gera receitas baseadas no que tem em casa → gerencia planejamento semanal e lista de compras.

Stack: NestJS 11 + TypeScript + TypeORM + PostgreSQL (backend), Expo/React Native (mobile), Next.js (admin frontend).

---

## Estrutura de Diretórios

```
/home/eduardo/projetos/cookme/
├── backend/           # NestJS API na porta 3000
├── mobile/            # Expo Go app (IP fixo 192.168.86.9:3000)
├── frontend/          # Next.js admin panel na porta 4000
├── docs/              # VitePress docs
├── BACKLOG.md         # Features desabilitadas / roadmap
└── CLAUDE.md          # Este arquivo
```

---

## Backend (NestJS 11)

### Iniciar
```bash
cd backend
fuser -k 3000/tcp 2>/dev/null; npm run start:dev
```

### Módulos principais
| Módulo | Path | Responsabilidade |
|--------|------|-----------------|
| `auth` | `src/modules/auth` | JWT login/registro, guards |
| `usuarios` | `src/modules/usuarios` | Perfil, preferências |
| `produtos` | `src/modules/produtos` | Catálogo de produtos/ingredientes |
| `inventario` | `src/modules/inventario` | Estoque do usuário |
| `receitas` | `src/modules/receitas` | Receitas, geração IA, scraping |
| `planejamento` | `src/modules/planejamento` | Planejamento semanal |
| `listas` | `src/modules/listas` | Lista de compras |
| `compras` | `src/modules/compras` | Histórico de compras/OCR |
| `notificacoes` | `src/modules/notificacoes` | WebSocket + push notifications |
| `product-classification` | `src/modules/product-classification` | Classificação IA (Gemini) |
| `admin` | `src/modules/admin` | APIs admin |
| `scraper` | `src/modules/scraper` | Scraping TudoGostoso |

### Entidades principais

**Receita** (`receitas/entities/receita.entity.ts`):
- `tags_dieta: string[]` — `simple-array` (CSV no banco) — filtros: `fitness`, `vegetariano`, `vegano`
- `regiao_origem: string` — filtro regional (DESATIVADO, ver BACKLOG.md)
- `categoria_receita: string` — `almoco` | `jantar`
- `status_moderacao: string` — `ok` | `pendente` | `rejeitado`
- `imagem_url: string` — buscada via Puppeteer/Freepik

**Preferencia** (`usuarios/entities/preferencia.entity.ts`):
- `modo_alimentar: 'normal' | 'fitness' | 'vegetariano' | 'vegano'`
- `refeicoes_planejamento: 'almoco_jantar' | 'almoco' | 'jantar'`
- `regiao_culinaria: string` — estado/região (para filtro regional futuro)

**PlanejamentoSemanal** (`planejamento/entities/planejamento-semanal.entity.ts`):
- `numero_semana: number` — semana do mês (1-4)
- `dia_semana: number` — 0=domingo … 6=sábado
- `tipo_refeicao: 'almoco' | 'jantar'`
- `feita: boolean`, `avaliacao: number`

### Endpoints chave
```
POST   /auth/login
POST   /auth/register
GET    /usuarios/preferencias
PATCH  /usuarios/preferencias

GET    /receitas/disponiveis          # lista com modo_alimentar aplicado
POST   /receitas/gerar                # gera via IA (Claude/Gemini)
POST   /receitas/popular-banco        # popula banco com TudoGostoso (admin, legado)
POST   /admin/receitas/popular-banco        # popula todos os modos (body: {modos?: string[]})
POST   /admin/receitas/popular-banco/:modo  # popula um modo: normal|fitness|vegetariano|vegano

GET    /planejamento?semana=N
POST   /planejamento/gerar-aleatoria  # gera semana completa respeitando modo_alimentar
PATCH  /planejamento/:id/feita

GET    /inventario
POST   /inventario

GET    /listas
POST   /listas
GET    /listas/:id

GET    /compras                       # histórico OCR
POST   /compras/upload-nota           # upload nota fiscal
```

### Scraping TudoGostoso
- `TudoGostosoScraperService` — scrapa receitas individuais
- `RecipeSearchService` — agrega por keyword ou categoria
  - `buscarReceitasFitness(n)` — URL `/categorias/1340-fitness`
  - `buscarReceitasVegetarianas(n)` — keyword `"receita vegetariana"`
  - `buscarReceitasVeganas(n)` — keyword `"receita vegana"`
- `RecipeGeneratorService.popularModoAlimentar(modo)` — popula banco (30 fitness, 30 veg, 20 vegano)
- Imagens: Puppeteer/Freepik → fallback Google → fallback Unsplash

### ⚠️ Gotchas TypeORM / PostgreSQL
- `simple-array` armazena como CSV — **não filtrar com LIKE no SQL**, filtrar em JS depois do `find()`
- Coluna `senha` (não `senha_hash`) na tabela `usuarios`
- Coluna `unidade_padrao` (não `unidade_medida`) na tabela `produtos`
- Inventário: unique constraint em `(usuario_id, produto_id, data_validade)` — checar `data_validade IS NULL`
- Port já em uso: `fuser -k 3000/tcp` antes de reiniciar

---

## Mobile (Expo / React Native)

### Iniciar
```bash
cd mobile && npx expo start
```
API: `http://192.168.86.9:3000` (IP fixo para Expo Go — ver `services/api.ts`)

### Telas (Bottom Tabs)
| Tab | Arquivo | Descrição |
|-----|---------|-----------|
| Home | `(tabs)/index.tsx` | Carousel hero, receitas disponíveis, receita do dia |
| Receitas | `(tabs)/receitas.tsx` | Lista completa de receitas com busca e filtros |
| Despensa | `(tabs)/despensa.tsx` | Inventário do usuário |
| Semana | `(tabs)/semana.tsx` | Planejamento semanal |
| Listas | `(tabs)/listas.tsx` | Lista de compras |

### Telas extras
- `settings.tsx` — Preferências: modo_alimentar, refeições, notificações
- `perfil.tsx` — Perfil do usuário
- `receita/[id].tsx` — Detalhe da receita
- `receita-ocr.tsx` — Scan de nota fiscal
- `validacao.tsx` — Validação de produtos do OCR

### Modo Alimentar — integração mobile
- **Home (`index.tsx`)**: badge "Modo fitness ativo" quando `modoAlimentar !== 'normal'`, link para settings
- **Receitas (`receitas.tsx`)**: estado `modoAlimentar` lido da resposta da API
- **Semana (`semana.tsx`)**: `gerarAleatoria` chama backend que já aplica filtro
- **Settings (`settings.tsx`)**: seleção com `ModoAlimentarCard` (4 opções visuais), salva via PATCH

### Design System
- Arquivo: `constants/theme.ts`
- Cores: `C.green[*]` (primária), `C.ink[*]` (neutros)
- `C.green[600]` = cor principal do app
- Typography: `T.h1`, `T.h2`, `T.h3`, `T.body`, `T.small`, `T.micro`
- `shadows.sm`, `shadows.md`, `shadows.modal`
- `radius.sm`, `radius.md`, `radius.lg`, `radius.xl`

---

## Admin Frontend (Next.js)

Porta 4000. Páginas: Dashboard, Usuários, Produtos, Receitas, Analytics.
Auth: JWT token no header. API base: `http://localhost:3000`.

---

## Banco de Dados (PostgreSQL)

```
host: localhost:5432
user: cookme
password: cookme123
database: cookme_db
```

### Seeds disponíveis
```bash
# Popula banco com receitas TudoGostoso (todos os modos — requer backend rodando)
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-popular-banco.ts
# Apenas modos específicos:
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-popular-banco.ts normal fitness

# Receitas de exemplo (mock, não scraping)
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-receitas.ts

# 5 usuários de teste com ingredientes
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-usuarios-teste.ts
```

**Usuários de teste** (senha: `cookme123`):
| Email | Nome | Modo |
|-------|------|------|
| joao@cookme.test | João Silva | normal |
| ana@cookme.test | Ana Fitness | fitness |
| carlos@cookme.test | Carlos Vegetariano | vegetariano |
| maria@cookme.test | Maria Vegana | vegano |
| pedro@cookme.test | Pedro Normal | normal |

---

## Sistemas especiais

### Classificação de Produtos (IA)
- `ProductClassificationService` usa Gemini AI
- Cache `product_knowledge_base` compartilhado entre usuários
- Confiança < 75%: botões Sim/Não no mobile
- Confiança ≥ 75%: auto-confirmado (badge verde)

### Notificações
- WebSocket via Socket.io no namespace `/notificacoes`
- Fallback: polling 30s (Bell) / 15s (página)
- 6 triggers: `receitaDenunciada`, `novoUsuario`, `usuarioInativo`, `produtoIncompleto`, `erroSistema`, `limiteRecursos`
- **Remover antes do deploy**: `POST /notificacoes/test/trigger`

### Geração de Receitas IA
- Cadeia: Claude API → Gemini → mock recipes
- Endpoint: `POST /receitas/gerar` com `ingredientes[]` no body
- `RecipeGeneratorService` no backend

---

## cookme-ai-service — Microsserviço Python (PRÓXIMO PASSO)

Novo microsserviço independente em Python para geração inteligente de receitas via LLM.
Substitui/estende o `RecipeGeneratorService` atual do NestJS.

### Arquitetura

```
NestJS backend (porta 3000)
    └── POST /receitas/gerar
            ↓  invoke
    AWS Lambda (cookme-ai-service)
            ↓
    FastAPI + LangChain
            ↓
    Anthropic Claude API
            ↓
    JSON: receitas geradas com instruções, substituições, alertas de vencimento
```

### Stack do microsserviço
- **Runtime:** Python 3.12
- **Framework:** FastAPI
- **IA:** LangChain + Anthropic SDK (`anthropic`)
- **Deploy:** AWS Lambda via Serverless Framework (mesmo padrão já usado na AML/V4)
- **Observabilidade:** LangSmith (rastreio de cadeia) + CloudWatch (logs Lambda)
- **Testes:** pytest

### Estrutura de pastas (a criar)
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
├── serverless.yml           # Deploy Lambda
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
  "receitas": [
    {
      "nome": "Arroz com legumes",
      "ingredientes_usados": ["arroz", "cenoura"],
      "ingredientes_faltantes": ["azeite"],
      "instrucoes": "...",
      "tempo_preparo": 30,
      "alertas": ["arroz vence em 9 dias"]
    }
  ]
}
```

### Integração com NestJS
- `RecipeGeneratorService` (já existe em `src/modules/receitas/`) passa a invocar o Lambda
- Manter fallback para Gemini/mock caso Lambda falhe (cadeia já existente: Claude → Gemini → mock)
- Variável de ambiente: `COOKME_AI_LAMBDA_ARN` ou `COOKME_AI_SERVICE_URL`

### Variáveis de ambiente (cookme-ai-service)
```env
ANTHROPIC_API_KEY=...
LANGSMITH_API_KEY=...       # opcional, observabilidade
LANGSMITH_PROJECT=cookme-ai
LOG_LEVEL=INFO
```

### Ordem de implementação
1. Scraper Python modo API (`lib/captcha_manual.py`) — finalizar antes de iniciar este serviço
2. Setup FastAPI local + modelo Pydantic input/output
3. LangChain chain básica (sem contexto de vencimento)
4. Prompt engineering: adicionar contexto de modo_alimentar e alertas de vencimento
5. Testes pytest (TDD)
6. Deploy Lambda com Serverless Framework
7. Integrar NestJS: substituir chamada Claude direta pelo invoke Lambda

---

## Features Desabilitadas (ver BACKLOG.md)

### Filtro Regional (`REGIONAL_FILTER_DISABLED`)
- Código comentado em `planejamento.service.ts` e `receitas-usuario.controller.ts`
- Pré-requisitos para reativar: dados de geolocalização, mais receitas regionais no banco, UI de seleção de estado

---

## Variáveis de Ambiente (backend)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cookme
DB_PASSWORD=cookme123
DB_DATABASE=cookme_db
JWT_SECRET=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

---

## Testes

```bash
cd backend && npm test           # Jest unit tests (~52 testes, ~4s)
cd backend && npm run test:e2e   # E2E (requer DB rodando)
```

TDD: escrever testes antes da implementação (preferência do usuário).
