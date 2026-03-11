# ⚡ Setup Rápido - CookMe

## 🚀 Comece em 2 minutos!

### Pré-requisitos
- Node.js v18+
- Docker instalado

---

## 1️⃣ Iniciar Infraestrutura (60 segundos)

Abra um terminal e execute:

```bash
# Redis
docker run -d -p 6379:6379 --name redis-cookme redis:latest

# PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=cookme123 \
  -e POSTGRES_USER=cookme \
  -e POSTGRES_DB=cookme_db \
  --name postgres-cookme postgres:latest
```

**Aguarde 10 segundos para o PostgreSQL ficar pronto.**

---

## 2️⃣ Iniciar Backend (Novo Terminal)

```bash
cd /home/eduardo/projetos/cookme/backend
npm run start:dev
```

✅ Esperado: Log `🚀 Aplicação rodando em: http://localhost:3000`

---

## 3️⃣ Iniciar Frontend (Novo Terminal)

```bash
cd /home/eduardo/projetos/cookme/frontend
npm run dev
```

✅ Esperado: Log `Local: http://localhost:5173`

---

## 4️⃣ Iniciar Mobile (Novo Terminal)

```bash
cd /home/eduardo/projetos/cookme/mobile
npx expo start
```

✅ Esperado: Mostra QR code para escanear com Expo app

---

## 📍 Acessar Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Backend** | http://localhost:3000 | API REST |
| **Swagger** | http://localhost:3000/api/docs | Documentação interativa |
| **Frontend** | http://localhost:5173 | Aplicação web |
| **Mobile** | Scan QR no terminal | Aplicação mobile |

---

## 🧪 Testar API (Postman/Insomnia)

### 1. Registrar usuário
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "teste@email.com",
  "password": "senha123",
  "name": "Teste"
}
```

### 2. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "teste@email.com",
  "password": "senha123"
}
```

**Copie o `access_token` retornado**

### 3. Testar endpoint protegido
```
GET http://localhost:3000/api/auth/me
Authorization: Bearer {seu_token}
```

---

## 🆘 Troubleshooting

### Port 3000 em uso?
```bash
# Encontrar processo
lsof -i :3000
# Matar processo
kill -9 <PID>
```

### PostgreSQL não conecta?
```bash
docker exec postgres-cookme pg_isready
# Esperado: accepting connections
```

### Redis não responde?
```bash
docker exec redis-cookme redis-cli ping
# Esperado: PONG
```

### Limpar tudo e recomeçar?
```bash
# Parar containers
docker stop redis-cookme postgres-cookme

# Remover containers
docker rm redis-cookme postgres-cookme

# Voltar ao passo 1️⃣
```

---

## 📚 Documentação Completa

Leia [LEIA_PRIMEIRO.md](LEIA_PRIMEIRO.md) para mais detalhes.

---

## ✅ Checklist Final

- [ ] Docker rodando (Redis + PostgreSQL)
- [ ] Backend respondendo em localhost:3000
- [ ] Frontend aberto em localhost:5173
- [ ] Mobile iniciando no terminal
- [ ] Conseguiu fazer login no Postman
- [ ] Acessou http://localhost:3000/api/docs

**Pronto! 🎉**
