# API Configuration

## Configure Backend URL

Edit `src/services/api.ts` line 4 com a URL correta para seu ambiente:

### Para Android Emulator (Android Studio/AVD)
```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

### Para iOS Simulator
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Para Celular Real (na mesma rede WiFi)
```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

Encontre seu IP rodando:
```bash
ipconfig getifaddr en0   # macOS
hostname -I              # Linux/Windows
```

### Para usar com Ngrok (públic tunnel)
1. Instale: `brew install ngrok`
2. Rote: `ngrok http 3000`
3. Use a URL do ngrok (ex: `https://abcd1234.ngrok.io/api`)

---

## Current Setting
Atualmente: `http://localhost:3000/api`

**Mude para o valor correto para seu ambiente!**
