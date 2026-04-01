# 📊 Scripts Overview - CookMe

Guia visual de todos os scripts de startup disponíveis.

## 🎯 Comparação Rápida

```
┌─────────────────────────────────────────────────────────────┐
│              3 FORMAS DE INICIAR O PROJETO                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1️⃣  AUTOMÁTICA (./startup.sh)                             │
│  ✨ Status, logs, health checks - RECOMENDADO              │
│  ✅ Melhor para: Desenvolvimento profissional               │
│  ⏱️  ~5 segundos para estar tudo pronto                     │
│                                                               │
│  2️⃣  ULTRA-RÁPIDA (./start.sh)                             │
│  🚀 Minimalista - apenas inicia serviços                    │
│  ✅ Melhor para: Prototipagem rápida                         │
│  ⏱️  ~3 segundos para estar tudo pronto                     │
│                                                               │
│  3️⃣  MANUAL (4 terminais)                                  │
│  🔧 Controle total - 1 terminal por serviço                 │
│  ✅ Melhor para: Debug e troubleshooting                    │
│  ⏱️  Quanto tempo desejar                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 startup.sh (Automática)

**Recomendado para desenvolvimento profissional**

### ✨ Características

```
✅ Inicia Docker automaticamente
✅ Detecta se serviço já está rodando
✅ Instala dependências automaticamente
✅ Mostra status em tempo real
✅ Health checks para cada serviço
✅ Logging detalhado
✅ Suporta comando individual
✅ Geração automática de logs
```

### 🎛️ Comandos Disponíveis

```bash
./startup.sh                    # Inicia tudo
./startup.sh --status           # Ver status
./startup.sh --stop             # Para tudo
./startup.sh --logs             # Ver logs
./startup.sh --clean            # Limpa Docker

./startup.sh --backend          # Só backend
./startup.sh --frontend         # Só frontend
./startup.sh --mobile           # Só mobile

./startup.sh --stop-backend     # Para só backend
./startup.sh --stop-frontend    # Para só frontend
./startup.sh --stop-mobile      # Para só mobile

./startup.sh --help             # Ajuda
```

### 📊 Output Esperado

```
═══════════════════════════════════════════════════════════
  🚀 CookMe - Inicialização Completa
═══════════════════════════════════════════════════════════

🐳 Iniciando Docker (PostgreSQL + Redis)
ℹ️  Iniciando PostgreSQL...
✅ PostgreSQL iniciado
ℹ️  Iniciando Redis...
✅ Redis iniciado
✅ Docker pronto! (PostgreSQL: 5432, Redis: 6379)

🔧 Iniciando Backend (NestJS)
ℹ️  Iniciando servidor...
✅ Backend rodando em http://localhost:3000 (PID: 12345)

⚛️  Iniciando Frontend (Vite React)
ℹ️  Iniciando servidor...
✅ Frontend rodando em http://localhost:5173 (PID: 12346)

📱 Iniciando Mobile (Expo React Native)
ℹ️  Iniciando Expo dev server...
✅ Mobile rodando (PID: 12347)

═══════════════════════════════════════════════════════════
  ✅ Todos os Serviços Iniciados!
═══════════════════════════════════════════════════════════

📊 Status dos Serviços
Docker:    ✅ PostgreSQL rodando (5432)
           ✅ Redis rodando (6379)
Backend:   ✅ Rodando em http://localhost:3000
Frontend:  ✅ Rodando em http://localhost:5173
Mobile:    ✅ Rodando
```

### 📚 Documentação

👉 **Veja:** [STARTUP_SCRIPT.md](STARTUP_SCRIPT.md)

---

## 🚀 start.sh (Ultra-Rápida)

**Para quem quer simplicidade máxima**

### 📝 Código

```bash
#!/bin/bash
# Versão simplificada: apenas inicia tudo rapidinho
docker-compose up -d postgres redis
npm --prefix backend run start:dev &
npm --prefix frontend run dev &
npm --prefix mobile expo start --clear &
echo "✅ Tudo iniciado!"
```

### ⏱️ Tempo de Execução

- Docker: ~3 segundos
- Backend: ~5 segundos (HMR automático depois)
- Frontend: ~5 segundos (HMR automático depois)
- Mobile: ~5 segundos (Fast Refresh automático depois)
- **Total:** ~30 segundos até estar pronto

### ✅ Quando usar

- ✅ Prototipagem rápida
- ✅ Testes rápidos
- ✅ Desenvolvimento local
- ✅ Ambiente com recursos limitados

---

## 🔧 Manual (4 Terminais)

**Para quem quer controle total**

### Terminal 1: Docker

```bash
docker-compose up -d
# Saída esperada:
# Creating postgres-cookme ... done
# Creating redis-cookme ... done
```

### Terminal 2: Backend

```bash
cd backend
npm install  # (primeira vez)
npm run start:dev
# Saída esperada:
# [Nest] 12345 - 04/01/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12345 - 04/01/2026, 10:00:05 AM     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12345 - 04/01/2026, 10:00:06 AM     LOG [RoutesResolver] AuthController {/api/auth}:
```

### Terminal 3: Frontend

```bash
cd frontend
npm install  # (primeira vez)
npm run dev
# Saída esperada:
# VITE v4.x.x  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Terminal 4: Mobile

