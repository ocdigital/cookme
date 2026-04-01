# 🚀 Developer Workflow - CookMe

Guia completo para um workflow de desenvolvimento profissional e eficiente.

## 📋 Workflow Recomendado

### Setup Inicial (uma vez)

```bash
# 1. Clone o projeto (se não tiver)
git clone <repo>
cd cookme

# 2. Dar permissão aos scripts
chmod +x startup.sh start.sh monitor-logs.sh

# 3. Pronto! Agora use o workflow abaixo
```

---

## 💻 3-Terminal Workflow (RECOMENDADO)

A forma mais eficiente de desenvolver é usar 3 terminais:

### **Terminal 1: Iniciar Serviços**

```bash
./startup.sh
```

Isso fará:
- ✅ Inicia Docker (PostgreSQL + Redis)
- ✅ Instala dependências automaticamente
- ✅ Inicia Backend (NestJS)
- ✅ Inicia Frontend (Vite React)
- ✅ Inicia Mobile (Expo React Native)

**Output esperado:**
```
✅ Docker pronto! (PostgreSQL: 5432, Redis: 6379)
✅ Backend rodando em http://localhost:3000
✅ Frontend rodando em http://localhost:5173
✅ Mobile rodando (pressione 'a' para Android)
```

---

### **Terminal 2: Monitorar Logs**

```bash
./monitor-logs.sh
```

Isso mostrará:
- 📊 Logs em tempo real de todos os serviços
- 🎨 Cor-codificado por tipo (erro, sucesso, aviso)
- 📱 Logs do Backend, Frontend e Mobile simultaneamente

**Alternativas:**
```bash
./monitor-logs.sh errors     # Apenas erros
./monitor-logs.sh backend    # Apenas backend
./monitor-logs.sh grep "erro" # Buscar por palavra
```

**Pressione CTRL+C para parar**

---

### **Terminal 3: Desenvolvimento**

```bash
# Seu editor favorito
code .
# ou
vim src/
# ou qualquer outro editor
```

Aqui você:
- 💻 Edita código
- 🔄 Os serviços recarregam automaticamente (HMR)
- 📊 Vê os logs em tempo real no Terminal 2

---

## 🔄 Fluxo de Desenvolvimento

```
1. Editar arquivo em Terminal 3
        ↓
2. Salvar arquivo (CTRL+S)
        ↓
3. Backend recarrega automaticamente (HMR)
        ↓
4. Ver log no Terminal 2
        ↓
5. Testar no navegador/mobile
        ↓
6. Se houver erro → Ver log → Corrigir → Voltar ao 1
        ↓
7. Quando terminar → CTRL+C em todos os terminais
```

---

## 🎯 Acessar Serviços

Enquanto os terminais 1 e 2 estão rodando:

| Serviço | URL | Atalho |
|---------|-----|--------|
| Backend | http://localhost:3000 | - |
| Swagger | http://localhost:3000/api/docs | - |
| Frontend | http://localhost:5173 | - |
| Mobile | Escanear QR code | 'a' para Android |

---

## 📲 Mobile Development

### Opção A: Expo Go App (Recomendado)

1. Instale "Expo Go" no seu celular
2. Espere o Expo começar (Terminal 1)
3. Pressione 'a' para Android ou 'i' para iOS
4. Escaneie o QR code que aparecer

### Opção B: Android Emulator

```bash
# No Terminal 1, quando Expo estiver pronto:
# Pressione 'a'
```

### Opção C: iOS Simulator (macOS)

```bash
# No Terminal 1, quando Expo estiver pronto:
# Pressione 'i'
```

---

## 🐛 Debugging

### Ver logs de um serviço específico

```bash
# Backend
tail -f .backend.log

# Frontend
tail -f .frontend.log

# Mobile
tail -f /tmp/expo.log

# Todos
./monitor-logs.sh
```

### Buscar por erro específico

```bash
./monitor-logs.sh grep "erro que procuro"
```

### Último 100 linhas

```bash
tail -100 .backend.log
```

### Ver stack trace completo

```bash
grep -A 20 "Error:" .backend.log
```

---

## 🚀 Comandos Úteis

### Parar um serviço específico

```bash
./startup.sh --stop-backend   # Para backend
./startup.sh --stop-frontend  # Para frontend
./startup.sh --stop-mobile    # Para mobile
```

### Reiniciar um serviço

```bash
./startup.sh --stop-backend
./startup.sh --backend
```

### Ver status de tudo

```bash
./startup.sh --status
```

### Limpar cache e reiniciar

```bash
./startup.sh --stop
./startup.sh --clean
rm -rf */node_modules
./startup.sh
```

---

## 💡 Dicas Profissionais

### 1. Use aliases para ser mais rápido

