# Integração Mobile - Scraper de Cupons Fiscais

## 📱 Visão Geral

Esta documentação descreve como o aplicativo mobile pode interagir com o backend para processar cupons fiscais SAT-SP.

## 🏗️ Arquitetura Implementada

```
┌─────────────┐
│ Mobile App  │
│             │
│ 1. Scanneia │
│    QR Code  │
└──────┬──────┘
       │
       │ POST /api/scraper/consultas
       │ { qrcodeTexto: "..." }
       ▼
┌──────────────────────┐
│   Backend NestJS     │
│                      │
│ • Cria sessão        │
│ • Retorna session_id │
│ • Spawna Python      │
└──────────┬───────────┘
           │
           │ spawn python3 captcha_manual.py
           │ --mode api --session-id xxx --qrcode "..."
           ▼
    ┌─────────────────┐
    │ Python Scraper  │
    │                 │
    │ • Abre Chrome   │
    │ • Preenche      │
    │ • Pausa CAPTCHA │
    └────────┬────────┘
             │
             │ JSON stdout: {"type": "captcha_required"}
             ▼
    ┌─────────────────┐
    │   Backend       │
    │ Atualiza status │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   Mobile        │
    │ (polling GET)   │
    │ status =        │
    │ aguardando_     │
    │ captcha         │
    └────────┬────────┘
             │
             │ Abre WebView
             │ Usuário resolve CAPTCHA
             │
             │ POST /captcha-resolvido/:session_id
             ▼
    ┌─────────────────┐
    │   Backend       │
    │ Envia "continue"│
    │ para Python     │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Python Scraper  │
    │ • Continua      │
    │ • Extrai dados  │
    │ • Salva API     │
    └────────┬────────┘
             │
             │ JSON: {"type": "compra_criada"}
             ▼
    ┌─────────────────┐
    │   Backend       │
    │ status=concluido│
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   Mobile        │
    │ Exibe sucesso   │
    └─────────────────┘
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api/scraper
```

---

### 1. Iniciar Consulta

**Endpoint:** `POST /scraper/consultas`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "qrcodeTexto": "35251005088303000121590006146504781051248106|20251031103830|83.09||JewGEhBbHavStPy3r6DIDCK..."
}
```

**Response 201:**
```json
{
  "sessionId": "abc-123-def-456",
  "status": "iniciando",
  "progress": 0,
  "createdAt": "2025-11-07T00:00:00.000Z"
}
```

**Errors:**
- `400` - Limite de consultas simultâneas atingido
- `401` - Não autenticado

---

### 2. Consultar Status

**Endpoint:** `GET /scraper/consultas/:sessionId`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "sessionId": "abc-123-def-456",
  "status": "aguardando_captcha",
  "progress": 50,
  "createdAt": "2025-11-07T00:00:00.000Z",
  "captchaUrl": "https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx"
}
```

**Status Possíveis:**
- `iniciando` - Iniciando processo
- `consultando_sat` - Acessando site da Fazenda
- `aguardando_captcha` - ⚠️ **Mobile deve abrir WebView**
- `processando_dados` - Extraindo produtos do cupom
- `salvando_api` - Salvando na API CookMe
- `concluido` - ✅ Compra salva com sucesso
- `erro` - ❌ Erro no processo
- `timeout` - ⏱️ Tempo limite excedido
- `cancelado` - 🚫 Cancelado pelo usuário

**Response quando concluído:**
```json
{
  "sessionId": "abc-123-def-456",
  "status": "concluido",
  "progress": 100,
  "createdAt": "2025-11-07T00:00:00.000Z",
  "compraId": "xyz-789",
  "totalProdutos": 3,
  "valorTotal": 83.09
}
```

**Response quando erro:**
```json
{
  "sessionId": "abc-123-def-456",
  "status": "erro",
  "progress": 50,
  "createdAt": "2025-11-07T00:00:00.000Z",
  "erro": "Timeout ao aguardar CAPTCHA"
}
```

---

### 3. Notificar CAPTCHA Resolvido

**Endpoint:** `POST /scraper/consultas/:sessionId/captcha-resolvido`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "message": "CAPTCHA confirmado, processamento continuando"
}
```

**Errors:**
- `400` - Sessão não está aguardando CAPTCHA
- `404` - Sessão não encontrada

---

### 4. Cancelar Consulta

**Endpoint:** `DELETE /scraper/consultas/:sessionId`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `204 No Content`

---

### 5. Listar Minhas Consultas

**Endpoint:** `GET /scraper/minhas-consultas`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
[
  {
    "sessionId": "abc-123",
    "status": "concluido",
    "progress": 100,
    "createdAt": "2025-11-07T00:00:00.000Z",
    "compraId": "xyz-789",
    "totalProdutos": 3,
    "valorTotal": 83.09
  },
  {
    "sessionId": "def-456",
    "status": "erro",
    "progress": 50,
    "createdAt": "2025-11-07T00:00:00.000Z",
    "erro": "Timeout"
  }
]
```

---

## 📱 Fluxo no Mobile (React Native / Flutter)

### Pseudocódigo

