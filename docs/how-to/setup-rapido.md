# Setup Rápido

Suba o ambiente de desenvolvimento completo do CookMe. Este é o **guia canônico** de setup — qualquer outra instrução espalhada pelo repositório está obsoleta.

## Pré-requisitos

- Node.js v18+
- Docker + Docker Compose
- (opcional) Stripe CLI — só para testar pagamentos

## Visão geral da stack

O CookMe roda como **cinco processos**. Em desenvolvimento você sobe cada um num terminal:

| Serviço | Porta | O que é |
| --------- | ------- | --------- |
| PostgreSQL (pgvector) | 5432 | Banco do CookMe — **precisa da extensão `vector`** para o RAG |
| Redis | 6379 | Cache |
| Backend NestJS | 3000 | API REST |
| Engine de canonização | 3111 | Serviço B2B que limpa itens do cupom fiscal ([ADR-0002](/adr/0002-engine-canonizacao-servico-separado)) |
| Postgres da Engine | 5433 | Banco dedicado da Engine (isolado do CookMe) |

Mobile (Expo) e Admin Frontend (Vite) são opcionais, conforme o que você for tocar.

---

## 1. Infraestrutura (bancos + cache)

::: warning IMPORTANTE — use a imagem com pgvector
O RAG de receitas depende da extensão `vector`. Use **`pgvector/pgvector:pg16`**, nunca `postgres:latest` — este último sobe sem a extensão e a geração de receitas via RAG falha silenciosamente. Ver [ADR-0001](/adr/0001-pgvector-para-rag).
:::

### Banco + cache do CookMe

```bash
# PostgreSQL com pgvector (porta 5432)
docker run -d --name cookme_postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=cookme \
  -e POSTGRES_PASSWORD=cookme123 \
  -e POSTGRES_DB=cookme_db \
  pgvector/pgvector:pg16

# Redis (porta 6379)
docker run -d --name cookme_redis -p 6379:6379 redis:7-alpine
```

Aguarde ~10s e confirme:

```bash
docker exec cookme_postgres pg_isready -U cookme   # accepting connections
docker exec cookme_redis redis-cli ping            # PONG
```

### Banco da Engine de canonização

```bash
cd /home/eduardo/projetos/cookme-engine-api
docker compose up -d          # sobe postgres-food-canonizer na porta 5433
```

---

## 2. Backend do CookMe (novo terminal)

```bash
cd /home/eduardo/projetos/cookme/backend
fuser -k 3000/tcp 2>/dev/null   # libera a porta se estiver em uso
npm run start:dev
```

✅ Esperado: `🚀 Aplicação rodando em: http://localhost:3000`

O `backend/.env` deve conter (valores de dev):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cookme
DB_PASSWORD=cookme123
DB_DATABASE=cookme_db
REDIS_HOST=localhost
REDIS_PORT=6379
ENGINE_API_URL=http://localhost:3111
ENGINE_API_KEY=teste-local-123
```

---

## 3. Engine de canonização (novo terminal)

A Engine limpa os itens do cupom fiscal. Sem ela, o OCR ainda funciona, mas cada item volta como `pendente` (sem nome canônico) — ver [ADR-0002](/adr/0002-engine-canonizacao-servico-separado).

```bash
cd /home/eduardo/projetos/cookme-engine-api

# .env (uma vez): PORT=3111, ENGINE_API_KEY=teste-local-123, DB na porta 5433
npm run migration:run   # aplica migrations (idempotente)
npm run start:prod      # ou start:dev
```

✅ Teste:

```bash
curl -s -X POST http://localhost:3111/engine/canonizar \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: teste-local-123' \
  -d '{"itens":["REFRIG COCA 2L","LEITE ITALAC INT 1L"]}'
```

Deve retornar `refrigerante` e `leite` (marca `Italac`) com confiança ~0.95.

::: tip A chave `x-api-key` do CookMe e da Engine precisa bater
`ENGINE_API_KEY` no `backend/.env` deve ser igual ao `ENGINE_API_KEY` no `.env` da Engine — senão o CookMe recebe `401`.
:::

---

## 4. Stripe Webhook (opcional — só pagamentos)

Necessário apenas para testar checkout/assinaturas em dev. Pule se não for mexer com pagamentos.

```bash
stripe login                       # pré-requisito único
cd /home/eduardo/projetos/cookme/backend
npm run stripe:listen
```

✅ Esperado: `Ready! Your webhook signing secret is whsec_...`

O `whsec_...` exibido deve bater com `STRIPE_WEBHOOK_SECRET` no `backend/.env`. Se a CLI gerar um novo, atualize o `.env` e reinicie o backend. Rota: `POST /api/stripe/webhook`. Em produção a Stripe aponta direto para `api.cookme.com.br`.

---

## 5. Frontend Admin (opcional, novo terminal)

```bash
cd /home/eduardo/projetos/cookme/frontend
npm run dev
```

✅ `Local: http://localhost:5173`

## 6. Mobile (opcional, novo terminal)

```bash
cd /home/eduardo/projetos/cookme/mobile
npx expo start
```

Escaneie o QR com o Expo Go. A API usa IP fixo `192.168.86.9:3000` (ver `mobile/src/services/api.ts`).

---

## Acessar os serviços

| Serviço | URL |
| --------- | ----- |
| Backend | <http://localhost:3000> |
| Swagger (API docs) | <http://localhost:3000/api/docs> |
| Engine canonização | <http://localhost:3111> |
| Frontend admin | <http://localhost:5173> |

## Smoke test da API

```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"teste@email.com","password":"senha123","name":"Teste"}'

# Login → copie o access_token
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"teste@email.com","password":"senha123"}'

# Endpoint protegido
curl http://localhost:3000/api/auth/me -H 'Authorization: Bearer <TOKEN>'
```

---

## Troubleshooting

**Porta em uso (3000 / 3111):**

```bash
fuser -k 3000/tcp 3111/tcp 2>/dev/null
```

**RAG não retorna nada / erro de `vector`:** o Postgres subiu sem pgvector. Confirme a extensão:

```bash
docker exec cookme_postgres psql -U cookme -d cookme_db -c "SELECT extname FROM pg_extension WHERE extname='vector';"
```

Se vier vazio, recrie o container com `pgvector/pgvector:pg16`.

**CookMe recebe 401 da Engine:** `ENGINE_API_KEY` divergente entre os dois `.env`.

**Limpar e recomeçar:**

```bash
docker stop cookme_postgres cookme_redis && docker rm cookme_postgres cookme_redis
# volte ao passo 1
```

---

## Alternativa: Docker Compose

Há um `backend/docker-compose.yml` que sobe Postgres + Redis + pgAdmin de uma vez. Veja o [guia de Docker Compose](/how-to/docker-compose) — atenção ao mesmo aviso sobre a imagem pgvector.
