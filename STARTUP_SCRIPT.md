# 🚀 CookMe - Script de Inicialização

Script bash completo para facilitar a subida de todos os serviços do CookMe (Docker, Backend, Frontend e Mobile).

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js** (v16+) e **npm** instalados
- **curl** instalado (para verificar status dos serviços)

## 🎯 Uso Rápido

```bash
# Iniciar TODOS os serviços
./startup.sh

# Ver status dos serviços
./startup.sh --status

# Parar todos os serviços
./startup.sh --stop

# Ver ajuda
./startup.sh --help
```

## 📚 Comandos Completos

### Iniciar Serviços

```bash
# Inicia tudo (Docker + Backend + Frontend + Mobile)
./startup.sh

# Inicia apenas Backend
./startup.sh --backend

# Inicia apenas Frontend
./startup.sh --frontend

# Inicia apenas Mobile
./startup.sh --mobile
```

### Parar Serviços

```bash
# Para tudo
./startup.sh --stop

# Para apenas Backend
./startup.sh --stop-backend

# Para apenas Frontend
./startup.sh --stop-frontend

# Para apenas Mobile
./startup.sh --stop-mobile
```

### Gerenciar Docker

```bash
# Limpa containers e volumes Docker
./startup.sh --clean
```

### Informações

```bash
# Ver status de todos os serviços
./startup.sh --status

# Ver logs disponíveis (interativo)
./startup.sh --logs

# Mostrar ajuda
./startup.sh --help
```

## 🔍 Acessar Serviços

Após executar `./startup.sh`, você terá acesso a:

| Serviço | URL | Função |
|---------|-----|--------|
| **Backend API** | http://localhost:3000 | API REST |
| **Swagger Docs** | http://localhost:3000/api/docs | Documentação interativa |
| **Frontend** | http://localhost:5173 | Painel web |
| **PostgreSQL** | localhost:5432 | Banco de dados |
| **Redis** | localhost:6379 | Cache |
| **Mobile** | Expo Go | Aplicativo mobile |

## 📊 Status dos Serviços

Visualize o status em tempo real:

```bash
./startup.sh --status
```

Exemplo de output:
```
═══════════════════════════════════════════════════════════
  📊 Status dos Serviços
═══════════════════════════════════════════════════════════

Docker:    ✅ PostgreSQL rodando (5432)
           ✅ Redis rodando (6379)
Backend:   ✅ Rodando em http://localhost:3000 (PID: 12345)
Frontend:  ✅ Rodando em http://localhost:5173 (PID: 12346)
Mobile:    ✅ Rodando (PID: 12347)
```

## 📋 Logs

Cada serviço gera um arquivo de log:

```bash
# Ver logs do Backend
tail -f .backend.log

# Ver logs do Frontend
tail -f .frontend.log

# Ver logs do Mobile
tail -f .mobile.log

# Ver todos os logs simultaneamente
tail -f .*.log
```

## 🐳 Docker

### Verificar Containers

```bash
# Listar containers em execução
docker ps

# Verificar status do PostgreSQL
docker exec postgres-cookme pg_isready

# Verificar status do Redis
docker exec redis-cookme redis-cli ping
```

### Comandos Úteis

```bash
# Ver logs do Docker
docker-compose logs postgres
docker-compose logs redis

# Parar apenas Docker (mantém serviços Node rodando)
docker-compose down

# Reiniciar Docker
docker-compose up -d
```

## 🔧 Backend (NestJS)

### Verificar Status

```bash
# Verificar se está respondendo
curl http://localhost:3000/api/health

# Acessar Swagger
open http://localhost:3000/api/docs
```

### Logs do Backend

```bash
# Ver últimas 100 linhas
tail -100 .backend.log

# Monitorar em tempo real
tail -f .backend.log

# Buscar erros
grep -i error .backend.log
```

## ⚛️ Frontend (Vite React)

### Verificar Status

```bash
# Verificar se está respondendo
curl http://localhost:5173

# Acessar no navegador
open http://localhost:5173
```

### Logs do Frontend

```bash
# Ver últimas 100 linhas
tail -100 .frontend.log

# Monitorar em tempo real
tail -f .frontend.log
```

## 📱 Mobile (Expo React Native)

### Executar no Device

Após executar `./startup.sh --mobile`:

