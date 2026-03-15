# Frontend Setup - WebSocket Notificações

## Como Fazer Login e Conectar ao WebSocket

### 1. Após Login, Armazene o usuarioId

No seu auth service/context, após login bem-sucedido:

```typescript
// Após autenticação
localStorage.setItem('usuarioId', user.id);
localStorage.setItem('access_token', response.access_token);
```

### 2. O Hook useNotificacoes vai Conectar Automaticamente

```typescript
const usuarioId = localStorage.getItem('usuarioId');
const { notifications, isConnected } = useNotificacoes(usuarioId);
```

### 3. Status de Conexão

- 🟢 **Verde** = WebSocket conectado (tempo real)
- 🟡 **Amarelo** = Fallback polling ativo (servidor desconectado)

---

## Testando

### Credenciais de Teste:
```
Email: admin@test.com
Senha: Test@123456
```

### 1. Fazer Login
1. Abra http://localhost:5173
2. Clique em "Login" ou "Admin"
3. Insira as credenciais
4. Após login, o usuarioId será armazenado

### 2. Abrir Sino de Notificações
- Deve aparecer no header superior direito (🔔)
- Clique para abrir dropdown

### 3. Disparar Notificação de Teste
Em outro terminal:
```bash
curl -X POST http://localhost:3000/api/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"novo_usuario"}'
```

### 4. Observar em Tempo Real
- Notificação deve aparecer no dropdown em **< 1 segundo**
- Badge de contagem deve atualizar
- Status WebSocket deve estar 🟢 verde

---

## Solução de Problemas

### Notificação não aparece
1. ✅ Verificar se usuarioId está em localStorage
   ```javascript
   console.log(localStorage.getItem('usuarioId'))
   ```

2. ✅ Abrir DevTools → Network → WS
   - Procurar por conexão em `/socket.io/`
   - Deve estar conectado (verde)

3. ✅ Verificar console para erros
   ```
   WebSocket conectado
   Notificação recebida: { id, tipo, ... }
   ```

### WebSocket desconectado (🟡)
- Backend pode estar desligado
- Firewall pode bloquear WebSocket
- Frontend caiu para polling automático
- Reconectará quando backend voltar

---

## Integração com Auth Existente

No seu AuthContext ou AuthService:

```typescript
// Após login bem-sucedido
const handleLoginSuccess = (response: LoginResponse) => {
  // ... seu código de login ...

  // 🔔 Armazenar usuarioId para WebSocket
  localStorage.setItem('usuarioId', response.user.id);
};

// Ao deslogar
const handleLogout = () => {
  // ... seu código de logout ...

  // 🔔 Limpar usuarioId
  localStorage.removeItem('usuarioId');
};
```

---

## Próximos Passos

1. **Integrar em seu login** - Adicione localStorage.setItem('usuarioId', ...)
2. **Testar conexão** - Dispare notificação via cURL
3. **Verificar logs** - Backend deve log: "WebSocket conectado"
4. **Produção** - Remover endpoint `/test/trigger` antes de deploy
