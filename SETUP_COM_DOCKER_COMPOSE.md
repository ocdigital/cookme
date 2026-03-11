# ⚡ Setup com Docker Compose (SUPER RÁPIDO!)

## 🚀 Comece em 1 minuto!

### Pré-requisitos
- Docker e Docker Compose instalados

---

## 1️⃣ Inicie a infraestrutura (30 segundos)

```bash
docker-compose up -d
```

✅ Isso inicia:
- PostgreSQL (porta 5432)
- Redis (porta 6379)

**Aguarde ~5 segundos para PostgreSQL ficar pronto:**
```bash
docker-compose ps
# Ambos devem estar com status "healthy"
```

---

## 2️⃣ Abra 3 novos terminais e inicie as aplicações

**Terminal 1 - Backend:**
```bash
cd backend && npm run start:dev
```
✅ Esperado: Log `🚀 Aplicação rodando em: http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```
✅ Esperado: Log `Local: http://localhost:5173`

**Terminal 3 - Mobile:**
```bash
cd mobile && npx expo start
```
✅ Esperado: QR code para escanear

---

## 📍 Acessar Serviços

| Serviço | URL |
|---------|-----|
| **Backend** | http://localhost:3000 |
| **Swagger** | http://localhost:3000/api/docs |
| **Frontend** | http://localhost:5173 |
| **Mobile** | Scan QR code |

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

### Ver logs dos containers
```bash
docker-compose logs -f postgres      # PostgreSQL logs
docker-compose logs -f redis         # Redis logs
```

### PostgreSQL não conecta?
```bash
docker-compose ps
# Deve mostrar status "healthy"

# Se não:
docker-compose restart postgres
```

### Redis não responde?
```bash
docker-compose exec redis redis-cli ping
# Esperado: PONG
```

### Limpar tudo e recomeçar
```bash
# Parar containers
docker-compose down

# Remover volumes (ATENÇÃO: deleta dados!)
docker-compose down -v

# Reiniciar
docker-compose up -d
```

### Ver status
```bash
docker-compose ps
```

---

## 🎯 Fluxo Completo de Setup

```bash
# 1. Clone ou navegue para o diretório
cd /home/eduardo/projetos/cookme

# 2. Inicie infraestrutura
docker-compose up -d

# 3. Em novo terminal: Backend
cd backend && npm run start:dev

# 4. Em novo terminal: Frontend
cd frontend && npm run dev

# 5. Em novo terminal: Mobile
cd mobile && npx expo start

# 6. Abra no browser
# http://localhost:5173 (frontend)
# http://localhost:3000/api/docs (swagger)
```

---

## ✅ Checklist Final

- [ ] Docker rodando (`docker-compose ps` mostra "healthy")
- [ ] Backend respondendo em localhost:3000
- [ ] Frontend aberto em localhost:5173
- [ ] Mobile iniciando no terminal
- [ ] Conseguiu fazer login no Postman
- [ ] Acessou http://localhost:3000/api/docs

**Pronto! 🎉**

---

## 📚 Próximas Etapas

1. Teste endpoints no Postman
2. Leia [ENDPOINTS_E_PORTAS.md](ENDPOINTS_E_PORTAS.md) para referência
3. Explore [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) para arquitetura
4. Leia documentação específica de cada módulo

---

## 💡 Pro Tips

### Iniciar tudo de uma vez (em uma linha)
```bash
docker-compose up -d && \
cd backend && npm run start:dev &
cd ../frontend && npm run dev &
cd ../mobile && npx expo start &
```

### Ver estado em tempo real
```bash
# Terminal separado
watch -n 1 'docker-compose ps'
```

### Parar tudo sem perder dados
```bash
docker-compose stop
# Para reiniciar depois
docker-compose start
```

---

**Dica:** Coloque estes 3 comandos em sua barra de favoritos do terminal!

```bash
# Iniciar
docker-compose up -d

# Status
docker-compose ps

# Parar
docker-compose down
```
