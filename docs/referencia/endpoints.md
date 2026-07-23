# 🔌 Endpoints e Portas - CookMe

## 📍 Portas de Acesso

| Serviço | Porta | Protocolo | Status |
| --------- | ------- | ----------- | -------- |
| Backend API | 3000 | HTTP | ✅ Ativo |
| Frontend | 5173 | HTTP | ✅ Ativo |
| Mobile (Expo) | 8081 | HTTP | ✅ Ativo |
| PostgreSQL | 5432 | TCP | 🐳 Docker |
| Redis | 6379 | TCP | 🐳 Docker |

---

## 🌐 URLs Principais

### Backend

- **Base**: <http://localhost:3000>
- **API Docs (Swagger)**: <http://localhost:3000/api/docs>
- **Health Check**: <http://localhost:3000/api/health> (404 esperado)

### Frontend

- **App**: <http://localhost:5173>
- **Dev**: <http://localhost:5173> (hot reload ativado)

### Mobile

- **Expo**: Scan QR code no terminal
- **Tunnel**: Disponível após iniciar `npx expo start`

---

## 🔐 Autenticação

### Endpoints Públicos (sem token)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/produtos
GET    /api/receitas
```

### Endpoints Protegidos (com Bearer token)

```
GET    /api/auth/me
PATCH  /api/usuarios/me
GET    /api/usuarios/me
```

### Como usar token

1. Login: `POST /api/auth/login`
2. Copie o `access_token` da resposta
3. Header: `Authorization: Bearer {seu_token}`

---

## 📚 Endpoints Principais

### Autenticação

```
POST   /api/auth/register        Registrar novo usuário
POST   /api/auth/login           Fazer login
POST   /api/auth/logout          Logout
POST   /api/auth/refresh         Renovar token
GET    /api/auth/me              Obter usuário atual
```

### Usuários

```
GET    /api/usuarios/me          Obter perfil do usuário
PATCH  /api/usuarios/me          Atualizar perfil
POST   /api/usuarios/me/avatar   Upload de avatar
DELETE /api/usuarios/me          Deletar conta
GET    /api/usuarios/preferencias Preferências
PATCH  /api/usuarios/preferencias Atualizar preferências
```

### Produtos

```
GET    /api/produtos             Listar produtos
POST   /api/produtos             Criar produto
GET    /api/produtos/:id         Obter produto
PATCH  /api/produtos/:id         Atualizar produto
DELETE /api/produtos/:id         Deletar produto
GET    /api/produtos/search      Buscar produtos
GET    /api/produtos/barcode/:codigo Buscar por barcode
```

### Receitas

```
GET    /api/receitas             Listar receitas
POST   /api/receitas             Criar receita
GET    /api/receitas/:id         Obter receita
PUT    /api/receitas/:id         Atualizar receita
DELETE /api/receitas/:id         Deletar receita
GET    /api/receitas/sugestoes   Sugestões de receitas
GET    /api/receitas/executadas  Receitas executadas
POST   /api/receitas/:id/executar Executar receita
POST   /api/receitas/gerar-com-ia Gerar com IA
POST   /api/receitas/gerar-do-inventario Gerar do inventário
POST   /api/receitas/gerar-semana Gerar semana
```

### Inventário

```
GET    /api/inventario           Listar itens
POST   /api/inventario           Adicionar item
GET    /api/inventario/:id       Obter item
PATCH  /api/inventario/:id       Atualizar item
DELETE /api/inventario/:id       Deletar item
GET    /api/inventario/stats     Estatísticas
GET    /api/inventario/vencendo  Itens vencendo
GET    /api/inventario/vencidos  Itens vencidos
```

### Compras

```
GET    /api/compras              Listar compras
POST   /api/compras              Criar compra
GET    /api/compras/:id          Obter compra
DELETE /api/compras/:id          Deletar compra
GET    /api/compras/stats        Estatísticas
```

### Admin

```
GET    /api/admin/produtos       Listar produtos (admin)
GET    /api/admin/produtos/stats Stats de produtos
GET    /api/admin/usuarios       Listar usuários (admin)
GET    /api/admin/usuarios/stats Stats de usuários
GET    /api/admin/dashboard/stats Dashboard stats
```

### Notificações

```
GET    /api/notificacoes         Listar notificações
GET    /api/notificacoes/unread-count Contar não-lidas
POST   /api/notificacoes/:id/mark-read Marcar como lida
POST   /api/notificacoes/mark-all-read Marcar todas como lidas
DELETE /api/notificacoes/:id     Deletar notificação
```

### IA

```
POST   /api/ia/classificar-produto Classificar produto
POST   /api/ia/gerar-receita     Gerar receita
POST   /api/ia/sugerir-compras   Sugerir compras
GET    /api/ia/analisar-nutricional Análise nutricional
```

### Scraper

```
POST   /api/scraper/consultas    Criar consulta
GET    /api/scraper/consultas/:sessionId Obter consulta
POST   /api/scraper/consultas/:sessionId/captcha-resolvido Resolver CAPTCHA
DELETE /api/scraper/consultas/:sessionId Cancelar consulta
GET    /api/scraper/minhas-consultas Minhas consultas
DELETE /api/scraper/minhas-consultas Deletar minhas consultas
```

### Barcode

```
GET    /api/barcode/scan/:codigo Escanear código
```

### Affiliate

```
POST   /api/api/affiliate/registrar-clique Registrar clique
GET    /api/api/affiliate/links/:receitaId Links da receita
GET    /api/api/affiliate/estatisticas Estatísticas
GET    /api/api/affiliate/comissoes Comissões
GET    /api/api/affiliate/recomendacoes/com-meus-alimentos Recomendações
GET    /api/api/affiliate/recomendacoes/incentivo-compra Incentivos
POST   /api/api/affiliate/recomendacoes/:recId/clique Clique recomendação
GET    /api/api/affiliate/subscriptions/status Status assinatura
POST   /api/api/affiliate/subscriptions/criar Criar assinatura
POST   /api/api/affiliate/subscriptions/:assinaturaId/atualizar Atualizar
POST   /api/api/affiliate/subscriptions/:assinaturaId/cancelar Cancelar
GET    /api/api/affiliate/subscriptions/features/:feature Features
```

### Product Classification

```
GET    /api/api/product-classification/classify/:productName Classificar
POST   /api/api/product-classification/classify-batch Batch
POST   /api/api/product-classification/inventory/add Adicionar ao inventário
POST   /api/api/product-classification/validate Validar
GET    /api/api/product-classification/history/:productName Histórico
GET    /api/api/product-classification/statistics Estatísticas
GET    /api/api/product-classification/alimentos Alimentos
GET    /api/api/product-classification/nao-alimentos Não-alimentos
```

---

## 💾 Databases

### PostgreSQL

```
Host: localhost
Port: 5432
Username: cookme
Password: cookme123
Database: cookme_db
```

### Redis

```
Host: localhost
Port: 6379
Database: 0
```

---

## 📝 Headers Recomendados

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {seu_access_token}"
}
```

---

## 🧪 Teste Rápido

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@test.com","password":"senha123","name":"Teste"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@test.com","password":"senha123"}'

# 3. Use o token retornado
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer {seu_token}"
```

---

## 📱 Versão Mobile

A API é a mesma, mas consumida via `axios` ou `fetch`:

```javascript
// React Native
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

---

## ⚠️ Notas Importantes

- **CORS**: Habilitado para `localhost:5173` (frontend)
- **Rate Limit**: Não implementado (pode adicionar depois)
- **Validação**: Aplicada no backend
- **Erros**: Veja `/api/docs` para detalhes de cada erro
- **Timeout**: 30 segundos por padrão

---

## 🔗 Links Úteis

- API Docs: <http://localhost:3000/api/docs>
- Frontend: <http://localhost:5173>
- Postman Collection: Pode ser gerada via `/api/docs`
- Mobile Expo: Scan QR code no terminal

**Pronto para testar!** 🚀
