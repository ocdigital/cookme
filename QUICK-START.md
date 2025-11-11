# CookMe - Quick Start Guide

> Guia rápido para rodar o projeto localmente em 5 minutos

---

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.12+
- **Docker** e Docker Compose
- **Git**

---

## 🚀 Setup Rápido

### 1. Clonar Repositório

```bash
git clone <url-do-repositorio>
cd cookme
```

### 2. Backend (NestJS)

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
# ⚠️ Editar .env se necessário (secrets JWT)

# Subir containers (PostgreSQL, Redis, pgAdmin)
docker-compose up -d

# ⚠️ Aguardar ~10 segundos para containers iniciarem

# Rodar migrations (QUANDO CRIADAS)
# npm run migration:run

# Rodar seeds (QUANDO CRIADOS)
# npm run seed

# Iniciar backend
npm run start:dev
```

**✅ Backend rodando em:** http://localhost:3000/api
**✅ Swagger/Docs em:** http://localhost:3000/api/docs

---

### 3. Verificar Serviços

#### PostgreSQL
```bash
# Via pgAdmin
# URL: http://localhost:5050
# Login: admin@cookme.com / admin123

# Registrar servidor:
# - Name: CookMe
# - Host: postgres (ou localhost se fora do Docker)
# - Port: 5432
# - Database: cookme_db
# - Username: cookme
# - Password: cookme123
```

#### Redis
```bash
# Testar conexão
docker exec -it cookme-redis redis-cli
> PING
# Deve retornar: PONG
```

---

### 4. Testar API

#### Opção 1: Swagger (Recomendado)

1. Acesse http://localhost:3000/api/docs
2. Clique em **"POST /api/auth/register"**
3. Try it out
4. Execute com:
```json
{
  "email": "teste@email.com",
  "senha": "senha123",
  "nome": "Teste User"
}
```
5. Copie o `access_token` da resposta
6. Clique em **"Authorize"** (canto superior direito)
7. Cole o token: `Bearer {token}`
8. Agora pode testar todos os endpoints autenticados

#### Opção 2: Postman

1. Importar collection: `backend/CookMe-API.postman_collection.json`
2. Executar "Register" ou "Login"
3. Token será salvo automaticamente nas variáveis
4. Testar outros endpoints

#### Opção 3: cURL

```bash
# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "senha": "senha123",
    "nome": "Teste User"
  }'

# Copiar access_token da resposta

# Testar endpoint autenticado
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

### 5. Scraper Python (Opcional)

```bash
cd ../lib

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar credenciais da API
cp config.example.json config.json

# Editar config.json com suas credenciais:
# {
#   "api_base_url": "http://localhost:3000/api",
#   "api_email": "seu_email_cadastrado",
#   "api_senha": "sua_senha"
# }

# Rodar scraper (modo interativo)
python captcha_manual.py

# Cole o texto do QR Code do cupom SAT quando solicitado
# Resolva o CAPTCHA manualmente
# Aguarde o processamento
```

---

## 🎯 Endpoints Principais

### Auth
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário

### Produtos
- `POST /api/produtos` - Criar produto
- `GET /api/produtos` - Listar produtos
- `GET /api/produtos/barcode/:codigo` - Buscar por código de barras

### Compras
- `POST /api/compras` - Registrar compra
- `GET /api/compras` - Listar compras
- `GET /api/compras/stats` - Estatísticas

### Inventário
- `GET /api/inventario` - Ver estoque
- `GET /api/inventario/vencendo?days=7` - Produtos vencendo
- `GET /api/inventario/stats` - Estatísticas

### Receitas (Motor MOI)
- `GET /api/receitas/sugestoes` - ⭐ Sugestões inteligentes
- `POST /api/receitas` - Criar receita
- `POST /api/receitas/:id/executar` - Executar receita

---

## 🔍 Verificar Status

### Backend está rodando?
```bash
curl http://localhost:3000/api/auth/me
# Deve retornar 401 (não autenticado) - está funcionando!
```

### PostgreSQL está rodando?
```bash
docker ps | grep postgres
# Deve listar o container
```

### Redis está rodando?
```bash
docker ps | grep redis
# Deve listar o container
```

