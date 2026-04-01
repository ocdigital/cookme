# ⚡ Quick Start - CookMe

Três maneiras de iniciar o projeto (escolha a que preferir):

## 1️⃣ Automática (RECOMENDADO) ⭐

Script completo que cuida de TUDO automaticamente:

```bash
./startup.sh
```

**O que faz:**
- ✅ Inicia Docker (PostgreSQL + Redis)
- ✅ Instala dependências (se necessário)
- ✅ Inicia Backend (NestJS)
- ✅ Inicia Frontend (Vite React)
- ✅ Inicia Mobile (Expo React Native)
- ✅ Mostra status e logs

**Comandos úteis:**
```bash
./startup.sh --status      # Ver status dos serviços
./startup.sh --stop        # Parar tudo
./startup.sh --logs        # Ver logs
./startup.sh --help        # Ajuda completa
```

👉 **Veja:** [STARTUP_SCRIPT.md](STARTUP_SCRIPT.md)

---

## 2️⃣ Ultra-Rápido

Script minimalista para iniciar tudo em uma única linha:

```bash
./start.sh
```

**Mais simples possível:**
```bash
# Tudo em paralelo
docker-compose up -d
npm --prefix backend run start:dev &
npm --prefix frontend run dev &
npm --prefix mobile expo start &
```

---

## 3️⃣ Manual (Terminal por Serviço)

**Terminal 1: Docker**
```bash
docker-compose up -d
# Inicia PostgreSQL (5432) e Redis (6379)
```

**Terminal 2: Backend**
```bash
cd backend
npm install
npm run start:dev
# Inicia em http://localhost:3000
```

**Terminal 3: Frontend**
```bash
cd frontend
npm install
npm run dev
# Inicia em http://localhost:5173
```

**Terminal 4: Mobile**
```bash
cd mobile
npm install
npx expo start
# Escaneie QR code com Expo Go
```

---

## 📍 Acessar Serviços

Após executar qualquer uma das opções acima:

| Serviço | URL | Porta |
|---------|-----|-------|
| **Backend API** | http://localhost:3000 | 3000 |
| **Swagger Docs** | http://localhost:3000/api/docs | 3000 |
| **Frontend** | http://localhost:5173 | 5173 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |
| **Mobile** | Expo Go | 8081 |

---

## 🐛 Troubleshooting Rápido

### "Porta já em uso"
```bash
lsof -i :3000        # Encontrar processo
kill -9 <PID>        # Matar processo
./startup.sh         # Reiniciar
```

### "Docker não está rodando"
```bash
# Linux
sudo systemctl start docker

# macOS
open /Applications/Docker.app

# Depois:
./startup.sh
```

### "Banco de dados não conecta"
```bash
docker exec postgres-cookme pg_isready
docker logs postgres-cookme
```

### "Limpar e começar do zero"
```bash
./startup.sh --stop
./startup.sh --clean
rm -rf */node_modules
./startup.sh
```

---

## 📊 Ver Status

```bash
./startup.sh --status
```

Exemplo de output:
```
Docker:    ✅ PostgreSQL rodando (5432)
           ✅ Redis rodando (6379)
Backend:   ✅ Rodando em http://localhost:3000
Frontend:  ✅ Rodando em http://localhost:5173
Mobile:    ✅ Rodando
```

---

## 📋 Ver Logs

```bash
# Backend
tail -f .backend.log

# Frontend
tail -f .frontend.log

# Mobile
tail -f .mobile.log

# Todos simultaneamente
tail -f .*.log
```

---

## 🔐 Credenciais

```
Database:    cookme_db
Username:    cookme
Password:    cookme123
```

---

## 💡 Dicas

### Durante Desenvolvimento

1. Deixe `./startup.sh` rodando em um terminal
2. Faça alterações nos arquivos
3. Serviços recarregam automaticamente:
   - Backend: HMR (npm run start:dev)
   - Frontend: Vite HMR
   - Mobile: Expo Fast Refresh

### Resetar Banco de Dados

```bash
docker-compose down -v
./startup.sh
```

### Reinstalar Dependências

```bash
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
./startup.sh
```

---

## 🎯 Próximos Passos

1. ✅ Executar `./startup.sh`
2. ✅ Abrir http://localhost:5173 (Frontend)
3. ✅ Testar http://localhost:3000/api/docs (Backend)
4. ✅ Escanear QR code no Mobile

---

## 📚 Documentação Completa

- **Startup Script Avançado:** [STARTUP_SCRIPT.md](STARTUP_SCRIPT.md)
- **Backend (NestJS):** [backend/README.md](backend/README.md)
- **Frontend (React):** [frontend/README.md](frontend/README.md)
- **Mobile (Expo):** [mobile/README.md](mobile/README.md)
- **Primeira Vez?** [LEIA_PRIMEIRO.md](LEIA_PRIMEIRO.md)

---

**Comece agora:** `./startup.sh` 🚀
