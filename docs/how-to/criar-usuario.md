# 👤 Como Criar um Usuário no CookMe

## ⚠️ Problema

O banco de dados está vazio! Não há usuários de demonstração. Você precisa registrar um novo usuário antes de fazer login.

## ✅ Solução Rápida

### Método 1: Via Postman/Insomnia (Recomendado)

**Passo 1:** Abra Postman ou Insomnia

**Passo 2:** Crie uma nova requisição

```
Método: POST
URL: http://localhost:3000/api/auth/register
Content-Type: application/json
```

**Passo 3:** Cole este JSON no Body:

```json
{
  "email": "teste@email.com",
  "password": "senha123",
  "name": "Usuário Teste"
}
```

**Passo 4:** Clique em "Send"

**Resultado esperado (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "teste@email.com",
  "name": "Usuário Teste",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Método 2: Via cURL (Linha de Comando)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'
```

---

### Método 3: Via Frontend (Se estiver rodando)

1. Acesse <http://localhost:5173>
2. Procure pela página de registro/signup
3. Preencha o formulário com:
   - Email: <teste@email.com>
   - Senha: senha123
   - Nome: Usuário Teste
4. Clique em "Registrar"

---

## 🔐 Fazer Login

Após registrar, você pode fazer login:

### Via Postman/Insomnia

```
Método: POST
URL: http://localhost:3000/api/auth/login
Content-Type: application/json

Body:
{
  "email": "teste@email.com",
  "password": "senha123"
}
```

**Resposta esperada:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "teste@email.com",
  "name": "Usuário Teste",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📋 Usar o Token de Acesso

Após fazer login, copie o `access_token` e use em requisições protegidas:

### Header de Autorização

```
Authorization: Bearer {seu_access_token_aqui}
```

### Exemplo com cURL

```bash
curl -X GET http://localhost:3000/api/usuarios/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo no Postman

1. Vá para a aba "Headers"
2. Adicione uma nova header:
   - Key: `Authorization`
   - Value: `Bearer {seu_token}`

---

## 🗄️ Criar Usuário Diretamente no Banco (Avançado)

Se preferir inserir usuários direto no PostgreSQL:

```bash
# Abra o prompt do PostgreSQL
docker-compose exec postgres psql -U cookme -d cookme_db

# Execute (dentro do psql):
INSERT INTO usuarios (email, nome, senha, created_at, updated_at)
VALUES (
  'teste@email.com',
  'Usuário Teste',
  'senha123',
  NOW(),
  NOW()
);

# Sair
\q
```

---

## ✨ Credenciais de Exemplo Prontas

Copie e cole estas credenciais ao registrar:

| Campo | Valor |
|-------|-------|
| Email | <teste@email.com> |
| Senha | senha123 |
| Nome | Usuário Teste |

---

## 🆘 Troubleshooting

### Erro: "email already exists"

Significa que o usuário já foi registrado. Use as credenciais para fazer login.

### Erro: 500 Internal Server Error

- Verifique se o backend está rodando (`npm run start:dev`)
- Verifique se o PostgreSQL está rodando (`docker-compose ps`)
- Veja os logs do backend

### Erro: "Invalid email format"

Use um email com formato válido: `usuario@dominio.com`

### Erro: "Password too short"

A senha deve ter pelo menos 6 caracteres

---

## 📚 Próximos Passos

1. ✅ Registre um usuário
2. ✅ Faça login
3. ✅ Copie o token de acesso
4. ✅ Use o token para testar endpoints protegidos
5. 📖 Veja a [Referência de Endpoints](/referencia/endpoints) para todos os endpoints

---

**Pronto! Agora você pode usar a API! 🚀**