```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
alias sm='./startup.sh'
alias ml='./monitor-logs.sh'
alias status='./startup.sh --status'

# Depois use:
sm        # em vez de ./startup.sh
ml        # em vez de ./monitor-logs.sh
status    # em vez de ./startup.sh --status
```

### 2. Redimensionar janelas do terminal

```bash
# Linux/macOS - use tmux ou splits nativas
# Assim você vê todos os 3 terminais lado a lado
```

### 3. Usar grep para filtrar logs úteis

```bash
# Ver apenas logs de HTTP requests
tail -f .backend.log | grep "GET\|POST\|PUT\|DELETE"

# Ver apenas banco de dados
tail -f .backend.log | grep -i "database\|query\|sql"

# Ver apenas autenticação
tail -f .backend.log | grep -i "auth\|login\|token"
```

### 4. Combinar logs em tempo real com busca

```bash
# Ver erros assim que acontecerem
tail -f .backend.log | grep -i "error" --color=always
```

### 5. Salvar logs para análise posterior

```bash
# Criar backup dos logs
cp .backend.log logs/backend-$(date +%s).log
cp .frontend.log logs/frontend-$(date +%s).log
cp .mobile.log logs/mobile-$(date +%s).log
```

---

## 🔄 Hot Reload / Fast Refresh

Cada serviço recarrega automaticamente quando você edita:

### Backend (NestJS)
- ✅ Recarrega em ~2 segundos
- ✅ Mantém estado do banco de dados
- ✅ Socket connections são re-estabelecidas

### Frontend (Vite React)
- ✅ Recarrega em ~1 segundo
- ✅ Fast Refresh preserva estado do componente
- ✅ Sem necessidade de refresh do navegador

### Mobile (Expo)
- ✅ Fast Refresh (~1-2 segundos)
- ✅ App atualiza no device em tempo real
- ✅ Sem perder estado durante alterações

---

## 🔌 Conectar Device Físico

### Android

```bash
# 1. Conectar via USB com debugging ativo
# 2. No Terminal 1, quando Expo pedir, pressione 'a'
# OU
# 3. Abrir Expo Go e escanear QR code
```

### iOS

```bash
# 1. Conectar iPhone ao macOS
# 2. Confiar no computador (no iPhone)
# 3. Instalar Expo Go na App Store
# 4. Abrir Expo Go e escanear QR code
```

### Mesmo WiFi

⚠️ **IMPORTANTE:**
- Device e computador DEVEM estar no mesmo WiFi
- Se não funcionar, use IP em vez de localhost:
  - `exp://192.168.86.9:8081`

---

## 🚨 Troubleshooting Comum

### "Porta já em uso"

```bash
# Encontrar processo
lsof -i :3000       # Backend
lsof -i :5173       # Frontend
lsof -i :8081       # Mobile

# Matar processo
kill -9 <PID>

# Reiniciar
./startup.sh
```

### "Cannot connect to server"

```bash
# 1. Verificar se está na mesma rede
# 2. Usar IP em vez de localhost
# 3. Reiniciar Expo: 'r' no Terminal 1
# 4. Ou reset completo:
./startup.sh --stop
./startup.sh --clean
./startup.sh
```

### "Metro Bundler compilation error"

```bash
# Limpar cache
# No Terminal 1, pressione 'c'

# Ou fazer reset:
rm -rf mobile/node_modules
npm --prefix mobile install
npx expo start --clear
```

### "Changes not reflecting"

```bash
# Check se o arquivo foi salvo
# Verificar hot reload está ativo
# Se não funcionar, reload manual:
# - Web: F5 no navegador
# - Mobile: 'r' no Terminal 1 para recarregar
```

---

## 📋 Checklist de Setup

- [ ] Clone ou acesso ao repositório
- [ ] `chmod +x startup.sh monitor-logs.sh`
- [ ] `./startup.sh` em Terminal 1
- [ ] Aguarde ~30 segundos
- [ ] `./monitor-logs.sh` em Terminal 2
- [ ] Acessar http://localhost:5173 em Terminal 3
- [ ] Ver logs em tempo real no Terminal 2
- [ ] Fazer alteração de teste
- [ ] Ver alteração refletir em ~1-2 segundos

---

## 🎯 Próximos Passos

1. **Setup**: `./startup.sh`
2. **Monitor**: `./monitor-logs.sh` (em outro terminal)
3. **Develop**: Edite arquivos e veja mudanças em tempo real
4. **Test**: Acesse http://localhost:5173
5. **Debug**: Use logs para ver o que está acontecendo

---

**Você está pronto para desenvolver! 🚀**

Dúvidas? Veja:
- [STARTUP_SCRIPT.md](STARTUP_SCRIPT.md) - Scripts de startup
- [QUICK_START.md](QUICK_START.md) - Início rápido
- [README.md](README.md) - Visão geral do projeto