```typescript
// 1. Usuário scanneia QR Code
const qrcodeTexto = await scanQRCode();

// 2. Iniciar consulta
const response = await api.post('/scraper/consultas', {
  qrcodeTexto
});

const { sessionId } = response.data;

// 3. Polling de status (a cada 2 segundos)
const pollStatus = setInterval(async () => {
  const status = await api.get(`/scraper/consultas/${sessionId}`);

  // Atualizar UI com progresso
  updateProgress(status.progress);

  switch (status.status) {
    case 'aguardando_captcha':
      // IMPORTANTE: Abrir WebView para resolver CAPTCHA
      clearInterval(pollStatus);
      await openCaptchaWebView(status.captchaUrl, sessionId);
      // Após resolver, retomar polling
      pollStatus = setInterval(...);
      break;

    case 'concluido':
      clearInterval(pollStatus);
      showSuccess(status.compraId, status.valorTotal);
      break;

    case 'erro':
      clearInterval(pollStatus);
      showError(status.erro);
      break;
  }
}, 2000);

// 4. Função para abrir WebView do CAPTCHA
async function openCaptchaWebView(url, sessionId) {
  const resolved = await showModal({
    title: 'Resolver CAPTCHA',
    component: <WebView source={{ uri: url }} />
  });

  if (resolved) {
    // Notificar backend
    await api.post(`/scraper/consultas/${sessionId}/captcha-resolvido`);
  }
}
```

---

## 🔐 Autenticação

Todas as requisições precisam do header:
```
Authorization: Bearer {access_token}
```

O `access_token` é obtido via:
```
POST /api/auth/login
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

---

## ⚙️ Configurações

### Limites

- **Consultas simultâneas:** 5 (por servidor)
- **Timeout sessão:** 10 minutos
- **Polling recomendado:** A cada 2-3 segundos

### Performance

- Sessões expiradas são removidas automaticamente
- Processos Python órfãos são terminados após timeout

---

## 🧪 Testando com Postman

### 1. Login
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "eduardo@ocdigital.com.br",
  "senha": "3221#Edu"
}
```

Copiar `access_token` da resposta.

### 2. Iniciar Consulta
```http
POST http://localhost:3000/api/scraper/consultas
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "qrcodeTexto": "35251005088303000121590006146504781051248106|20251031103830|83.09||JewGEhBbHavStPy3r6DIDCK..."
}
```

Copiar `sessionId` da resposta.

### 3. Consultar Status (repetir até concluir)
```http
GET http://localhost:3000/api/scraper/consultas/{sessionId}
Authorization: Bearer {access_token}
```

### 4. Se status = `aguardando_captcha`:
- Abrir `captchaUrl` no navegador
- Resolver CAPTCHA
- Chamar:

```http
POST http://localhost:3000/api/scraper/consultas/{sessionId}/captcha-resolvido
Authorization: Bearer {access_token}
```

### 5. Continuar consultando status até `concluido`

---

## ⚠️ Tratamento de Erros

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `400 - Limite atingido` | Muitas consultas simultâneas | Aguardar ou cancelar outra |
| `404 - Sessão não encontrada` | Sessão expirou | Iniciar nova consulta |
| `Timeout` | CAPTCHA não resolvido em 10min | Tentar novamente |
| `Processo encerrado` | Erro no Python | Verificar logs do servidor |

### Mobile deve tratar:

```typescript
try {
  const response = await api.post('/scraper/consultas', data);
  // ...
} catch (error) {
  if (error.response?.status === 400) {
    showAlert('Limite de consultas atingido. Tente em alguns minutos.');
  } else if (error.response?.status === 401) {
    // Token expirado, fazer login novamente
    await refreshToken();
  } else {
    showAlert('Erro ao processar cupom. Tente novamente.');
  }
}
```

---

## 📊 Swagger / OpenAPI

Acesse a documentação interativa em:
```
http://localhost:3000/api/docs
```

Busque pela tag **"Scraper"**.

---

## 🚀 Próximos Passos

### Para implementar no mobile:

1. **Criar tela de scan QR Code**
2. **Implementar polling de status**
3. **Criar WebView para CAPTCHA**
   - Abrir URL fornecida pela API
   - Detectar quando usuário resolveu
   - Notificar backend
4. **Exibir progresso visual**
   - Loading spinner
   - Barra de progresso (0-100%)
   - Status textual
5. **Tratamento de erros**
   - Timeout
   - Cancelamento
   - Retry

### Melhorias Futuras

- [ ] WebSocket ao invés de polling
- [ ] Notificação push quando concluir
- [ ] Fila de jobs para escalabilidade
- [ ] Suporte para outros tipos de cupons (NFC-e)
- [ ] CAPTCHA automático (serviços de terceiros)

---

## 📞 Suporte

Em caso de dúvidas, consulte:
- [README.md](README.md) - Visão geral
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura técnica
- [lib/MIGRATION_API_MODE.md](lib/MIGRATION_API_MODE.md) - Modificações Python
- API Docs: http://localhost:3000/api/docs

---

**Implementado em:** 2025-11-07
**Última atualização:** 2025-11-07
