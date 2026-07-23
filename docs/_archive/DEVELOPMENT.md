# 🚀 Guia de Desenvolvimento - CookMe

## Requisitos

- Node.js 18+
- npm ou yarn
- Docker & Docker Compose
- Expo CLI (instalado via npm)

## Iniciando o Desenvolvimento

### Opção 1: Script Rápido (Recomendado)

```bash
# Inicia apenas a infraestrutura (Docker)
./dev.sh

# Em outras abas do terminal, abra os serviços individualmente:
./dev.sh backend    # Tab 1 - Backend (porta 3000)
./dev.sh frontend   # Tab 2 - Frontend (porta 5173)
./dev.sh mobile     # Tab 3 - Mobile (Expo com QR code)
```

**Vantagens:**

- Você vê os logs e QR code em tempo real
- Fácil fazer reload de qualquer serviço
- Melhor para debugging

### Opção 2: Script All-in-One

```bash
./startup.sh
```

**Nota:** O QR code do Expo agora é exibido no terminal.

### Opção 3: Manualmente

```bash
# Terminal 1 - Infraestrutura
docker-compose up postgres redis

# Terminal 2 - Backend
cd backend
npm run start:dev

# Terminal 3 - Frontend
cd frontend
npm run dev

# Terminal 4 - Mobile (ver QR code aqui!)
cd mobile
npx expo start
```

## Acessando os Serviços

| Serviço | URL | Descrição |
| ---------- | ----- | ----------- |
| **Frontend** | <http://localhost:5173> | App web |
| **Backend** | <http://localhost:3000> | API REST |
| **Swagger** | <http://localhost:3000/api/docs> | Documentação da API |
| **Mobile** | Scan QR code | App mobile (Expo Go) |

## Banco de Dados

### PostgreSQL

- **Host:** localhost
- **Porta:** 5432
- **User:** cookme
- **Password:** cookme123
- **Database:** cookme_db

### Redis

- **Host:** localhost
- **Porta:** 6379

## Logs

```bash
# Ver logs em tempo real
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
tail -f /tmp/mobile.log

# Ou com docker
docker-compose logs -f postgres
docker-compose logs -f redis
```

## Comandos Úteis

### Backend

```bash
cd backend
npm run start:dev       # Modo desenvolvimento (hot reload)
npm run build           # Compilar TypeScript
npm run seed:integracao # Popular banco com dados de teste
npm run test            # Rodar testes
```

### Frontend

```bash
cd frontend
npm run dev             # Desenvolvimento (hot reload)
npm run build           # Build para produção
npm run preview         # Preview build local
npm run test            # Rodar testes
npm run lint            # Verificar código
```

### Mobile

```bash
cd mobile
npx expo start          # Inicia Expo (mostra QR code)
npx expo start -c       # Clear cache
npx expo start --web    # Teste no navegador
npm run test            # Rodar testes
```

### Docker

```bash
docker-compose up       # Inicia serviços
docker-compose down     # Para serviços
docker-compose ps       # Ver status
docker-compose logs -f  # Ver logs
docker-compose restart  # Reiniciar
```

## Testando o App Mobile no Expo Go

### Opção 1: Smartphone (Recomendado)

1. Baixe o **Expo Go** na App Store ou Google Play
2. Execute `./dev.sh mobile` no terminal
3. Scan o QR code com a câmera do seu smartphone
4. O app abre automaticamente no Expo Go

### Opção 2: Emulador/Simulador

```bash
cd mobile
npx expo start

# Depois pressione:
# 'i' = Abrir no iOS Simulator (macOS)
# 'a' = Abrir no Android Emulator
```

### Opção 3: Web (para testes rápidos)

```bash
cd mobile
npx expo start --web
# Abre automaticamente em http://localhost:19006
```

## Troubleshooting

### "Port already in use"

```bash
# Encontrar processo usando a porta
lsof -i :3000    # Backend
lsof -i :5173    # Frontend
lsof -i :19000   # Expo

# Matar processo
kill -9 <PID>
```

### Expo não gera QR code

```bash
# Limpar cache
cd mobile
npx expo start -c

# Se ainda não funcionar, verificar logs
tail -f /tmp/mobile.log
```

### Erro de conexão com API

1. Verifique se o backend está rodando: `curl http://localhost:3000/api/auth/login`
2. Verifique o arquivo `mobile/src/config/api.js` - a URL está correta?
3. Tente limpar o cache do Expo: `npx expo start -c`

### Banco de dados não conecta

```bash
# Verificar status do Docker
docker-compose ps

# Reiniciar infraestrutura
docker-compose down
docker-compose up -d
```

## Estrutura do Projeto

```
cookme/
├── backend/          # NestJS API
├── frontend/         # React + Vite SPA
├── mobile/          # React Native + Expo
├── startup.sh       # Script all-in-one
├── dev.sh           # Script desenvolvimento
└── docker-compose.yml
```

## Variáveis de Ambiente

Cada serviço tem seu `.env`:

- **Backend:** `backend/.env`
- **Frontend:** `frontend/.env` (opcional)
- **Mobile:** `mobile/.env` (opcional)

Veja os exemplos `.env.example` para referência.

## Dicas Produtivas

1. **Hot Reload:** Todos os 3 serviços têm hot reload automático
2. **QR Code:** Se fechar o Expo, o QR code continua válido por alguns minutos
3. **Debug:** Use React DevTools para frontend/mobile
4. **API Testing:** Use Swagger em <http://localhost:3000/api/docs>
5. **Logs:** Manter os 3 terminais abertos ajuda no debugging

## Próximos Passos

- [ ] Implementar autenticação com Google/GitHub
- [ ] Adicionar testes E2E
- [ ] Configurar CI/CD
- [ ] Deploy em produção
