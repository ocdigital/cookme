# CookMe Mobile

Aplicativo mobile React Native + Expo para o CookMe - Motor de Otimização de Inventário.

## 📱 Funcionalidades

- ✅ **Autenticação** - Login e registro de usuários
- ✅ **Scanner de QR Code** - Escanear cupons fiscais SAT-SP
- ✅ **Processamento Automático** - Cadastro automático de compras
- ✅ **Resolução de CAPTCHA** - WebView integrada para resolver CAPTCHA
- ✅ **Dashboard** - Visualização de inventário, produtos vencendo e sugestões de receitas
- ✅ **Polling em Tempo Real** - Acompanhamento do status do processamento

## 🛠️ Stack Tecnológico

- **React Native** com Expo SDK 50
- **React Navigation** - Navegação entre telas
- **Axios** - Cliente HTTP
- **Expo Camera** - Scanner de QR Code
- **Expo Secure Store** - Armazenamento seguro de tokens
- **React Native WebView** - Resolução de CAPTCHA

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **Expo CLI** instalado globalmente: `npm install -g expo-cli`
- **Backend CookMe** rodando (http://localhost:3000)

### Para testar no dispositivo físico:
- App **Expo Go** instalado no celular (Android/iOS)
- Celular e computador na **mesma rede Wi-Fi**

## 🚀 Como Rodar

### ⭐ Forma Mais Fácil: Expo Go no Celular (Recomendado)

**Não precisa de Android Studio!**

1. **Instale o Expo Go:**
   - [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

2. **Instale dependências:**
   ```bash
   cd mobile
   npm install
   ```

3. **Configure a API (seu IP local):**
   ```bash
   # Descobrir seu IP
   ip addr show | grep "inet " | grep -v 127.0.0.1
   # ou
   hostname -I | awk '{print $1}'
   ```

   Edite `src/config/api.js`:
   ```javascript
   // Substitua pelo SEU IP
   export const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

4. **Inicie o app:**
   ```bash
   npm start
   ```

5. **Escaneie o QR Code** com o Expo Go no celular

✅ **Pronto!** O app carregará no seu celular.

**⚠️ Importante:**
- Celular e computador devem estar na **mesma rede Wi-Fi**
- Backend deve estar rodando: `cd backend && npm run start:dev`

---

### 🖥️ Outras Opções

**Veja [SETUP-GUIDE.md](SETUP-GUIDE.md) para:**
- Android Emulator (requer Android Studio)
- iOS Simulator (requer macOS + Xcode)
- Troubleshooting completo

## 📱 Fluxo de Uso

### 1. Login/Registro
```
LoginScreen → RegisterScreen
              ↓
           HomeScreen
```

### 2. Cadastrar Cupom Fiscal
```
HomeScreen → QRScannerScreen
             ↓ (scan QR code)
           ProcessingScreen (polling)
             ↓ (status: aguardando_captcha)
           CaptchaScreen (resolve CAPTCHA)
             ↓ (notifica backend)
           ProcessingScreen (continua polling)
             ↓ (status: concluido)
           ResultScreen (sucesso)
```

### 3. Dashboard
```
HomeScreen
  - Estatísticas do inventário
  - Produtos vencendo (próximos 7 dias)
  - Top 3 sugestões de receitas (Motor MOI)
  - Pull to refresh
```

## 📂 Estrutura do Projeto

```
mobile/
├── App.js                    # Entry point + navegação
├── app.json                  # Configuração Expo
├── package.json              # Dependências
├── babel.config.js           # Configuração Babel
├── .env.example              # Exemplo de variáveis de ambiente
│
└── src/
    ├── config/
    │   └── api.js            # Configuração da API base URL
    │
    ├── contexts/
    │   └── AuthContext.js    # Context de autenticação
    │
    ├── services/
    │   └── api.js            # Cliente Axios + serviços (auth, scraper, inventario, receitas)
    │
    └── screens/
        ├── LoginScreen.js         # Tela de login
        ├── RegisterScreen.js      # Tela de registro
        ├── HomeScreen.js          # Dashboard principal
        ├── QRScannerScreen.js     # Scanner de QR Code
        ├── ProcessingScreen.js    # Tela de processamento (polling)
        ├── CaptchaScreen.js       # WebView para CAPTCHA
        └── ResultScreen.js        # Tela de resultado (sucesso/erro)
```

## 🔌 Integração com Backend

O app mobile se integra com 4 módulos do backend:

### 1. Auth (`/api/auth/*`)
- Login
- Registro
- Refresh token automático
- Logout

### 2. Scraper (`/api/scraper/*`)
- `POST /consultas` - Iniciar processamento de cupom
- `GET /consultas/:id` - Consultar status (polling a cada 2s)
- `POST /consultas/:id/captcha-resolvido` - Notificar CAPTCHA resolvido
- `DELETE /consultas/:id` - Cancelar processamento
- `GET /minhas-consultas` - Histórico de consultas

### 3. Inventário (`/api/inventario/*`)
- Stats do inventário
- Produtos vencendo
- Listagem completa

### 4. Receitas (`/api/receitas/*`)
- Sugestões inteligentes (Motor MOI)
- Listagem de receitas
- Executar receita

## 🔐 Autenticação

O app usa **JWT** com os seguintes mecanismos:

- **Access Token**: Armazenado no `SecureStore`, enviado em todas as requisições
- **Refresh Token**: Renovação automática quando access token expira
- **Interceptors Axios**: Adiciona token automaticamente nas requisições

```javascript
// AuthContext gerencia o estado global de autenticação
const { user, login, logout, isAuthenticated } = useAuth();
```

## 🎨 Temas e Cores

```javascript
Primária:  #4CAF50 (verde)
Sucesso:   #4CAF50
Erro:      #F44336
Alerta:    #FF9800
Info:      #2196F3
Texto:     #333333
Subtexto:  #666666
Background:#f5f5f5
```

## 📸 Permissões

O app requer as seguintes permissões:

- **Câmera**: Para escanear QR Code do cupom fiscal
- **Internet**: Para comunicação com a API

Permissões são solicitadas automaticamente na primeira vez que o usuário acessa o scanner.

## 🧪 Como Testar o Fluxo Completo

### 1. Preparar Backend

```bash
cd backend
docker-compose up -d  # PostgreSQL + Redis + pgAdmin
npm run start:dev     # API rodando em http://localhost:3000
```

### 2. Criar Usuário no App

```
1. Abrir app → Tela de Login
2. Clicar em "Cadastre-se"
3. Preencher dados e criar conta
4. Será redirecionado para HomeScreen
```

### 3. Escanear Cupom Fiscal

```
1. HomeScreen → Clicar em "Escanear Cupom Fiscal"
2. Permitir acesso à câmera
3. Apontar para QR Code de cupom SAT-SP

   OU

   Clicar em "Inserir Manualmente" e colar o texto do QR Code
4. Aguardar processamento
5. Resolver CAPTCHA quando solicitado
6. Verificar resultado (sucesso ou erro)
7. Voltar ao HomeScreen e ver produtos cadastrados
```

## 🐛 Troubleshooting

### Erro: "Unable to connect to API"

**Causa**: Backend não está rodando ou URL está incorreta

**Solução**:
1. Verificar se backend está rodando: `curl http://localhost:3000/api/auth/me`
2. Verificar `src/config/api.js` - usar IP correto
3. Verificar firewall/antivírus não está bloqueando

### Erro: "Network request failed"

**Causa**: Dispositivo físico não está na mesma rede do computador

**Solução**:
1. Conectar celular e computador na mesma Wi-Fi
2. Usar IP local da máquina (não `localhost`)
3. Desabilitar VPN no celular

### Câmera não funciona

**Causa**: Permissões não concedidas

**Solução**:
1. Verificar nas configurações do celular se o app tem permissão de câmera
2. Reinstalar o app e conceder permissões quando solicitado
3. Usar opção "Inserir Manualmente" como alternativa

### CAPTCHA não carrega

**Causa**: WebView não tem acesso à internet ou site está fora do ar

**Solução**:
1. Verificar conexão com internet
2. Tentar novamente mais tarde
3. Verificar se o site da Fazenda SP está acessível

## 📦 Build para Produção

### Android APK

```bash
expo build:android
```

### iOS App

```bash
expo build:ios
```

Ou publique na Expo:

```bash
expo publish
```

## 🔜 Próximas Funcionalidades

- [ ] Modo offline com cache local
- [ ] Notificações push para produtos vencendo
- [ ] Histórico detalhado de compras
- [ ] Busca e filtragem de produtos
- [ ] Execução de receitas com timer
- [ ] Compartilhamento de receitas
- [ ] Dark mode
- [ ] Suporte a múltiplos idiomas (i18n)

## 📚 Documentação Adicional

- **Backend API**: http://localhost:3000/api/docs (Swagger)
- **Integração Mobile**: [MOBILE_INTEGRATION.md](../MOBILE_INTEGRATION.md)
- **Postman Collection**: [CookMe-API.postman_collection.json](../backend/CookMe-API.postman_collection.json)

## 👨‍💻 Desenvolvimento

### Estrutura de Código

```javascript
// Exemplo de uso dos serviços
import { authService, scraperService, inventarioService } from '../services/api';

// Login
const { user, access_token } = await authService.login(email, senha);

// Iniciar consulta de cupom
const { sessionId } = await scraperService.startConsulta(qrcodeTexto);

// Verificar status
const status = await scraperService.getStatus(sessionId);

// Obter inventário
const items = await inventarioService.getInventario();
```

### Adicionar Nova Tela

1. Criar arquivo em `src/screens/NovaScreen.js`
2. Adicionar rota em `App.js`:
```javascript
<Stack.Screen
  name="Nova"
  component={NovaScreen}
  options={{ title: 'Nova Tela' }}
/>
```
3. Navegar: `navigation.navigate('Nova')`

## 📞 Suporte

**Autor**: Eduardo Ferreira
**Email**: eduardo@ocdigital.com.br

## 📝 Licença

MIT License - Veja arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para ajudar a reduzir o desperdício de alimentos**