---

## 🐛 Problemas Comuns

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo usando a porta
lsof -i :3000
# ou
netstat -ano | findstr :3000  # Windows

# Matar processo
kill -9 <PID>
```

### Erro: "Cannot connect to PostgreSQL"
```bash
# Verificar se container está rodando
docker ps -a | grep postgres

# Reiniciar container
docker-compose restart postgres

# Ver logs
docker logs cookme-postgres
```

### Erro: "Migrations not found"
```bash
# Migrations ainda não foram criadas
# Por enquanto, o TypeORM criará as tabelas automaticamente
# em modo development (synchronize: true)
```

### Erro no Python: "Module not found"
```bash
# Verificar se está no venv
which python  # Deve apontar para venv/bin/python

# Reinstalar dependências
pip install -r requirements.txt
```

---

## 📊 Fluxo Completo de Teste

```bash
# 1. Registrar usuário
POST /api/auth/register
{
  "email": "teste@email.com",
  "senha": "senha123",
  "nome": "Teste User"
}

# 2. Criar um produto
POST /api/produtos
{
  "nome": "Arroz Branco 1kg",
  "codigo_barras": "7891234567890",
  "unidade_padrao": "kg",
  "validade_media_dias": 365
}

# 3. Criar uma compra
POST /api/compras
{
  "data_compra": "2025-11-08",
  "local_compra": "Supermercado Teste",
  "valor_total": 15.99,
  "metodo_cadastro": "manual",
  "itens": [
    {
      "produto_id": "<ID_DO_PRODUTO_CRIADO>",
      "quantidade": 1,
      "unidade": "kg",
      "preco_unitario": 15.99,
      "validade_final": "2026-11-08"
    }
  ]
}

# 4. Ver inventário (deve conter o arroz)
GET /api/inventario

# 5. Criar uma receita
POST /api/receitas
{
  "nome": "Arroz Simples",
  "modo_preparo": "Cozinhe o arroz em água fervente",
  "tempo_preparo": 20,
  "rendimento_porcoes": 4,
  "dificuldade": "facil",
  "categoria_receita": "almoco",
  "ingredientes": [
    {
      "produto_id": "<ID_DO_PRODUTO>",
      "quantidade": 0.5,
      "unidade": "kg",
      "opcional": false,
      "ordem": 1
    }
  ]
}

# 6. Ver sugestões do Motor MOI
GET /api/receitas/sugestoes
# Deve retornar "Arroz Simples" com score alto
```

---

## 📚 Documentação Completa

- **[PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md)** - Conhecimento completo do projeto (para Claude)
- **[README.md](README.md)** - Visão geral
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura técnica
- **[backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md)** - Contexto detalhado do backend
- **[backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md)** - Checklist de tarefas
- **[MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md)** - Integração com mobile

---

## ⚙️ Comandos Úteis

### Backend
```bash
npm run start:dev       # Dev server (hot reload)
npm run build           # Build para produção
npm run start:prod      # Rodar build de produção
npm run test            # Testes unitários
npm run test:e2e        # Testes E2E
npm run lint            # Verificar código
npm run format          # Formatar código
```

### Database
```bash
npm run migration:generate  # Gerar migration
npm run migration:run       # Rodar migrations
npm run migration:revert    # Reverter última migration
npm run seed                # Popular banco
```

### Docker
```bash
docker-compose up -d        # Subir serviços
docker-compose down         # Parar serviços
docker-compose logs -f      # Ver logs em tempo real
docker-compose restart      # Reiniciar serviços
docker-compose ps           # Status dos containers
```

---

## 🎉 Pronto!

Se tudo funcionou:
- ✅ Backend rodando em http://localhost:3000/api
- ✅ Swagger em http://localhost:3000/api/docs
- ✅ PostgreSQL acessível via pgAdmin
- ✅ Você conseguiu registrar um usuário e fazer login
- ✅ Testou alguns endpoints

**Próximos passos:**
1. Criar migrations e seeds
2. Implementar testes
3. Finalizar scraper modo API
4. Deploy em produção

---

**Dúvidas?** Consulte [PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md) ou entre em contato.