1. **Android**: Pressione `a` no terminal
2. **iOS**: Pressione `i` no terminal
3. **Expo Go**: Escaneie o QR code

### Logs do Mobile

```bash
# Ver últimas 100 linhas
tail -100 .mobile.log

# Monitorar em tempo real
tail -f .mobile.log

# Buscar erros
grep -i error .mobile.log
```

## 🚨 Troubleshooting

### Docker não está rodando

```bash
# Iniciar daemon do Docker
sudo systemctl start docker

# Ou no macOS
open /Applications/Docker.app
```

### Porta já em uso

```bash
# Verificar qual processo está usando a porta
lsof -i :3000      # Backend
lsof -i :5173      # Frontend
lsof -i :5432      # PostgreSQL
lsof -i :6379      # Redis

# Matar o processo (Linux/macOS)
kill -9 <PID>
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está pronto
docker exec postgres-cookme pg_isready

# Ver logs do PostgreSQL
docker logs postgres-cookme

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Redis não responde

```bash
# Testar conexão Redis
docker exec redis-cookme redis-cli ping
# Esperado: PONG

# Reiniciar Redis
docker-compose restart redis
```

### Dependências não instaladas

```bash
# Reinstalar tudo
rm -rf backend/node_modules frontend/node_modules mobile/node_modules
./startup.sh
```

## 🔐 Credenciais Padrão

```
Database:    cookme_db
Username:    cookme
Password:    cookme123
```

## 📝 Estrutura de Arquivos

```
cookme/
├── startup.sh                  # Este script
├── STARTUP_SCRIPT.md           # Esta documentação
├── docker-compose.yml          # Configuração Docker
├── .backend.pid                # PID do Backend
├── .frontend.pid               # PID do Frontend
├── .mobile.pid                 # PID do Mobile
├── .backend.log                # Logs do Backend
├── .frontend.log               # Logs do Frontend
├── .mobile.log                 # Logs do Mobile
│
├── backend/                    # NestJS
│   ├── package.json
│   └── src/
│
├── frontend/                   # React (Vite)
│   ├── package.json
│   └── src/
│
└── mobile/                     # React Native (Expo)
    ├── package.json
    └── src/
```

## 💡 Dicas Práticas

### 1. Primeira Execução

```bash
# Executar com permissão
chmod +x startup.sh

# Iniciar tudo
./startup.sh

# Aguardar ~30 segundos para tudo ficar pronto
```

### 2. Desenvolvimento Contínuo

```bash
# Terminal 1: Monitorar status
watch -n 5 './startup.sh --status'

# Terminal 2: Ver logs
tail -f .*.log

# Terminal 3: Trabalhar no código
```

### 3. Resetar Tudo

```bash
# Parar tudo
./startup.sh --stop

# Limpar Docker
./startup.sh --clean

# Reiniciar
./startup.sh
```

### 4. Atualizar Dependências

```bash
# Parar serviços
./startup.sh --stop

# Remover node_modules
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null

# Reiniciar (instala dependências automaticamente)
./startup.sh
```

## 🎯 Ciclo de Desenvolvimento

```bash
# 1. Iniciar uma vez
./startup.sh

# 2. Fazer alterações nos arquivos

# 3. Serviços recarregam automaticamente:
#    - Backend: HMR automático (npm run start:dev)
#    - Frontend: Vite HMR automático
#    - Mobile: Expo Fast Refresh automático

# 4. Ver logs se houver problemas
tail -f .backend.log
tail -f .frontend.log
tail -f .mobile.log

# 5. Parar quando terminar
./startup.sh --stop
```

## 🔔 Notificações de Status

O script mostra cores no terminal:

- 🟢 **Verde** (`✅`): Serviço está rodando
- 🔴 **Vermelho** (`❌`): Serviço parado ou erro
- 🟡 **Amarelo** (`⚠️`): Aviso ou já em execução
- 🔵 **Azul** (`ℹ️`): Informação

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `tail -f .*.log`
2. Verificar status: `./startup.sh --status`
3. Verificar Docker: `docker ps -a`
4. Limpar e reiniciar: `./startup.sh --clean && ./startup.sh`

## 📄 Licença

Uso livre para o projeto CookMe.

---

**Boa sorte! 🚀**