```bash
cd mobile
npm install  # (primeira vez)
npx expo start
# Saída esperada:
# Starting Expo CLI...
# ✅ Metro Bundler ready
# ✨ QR code for Expo Go:
# (mostra QR code)
```

### ✅ Quando usar

- ✅ Debug avançado
- ✅ Troubleshooting
- ✅ Monitorar logs específicos
- ✅ Desenvolvimento em múltiplas linguagens

---

## 🎯 Matriz de Decisão

```
Qual script escolher?

┌─────────────────┬──────────────────┬─────────────────┬──────────────────┐
│   CENÁRIO       │   Automática     │   Ultra-Rápida  │     Manual       │
├─────────────────┼──────────────────┼─────────────────┼──────────────────┤
│ Primeira vez    │ ✅ Perfeito      │ ❌ Não          │ ⚠️  Complexo     │
│ Prod. Rápida    │ ✅ Excelente     │ ✅ Ótimo        │ ❌ Lento          │
│ Desenvolvimento │ ✅ Recomendado   │ ✅ Bom          │ ⚠️  Possível      │
│ Troubleshooting │ ⚠️  Possível     │ ❌ Não          │ ✅ Ideal         │
│ CI/CD Pipeline  │ ✅ Ótimo         │ ✅ Ótimo        │ ❌ Não            │
│ Status/Logs     │ ✅ Melhor        │ ❌ Não          │ ✅ Bom           │
│ Recursos baixos │ ⚠️  Aceitável    │ ✅ Melhor       │ ⚠️  Possível     │
└─────────────────┴──────────────────┴─────────────────┴──────────────────┘
```

**Recomendação:** `./startup.sh` para 95% dos casos 🎯

---

## 📍 Serviços Iniciados

Independente do script usado, você terá acesso a:

```
┌──────────────────┬────────────────────────────┬──────────┐
│   SERVIÇO        │         URL                │  PORTA   │
├──────────────────┼────────────────────────────┼──────────┤
│ Backend API      │ http://localhost:3000      │  3000    │
│ Swagger Docs     │ http://localhost:3000/api/ │  3000    │
│ Frontend         │ http://localhost:5173      │  5173    │
│ PostgreSQL       │ localhost:5432             │  5432    │
│ Redis            │ localhost:6379             │  6379    │
│ Mobile (Expo)    │ Escanear QR code           │  8081    │
└──────────────────┴────────────────────────────┴──────────┘
```

---

## 🔑 Credenciais

```
┌──────────────────┬──────────────────────┐
│     CAMPO        │       VALOR          │
├──────────────────┼──────────────────────┤
│ Database         │ cookme_db            │
│ Username         │ cookme               │
│ Password         │ cookme123            │
│ Backend Port     │ 3000                 │
│ Frontend Port    │ 5173                 │
│ PostgreSQL Port  │ 5432                 │
│ Redis Port       │ 6379                 │
└──────────────────┴──────────────────────┘
```

---

## 📊 Estrutura de Arquivos

```
cookme/
├── startup.sh              ⭐ Automática (RECOMENDADO)
├── start.sh                🚀 Ultra-rápida
│
├── STARTUP_SCRIPT.md       📚 Docs do startup.sh
├── QUICK_START.md          ⚡ Quick start
├── SCRIPTS_OVERVIEW.md     📊 Este arquivo
│
├── docker-compose.yml      🐳 Configuração Docker
├── README.md               📖 Principal
│
├── backend/                🔧 NestJS
├── frontend/               ⚛️  Vite React
└── mobile/                 📱 Expo React Native
```

---

## 🚨 Troubleshooting Rápido

### "Não sei qual script usar"
→ Use `./startup.sh` (é o mais completo)

### "Porta já em uso"
```bash
./startup.sh --stop
lsof -i :3000  # Encontrar processo
kill -9 <PID>  # Matar
./startup.sh   # Reiniciar
```

### "Docker não está rodando"
```bash
# Linux
sudo systemctl start docker

# macOS
open /Applications/Docker.app

# Depois
./startup.sh
```

### "Quer resetar tudo"
```bash
./startup.sh --stop
./startup.sh --clean
rm -rf */node_modules
./startup.sh
```

---

## 💡 Dicas Pro

### 1. Usar aliases

```bash
alias sm='./startup.sh'
alias start='./start.sh'
```

### 2. Monitorar em background

```bash
./startup.sh &
tail -f .*.log
```

### 3. Ver status constantemente

```bash
watch -n 2 './startup.sh --status'
```

### 4. Parar tudo gracefully

```bash
./startup.sh --stop
# Espera 5 segundos e verifica
./startup.sh --status
```

---

## 📚 Documentação Relacionada

- [STARTUP_SCRIPT.md](STARTUP_SCRIPT.md) - Docs completas do `startup.sh`
- [QUICK_START.md](QUICK_START.md) - Quick reference
- [README.md](README.md) - Visão geral do projeto
- [LEIA_PRIMEIRO.md](LEIA_PRIMEIRO.md) - Tudo sobre o projeto

---

## 🎯 Próximos Passos

1. Execute: `./startup.sh`
2. Aguarde ~30 segundos
3. Abra: http://localhost:5173
4. Divirta-se! 🎉

---

**Ainda com dúvidas?** `./startup.sh --help`
