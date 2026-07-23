# CookMe — Comandos de Serviços

Todos os comandos rodam a partir de `/home/eduardo/projetos/cookme/` salvo indicação.

---

## Iniciar tudo de uma vez

```bash
bash start.sh
```

Sobe Docker (postgres + redis), backend, frontend e mobile em background.
Logs em `.backend.log`, `.frontend.log`, `.mobile.log`.

---

## Docker (Postgres + Redis)

| Ação | Comando |
| ------ | --------- |
| Subir | `docker compose up -d postgres redis` |
| Parar | `docker compose stop postgres redis` |
| Derrubar (remove containers) | `docker compose down` |
| Status | `docker compose ps` |
| Logs | `docker compose logs -f postgres` |

Containers: `postgres-cookme` (porta 5432), `redis-cookme` (porta 6379).

---

## Backend (NestJS — porta 3000)

```bash
# Iniciar (dev com hot-reload)
cd backend && npm run start:dev

# Build de produção
cd backend && npm run build

# Parar — matar processo na porta
fuser -k 3000/tcp
```

---

## Frontend Admin (Vite — porta 5173)

```bash
# Iniciar
cd frontend && npm run dev

# Parar
fuser -k 5173/tcp
```

---

## Mobile (Expo — porta 8081)

```bash
# Iniciar (limpa cache)
cd mobile && npx expo start -go --clear

# Parar
fuser -k 8081/tcp
```

Após iniciar, escaneie o QR code com **Expo Go** no celular.

---

## Matar portas travadas

```bash
fuser -k 3000/tcp   # backend
fuser -k 5173/tcp   # frontend
fuser -k 8081/tcp   # expo
fuser -k 5432/tcp   # postgres (cuidado)
fuser -k 6379/tcp   # redis (cuidado)
```

---

## Seeds e utilitários

```bash
# Seed de receitas
cd backend && npx ts-node src/database/seeds/seed-receitas.ts

# Seed de datas de validade no inventário
cd backend && npx ts-node src/database/seeds/seed-validades.ts

# Rodar testes
cd backend && npm test

# Verificar logs em tempo real
tail -f .backend.log
tail -f .frontend.log
tail -f .mobile.log
```

---

## Endereços

| Serviço | URL |
| --------- | ----- |
| Backend API | <http://localhost:3000> |
| Frontend Admin | <http://localhost:5173> |
| Expo DevTools | <http://localhost:8081> |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

IP fixo para Expo Go no celular: `192.168.86.9:3000`
