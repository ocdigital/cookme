# CookMe Mobile - Guia de Setup

## 🎯 Opções para Testar o App

Você tem **3 opções** para rodar o app mobile:

### ✅ **Opção 1: Expo Go no Celular (MAIS FÁCIL)** ⭐ Recomendado

**Não precisa de Android Studio ou emulador!**

1. **Instale o Expo Go no celular:**
   - [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

2. **Inicie o servidor:**
   ```bash
   cd mobile
   npm install
   npm start
   ```

3. **Conecte ao app:**
   - **Android**: Abra o Expo Go e escaneie o QR Code exibido no terminal
   - **iOS**: Abra a câmera e escaneie o QR Code

4. **Configure a API:**

   **IMPORTANTE**: O celular precisa estar na **mesma rede Wi-Fi** que seu computador!

   Descubra o IP da sua máquina:
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1
   # ou
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig | findstr "IPv4"
   ```

   Edite `mobile/src/config/api.js`:
   ```javascript
   // Substitua 192.168.1.100 pelo SEU IP
   export const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

5. **Backend deve estar rodando:**
   ```bash
   cd backend
   npm run start:dev
   ```

✅ **Pronto!** O app carregará no seu celular.

---

### 🖥️ **Opção 2: Android Emulator (AVD)**

Requer Android Studio instalado.

#### Instalar Android Studio

```bash
# Ubuntu/Debian
sudo snap install android-studio --classic

# Fedora
sudo dnf install android-studio

# Arch
yay -S android-studio

# Manualmente
# Baixar: https://developer.android.com/studio
```

#### Configurar Android SDK

1. Abra o Android Studio
2. **Configure** → **SDK Manager**
3. Instale:
   - ✅ Android SDK Platform (API 33 ou 34)
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools

4. Adicione ao `~/.bashrc` ou `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

5. Recarregue:
   ```bash
   source ~/.bashrc  # ou ~/.zshrc
   ```

#### Criar AVD (Android Virtual Device)

1. Abra o Android Studio
2. **Tools** → **Device Manager**
3. **Create Device**
4. Selecione um dispositivo (ex: Pixel 5)
5. Selecione uma imagem do sistema (ex: API 33)
6. Clique **Finish**

#### Rodar no Emulator

```bash
cd mobile
npm install
npm run android
```

O emulador abrirá automaticamente e o app será instalado.

**API URL:** Use `http://10.0.2.2:3000/api` (IP especial do emulador para localhost)

---

### 🍎 **Opção 3: iOS Simulator (somente macOS)**

Requer Xcode instalado.

```bash
# Instalar Xcode da App Store

cd mobile
npm install
npm run ios
```

**API URL:** Use `http://localhost:3000/api`

---

## ⚙️ Configuração da API por Ambiente

Edite `mobile/src/config/api.js`:

```javascript
// ============================================
// Escolha UMA das opções abaixo:
// ============================================

// 1. Para Expo Go no celular (mesma rede Wi-Fi)
export const API_BASE_URL = 'http://SEU_IP_LOCAL:3000/api';
// Exemplo: 'http://192.168.1.100:3000/api'

// 2. Para Android Emulator (AVD)
// export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// 3. Para iOS Simulator
// export const API_BASE_URL = 'http://localhost:3000/api';
```

**Como descobrir seu IP:**

```bash
# Linux/Mac
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr "IPv4" | findstr "192.168"
```

---

## 🔍 Troubleshooting

### ❌ "Unable to connect to API"

**Causa:** Backend não está rodando ou URL incorreta

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:3000/api/auth/me
# Deve retornar 401 (não autenticado) - isso é OK!

# 2. Verificar se celular consegue acessar
# No navegador do celular, abrir: http://SEU_IP:3000/api/auth/me

# 3. Verificar firewall
sudo ufw allow 3000/tcp  # Linux
```

### ❌ "Network request failed"

**Causa:** Celular e computador não estão na mesma rede

**Solução:**
1. Conectar ambos na mesma rede Wi-Fi
2. Desabilitar VPN no celular
3. Usar IP local (não localhost)

### ❌ "spawn adb ENOENT"

**Causa:** Android SDK não instalado

**Solução:**
- Use **Expo Go no celular** (Opção 1) - não precisa de Android SDK
- OU instale Android Studio (Opção 2)

### ❌ Câmera não funciona no Expo Go

**Causa:** Permissões não concedidas

**Solução:**
1. Fechar o app
2. Ir em Configurações do celular → Apps → Expo Go → Permissões
3. Habilitar "Câmera"
4. Abrir app novamente

Ou use a opção **"Inserir Manualmente"** no scanner.

---

## 📱 Testando Sem Cupom Fiscal

Se não tiver um cupom fiscal SAT para testar, você pode:

1. Usar a entrada manual com um QR Code de teste (pedir para o backend criar um mock)
2. Testar apenas as outras funcionalidades (login, dashboard, etc)
3. Simular o fluxo com dados de exemplo

---

## 🎯 Passo a Passo Completo (Expo Go)

```bash
# Terminal 1 - Backend
cd backend
docker-compose up -d
npm run start:dev
# Backend rodando em http://localhost:3000

# Terminal 2 - Mobile
cd mobile
npm install

# Editar src/config/api.js com seu IP
# Ex: export const API_BASE_URL = 'http://192.168.1.100:3000/api';

npm start
# QR Code será exibido
```

**No celular:**
1. Abrir Expo Go
2. Escanear QR Code
3. App carrega
4. Fazer registro
5. Testar!

---

## 🌐 Redes e Firewall

### Ubuntu/Debian

```bash
# Permitir porta 3000
sudo ufw allow 3000/tcp

# Verificar status
sudo ufw status
```

### Fedora/RHEL

```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### Verificar se porta está aberta

```bash
# No computador
netstat -tlnp | grep 3000

# No celular (navegador)
# Abrir: http://SEU_IP:3000/api/auth/me
```

---

## 📦 Build para Produção

### Android APK

```bash
expo build:android
```

### iOS App

```bash
expo build:ios
```

### Publish no Expo

```bash
expo publish
```

Isso hospeda o app no Expo e gera um link permanente.

---

## 🆘 Ainda com problemas?

1. **Verificar logs:**
   ```bash
   # Backend
   cd backend
   npm run start:dev

   # Mobile (outro terminal)
   cd mobile
   npm start
   ```

2. **Limpar cache:**
   ```bash
   cd mobile
   rm -rf node_modules .expo
   npm install
   npm start -- --clear
   ```

3. **Verificar versões:**
   ```bash
   node -v    # Deve ser 18+
   npm -v     # Deve ser 9+
   ```

4. **Consultar documentação:**
   - [Expo Docs](https://docs.expo.dev/)
   - [React Navigation](https://reactnavigation.org/)

---

**Recomendação:** Use **Expo Go no celular** (Opção 1) para começar. É mais rápido e fácil!

**Desenvolvido com ❤️ por Eduardo Ferreira**
