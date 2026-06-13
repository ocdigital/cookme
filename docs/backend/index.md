# Backend — Visão Geral

NestJS 11 + TypeScript + TypeORM + PostgreSQL. Porta **3000**. API prefix `/api`.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | NestJS 11 |
| ORM | TypeORM |
| Banco | PostgreSQL 5432 |
| Auth | JWT (access + refresh token) |
| Cache | `@nestjs/cache-manager` |
| WebSocket | Socket.io (`/notificacoes`) |
| IA — Receitas | Anthropic Claude → Gemini → mock |
| IA — OCR | Gemini Vision API (`gemini-2.5-flash`) |
| IA — Classificação | Gemini (cache compartilhado entre usuários) |
| Scraping | Puppeteer (imagens Freepik + TudoGostoso) |
| Pagamentos | Stripe (checkout, portal, webhook) |
| Rate limiting | `@nestjs/throttler` (rate `ia`: 10 req/min) |
| Upload | Multer in-memory (avatares, imagens) |

## Conteúdo

- [Todos os Endpoints](/backend/api) — referência completa da API
- [Entidades TypeORM](/backend/entidades) — schema do banco de dados

## Iniciar

```bash
cd backend
fuser -k 3000/tcp 2>/dev/null
npm run start:dev
```

## Variáveis de Ambiente

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cookme
DB_PASSWORD=cookme123
DB_DATABASE=cookme_db
JWT_SECRET=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
FRONTEND_URL=http://localhost:4000
STRIPE_SECRET_KEY=...
STRIPE_PRICE_PREMIUM_MENSAL=...
STRIPE_PRICE_PREMIUM_ANUAL=...
STRIPE_PRICE_FAMILIA=...
```

## Módulos

| Módulo | Path | Responsabilidade |
|--------|------|-----------------|
| `auth` | `src/modules/auth` | JWT login/registro/refresh/logout, Google OAuth, Apple Sign In |
| `usuarios` | `src/modules/usuarios` | Perfil, preferências, avatar, push token |
| `produtos` | `src/modules/produtos` | Catálogo de produtos, marcas, categorias, imagens |
| `inventario` | `src/modules/inventario` | Despensa do usuário, vencimentos, stats, importação automática |
| `receitas` | `src/modules/receitas` | Banco de receitas, geração IA, OCR, favoritos, execução |
| `planejamento` | `src/modules/planejamento` | Planejamento semanal (semanas 1-4), geração aleatória |
| `listas` | `src/modules/listas` | Lista de compras: CRUD lista + itens, arquivar, duplicar |
| `compras` | `src/modules/compras` | Histórico OCR cupom fiscal, estatísticas de gastos |
| `notificacoes` | `src/modules/notificacoes` | WebSocket + push notifications, 7 triggers |
| `product-classification` | `src/modules/product-classification` | Classificação IA (Gemini), cache aprendizado compartilhado |
| `admin` | `src/modules/admin` | APIs admin: usuários, produtos, receitas, seeds, moderação |
| `scraper` | `src/modules/scraper` | Scraping TudoGostoso |
| `barcode` | `src/modules/barcode` | Lookup produto por código de barras |
| `ia` | `src/modules/ia` | Endpoints IA genéricos: classificar, gerar receita, sugerir compras |
| `stripe` | `src/modules/stripe` | Planos, checkout, portal, webhook |
| `affiliate` | `src/modules/affiliate` | Assinaturas (FREE/PREMIUM/PREMIUM_PLUS), transações |
| `audit-log` | `src/modules/audit-log` | Log de auditoria de ações admin |
| `comparacoes` | `src/modules/comparacoes` | Comparação de preços de produtos |
| `upload` | `src/modules/upload` | Upload de imagens (avatares, receitas) |
| `health` | `src/modules/health` | Health check endpoint |

## Padrões e Gotchas TypeORM

- `simple-array` (ex: `tags_dieta`) armazena como CSV — **não filtrar com LIKE no SQL**, filtrar em JS após `find()`
- Coluna `senha` (não `senha_hash`) na tabela `usuarios`
- Coluna `unidade_padrao` (não `unidade_medida`) na tabela `produtos`
- Inventário: unique constraint em `(usuario_id, produto_id, data_validade)` — checar `data_validade IS NULL`
- Port já em uso: `fuser -k 3000/tcp` antes de reiniciar

## Guards e Decorators

| Item | Uso |
|------|-----|
| `@Public()` | Remove JwtAuthGuard da rota |
| `@CurrentUser()` | Injeta entidade `Usuario` do JWT |
| `@UseGuards(JwtAuthGuard)` | Protege rota (global por padrão no app) |
| `@Throttle({ ia: {...} })` | Rate limit customizado para rotas IA |

## Planos de Assinatura

| Plano | Preço | Features |
|-------|-------|---------|
| `free` | R$0 | receitas básicas, inventário, busca |
| `premium` | R$9,90/mês | + vídeos HD, receitas ilimitadas, recomendações personalizadas |
| `premium_plus` | R$19,90/mês | + consultoria nutricional, plano personalizado, relatórios |
| Stripe: `premium_mensal` | mensal | — |
| Stripe: `premium_anual` | anual | — |
| Stripe: `familia` | família | — |

## Seeds

```bash
cd backend

# Receitas de exemplo (mock)
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-receitas.ts

# 5 usuários de teste
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-usuarios-teste.ts

# Popula banco via scraping TudoGostoso (requer backend rodando)
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-popular-banco.ts
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-popular-banco.ts normal fitness
```

## Usuários de Teste (senha: `cookme123`)

| Email | Nome | Modo |
|-------|------|------|
| `joao@cookme.test` | João Silva | normal |
| `ana@cookme.test` | Ana Fitness | fitness |
| `carlos@cookme.test` | Carlos Vegetariano | vegetariano |
| `maria@cookme.test` | Maria Vegana | vegano |
| `pedro@cookme.test` | Pedro Normal | normal |

## Testes

```bash
npm test              # Jest unit tests (~52 testes, ~4s)
npm run test:e2e      # E2E (requer DB rodando)
```
