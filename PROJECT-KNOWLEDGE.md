# CookMe - Conhecimento Completo do Projeto

> **Documento Principal para Claude Projects**
> Última atualização: 2025-11-08

---

## 🎯 O que é o CookMe?

**CookMe** é um Motor de Otimização de Inventário (MOI) que:
- Gerencia inventário de alimentos domésticos
- Cadastra compras via cupom fiscal SAT automaticamente
- Alerta sobre produtos próximos ao vencimento
- **Sugere receitas inteligentes** baseadas no que você tem em casa
- Reduz desperdício e economiza dinheiro

---

## 📂 Estrutura do Projeto

```
cookme/
├── backend/              # ✅ API REST NestJS + TypeORM (COMPLETO 80%)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Autenticação JWT
│   │   │   ├── usuarios/       # Usuários e preferências
│   │   │   ├── produtos/       # Catálogo de produtos
│   │   │   ├── compras/        # Registro de compras
│   │   │   ├── inventario/     # Gestão de estoque
│   │   │   ├── receitas/       # Receitas + Motor MOI
│   │   │   ├── barcode/        # Scanner de códigos
│   │   │   └── scraper/        # ✅ Integração com Python (NOVO)
│   │   ├── common/       # Guards, decorators, pipes
│   │   └── config/       # Configurações (DB, app)
│   ├── CookMe-API.postman_collection.json  # 42 endpoints
│   ├── PROJETO-CONTEXT.md      # Documentação detalhada backend
│   ├── RESUMO-RAPIDO.md        # Resumo executivo
│   └── TODO-CHECKLIST.md       # Checklist de tarefas
│
├── lib/                  # ✅ Scraper Python (85% - falta modo API)
│   ├── captcha_manual.py       # Script principal
│   ├── config.example.json     # Credenciais API
│   ├── MIGRATION_API_MODE.md   # ⚠️ Modificações pendentes
│   └── README.md
│
├── mobile/               # ❌ VAZIO (não iniciado)
│
├── landingpage/          # Landing page do produto
│
├── README.md             # Visão geral
├── ARCHITECTURE.md       # Arquitetura técnica
├── MOBILE_INTEGRATION.md # Integração Backend ↔ Mobile
└── PROJECT-KNOWLEDGE.md  # ← ESTE ARQUIVO
```

---

## 🏗️ Stack Tecnológica

### Backend (NestJS)
- **Framework:** NestJS 11
- **Linguagem:** TypeScript 5.7
- **ORM:** TypeORM 0.3.27 (**NÃO Prisma!** Alguns docs estão desatualizados)
- **Banco:** PostgreSQL 15
- **Cache:** Redis 7
- **Auth:** JWT (passport-jwt)
- **Validação:** class-validator + class-transformer
- **Docs:** Swagger/OpenAPI
- **Testes:** Jest (ainda não implementados)

### Scraper (Python)
- **Linguagem:** Python 3.12
- **Automação:** Selenium WebDriver
- **HTTP:** Requests
- **Navegador:** Chrome/ChromeDriver

### Deploy & Infraestrutura
- **Container:** Docker Compose
- **Serviços:** PostgreSQL, Redis, pgAdmin
- **Deploy:** Pendente (não configurado)

---

## 🗄️ Banco de Dados (PostgreSQL + TypeORM)

### Entidades (11 tabelas)

**Core:**
- `usuarios` - Dados do usuário (id, email, senha hash, nome, role)
- `preferencias` - Preferências alimentares (1:1 com usuarios)

**Catálogo:**
- `produtos` - Catálogo de produtos
- `marcas` - Marcas (Tio João, Nestlé, etc)
- `categorias` - Categorias hierárquicas (Grãos, Laticínios, etc)

**Transações:**
- `compras` - Histórico de compras
- `compras_itens` - Itens de cada compra (relação N:M com produtos)

**Inventário:**
- `inventario` - Estoque atual do usuário

**Receitas:**
- `receitas` - Receitas cadastradas
- `receitas_ingredientes` - Ingredientes de cada receita
- `receitas_executadas` - Histórico de receitas executadas

**Relacionamentos importantes:**
```
Usuario 1:N Compras
Usuario 1:N Inventario
Usuario 1:N Receitas
Compra 1:N ComprasItens
Produto 1:N ComprasItens
Produto 1:N Inventario
Receita 1:N ReceitasIngredientes
```

---

## 🔌 API REST (42 Endpoints)

### Módulos Implementados (8/8 - 100%)

#### 1. Auth (5 endpoints)
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`

#### 2. Usuarios (5 endpoints)
- GET `/api/usuarios/me`
- PATCH `/api/usuarios/me`
- DELETE `/api/usuarios/me`
- GET `/api/usuarios/preferencias`
- PATCH `/api/usuarios/preferencias`

#### 3. Produtos (12 endpoints)
- CRUD produtos (6)
- Marcas (3)
- Categorias (3)
- Busca por barcode

#### 4. Compras (5 endpoints)
- Criar compra com itens
- Listar compras
- Buscar por ID
- Estatísticas
- Deletar

#### 5. Inventario (8 endpoints)
- CRUD inventário
- Listar itens vencendo
- Listar itens vencidos
- Estatísticas

#### 6. Receitas (7 endpoints)
- CRUD receitas
- **GET `/api/receitas/sugestoes`** ← Motor MOI (sugestões inteligentes)
- Executar receita (atualiza inventário)
- Histórico de receitas executadas

#### 7. Barcode (1 endpoint)
- GET `/api/barcode/scan/:codigo`

#### 8. Scraper (5 endpoints) ✅ NOVO
- POST `/api/scraper/consultas` - Iniciar consulta de cupom
- GET `/api/scraper/consultas/:id` - Status (polling)
- POST `/api/scraper/consultas/:id/captcha-resolvido` - Notificar CAPTCHA
- DELETE `/api/scraper/consultas/:id` - Cancelar
- GET `/api/scraper/minhas-consultas` - Listar consultas do usuário

---

## 🧠 Motor MOI (Sugestões Inteligentes)

**Endpoint:** `GET /api/receitas/sugestoes`

**Algoritmo:**
1. Busca inventário do usuário
2. Busca todas as receitas
3. Para cada receita:
   - Calcula % de ingredientes disponíveis
   - Prioriza produtos próximos ao vencimento (urgência)
   - Verifica compatibilidade com restrições alimentares
   - Calcula score = (disponibilidade × 0.7) + (urgência × 0.3)
4. Retorna top receitas ordenadas por score

**Exemplo de resposta:**
```json
[
  {
    "receita_id": "xyz",
    "nome": "Arroz com Feijão",
    "score": 0.95,
    "ingredientes_disponiveis": 100,
    "ingredientes_faltantes": 0,
    "urgencia": "alta" // Ingredientes vencendo em breve
  }
]
```

---

## 🔄 Fluxo: Cadastro de Compra via Cupom Fiscal

### **Arquitetura:**

```
Mobile App (React Native)
    ↓
 1. Scan QR Code
    ↓
 2. POST /api/scraper/consultas { qrcodeTexto }
    ↓
Backend NestJS (ScraperService)
    ↓
 3. Cria sessão (sessionId)
 4. Spawna processo Python
    ↓
Python (captcha_manual.py --mode api)
    ↓
 5. Abre Chrome, acessa site Fazenda SP
 6. Preenche chave de acesso
 7. Pausa para CAPTCHA
 8. Envia JSON: {"type": "captcha_required"}
    ↓
Backend atualiza status = "aguardando_captcha"
    ↓
Mobile (polling GET /scraper/consultas/:id)
    ↓
 9. Detecta status = "aguardando_captcha"
10. Abre WebView com URL do site
11. Usuário resolve CAPTCHA
12. POST /captcha-resolvido/:id
    ↓
Backend envia "continue" para Python (stdin)
    ↓
Python continua:
13. Extrai dados do cupom (produtos, valores)
14. Para cada produto:
    - Busca por barcode na API
    - Se não existe, cria produto
15. Registra compra completa na API
16. Envia JSON: {"type": "compra_criada", "compraId": "..."}
    ↓
Backend atualiza status = "concluido"
    ↓
Mobile (polling detecta "concluido")
17. Exibe sucesso ✅
```

---

## ⚠️ STATUS ATUAL E TAREFAS PENDENTES

### ✅ O que está PRONTO (80%)

1. **Backend API** - 7.5/8 módulos funcionais
   - ✅ Auth (JWT completo)
   - ✅ Usuarios
   - ✅ Produtos
   - ✅ Compras
   - ✅ Inventario
   - ✅ Receitas + Motor MOI
   - ✅ Barcode
   - ✅ Scraper (backend NestJS)

2. **Scraper Python** - 85%
   - ✅ Leitura QR Code SAT-SP
   - ✅ Automação Selenium
   - ✅ Extração de dados do cupom
   - ✅ Integração com API CookMe
   - ⏳ **Falta:** Modo API (argumentos CLI e comunicação via JSON)

3. **Documentação**
   - ✅ Swagger completo
   - ✅ Postman Collection (42 requests)
   - ✅ README, ARCHITECTURE
   - ✅ MOBILE_INTEGRATION
   - ✅ Este arquivo (PROJECT-KNOWLEDGE)

4. **Docker**
   - ✅ PostgreSQL + Redis + pgAdmin configurados

### ❌ O que está FALTANDO (20%)

#### 🔴 CRÍTICO (bloqueia MVP)

1. **Scraper Python - Modo API**
   - Ver `backend/lib/MIGRATION_API_MODE.md` para detalhes
   - Modificações necessárias em `captcha_manual.py`:
     - Adicionar `argparse` para `--mode api --session-id xxx --qrcode "..."`
     - Implementar comunicação via JSON (stdout)
     - Implementar aguardar "continue" (stdin)

2. **Migrations TypeORM**
   - Comando disponível: `npm run migration:generate`
   - Precisa criar migrations iniciais
   - Rodar `npm run migration:run`

3. **Seeds do Banco**
   - Criar categorias padrão (Grãos, Laticínios, etc)
   - Criar marcas populares
   - Criar produtos básicos
   - Criar receitas populares

4. **Testes**
   - Unit tests (0/7 services)
   - E2E tests (0/8 módulos)
   - Coverage: 0% (meta: 70%)

#### 🟡 IMPORTANTE (produção-ready)

5. **Segurança**
   - Trocar JWT secrets (`.env`)
   - Rate limiting
   - Helmet.js

6. **Integrações Externas**
   - Open Food Facts API (barcode)
   - Cache Redis

7. **Notificações**
   - Cron job para alertas de validade
   - Email (Nodemailer)

8. **Deploy**
   - CI/CD (GitHub Actions)
   - Cloud provider (AWS/GCP/Heroku)
   - Monitoramento (Sentry)

---

## 🚀 Como Rodar Localmente

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com credenciais

# Subir containers
docker-compose up -d

# Rodar migrations (QUANDO CRIADAS)
npm run migration:run

# Rodar seeds (QUANDO CRIADOS)
npm run seed

# Iniciar dev server
npm run start:dev
```

**API:** http://localhost:3000/api
**Swagger:** http://localhost:3000/api/docs
**pgAdmin:** http://localhost:5050 (admin@cookme.com / admin123)

### 2. Scraper Python

```bash
cd lib

# Criar venv
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar API
cp config.example.json config.json
# Editar config.json com credenciais da API

# Rodar modo interativo (ATUAL)
python captcha_manual.py

# Modo API (APÓS MODIFICAÇÕES)
python captcha_manual.py --mode api --session-id abc-123 --qrcode "35251..."
```

---

## 📊 Progresso Geral

```
Backend Core:     ████████████████████░  94% (7.5/8 módulos)
Scraper Python:   █████████████████░░░  85% (modo API pendente)
Migrations/Seeds: ░░░░░░░░░░░░░░░░░░░░   0%
Testes:          ░░░░░░░░░░░░░░░░░░░░   0%
Deploy:          ░░░░░░░░░░░░░░░░░░░░   0%
Mobile:          ░░░░░░░░░░░░░░░░░░░░   0%

TOTAL MVP:       ████████░░░░░░░░░░░░  40%
```

---

## 🎯 Próximos Passos Recomendados

### Esta Semana (MVP Funcional)
1. ✅ Finalizar modo API do Python (ver `lib/MIGRATION_API_MODE.md`)
2. ✅ Criar e rodar migrations
3. ✅ Criar seeds básicos
4. ✅ Testar fluxo completo: QR Code → Scraper → API → Inventário

### Semana 2 (Testes e Segurança)
5. ✅ Implementar testes unitários (70% coverage)
6. ✅ Testes E2E dos fluxos principais
7. ✅ Configurar rate limiting e Helmet
8. ✅ Revisar segurança (secrets, CORS, validações)

### Semana 3 (Produção)
9. ✅ Configurar CI/CD
10. ✅ Deploy em staging
11. ✅ Monitoramento e logs
12. ✅ Deploy em produção

---

## 📞 Recursos Úteis

### Documentação
- [README.md](README.md) - Visão geral
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura técnica
- [backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md) - Contexto detalhado do backend
- [backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md) - Checklist completo
- [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md) - Integração mobile
- [lib/MIGRATION_API_MODE.md](lib/MIGRATION_API_MODE.md) - ⚠️ Modificações Python pendentes

### APIs e Ferramentas
- Swagger: http://localhost:3000/api/docs
- Postman: `backend/CookMe-API.postman_collection.json`
- pgAdmin: http://localhost:5050

### Conectar no PostgreSQL
**Via pgAdmin (de dentro do Docker):**
- Host: `postgres`
- Port: 5432
- Database: `cookme_db`
- User: `cookme`
- Password: `cookme123`

**De fora do Docker (DBeaver, etc):**
- Host: `localhost`
- Port: 5432
- Database: `cookme_db`
- User: `cookme`
- Password: `cookme123`

---

## 🐛 Problemas Conhecidos

1. **README.md raiz menciona Prisma** → Backend usa TypeORM (precisa atualizar)
2. **ARCHITECTURE.md menciona Prisma** → Backend usa TypeORM (precisa atualizar)
3. **Python scraper não tem modo API** → Precisa modificações (ver `lib/MIGRATION_API_MODE.md`)
4. **Sem migrations criadas** → Precisa gerar e rodar
5. **Sem seeds** → Precisa criar dados iniciais
6. **Sem testes** → Coverage 0%

---

## 💡 Dicas para o Claude Code

### Ao trabalhar no backend:
- ORM é **TypeORM**, não Prisma
- Entities estão em `src/modules/*/entities/*.entity.ts`
- Guards globais JWT ativos, use `@Public()` para rotas públicas
- Validação com class-validator em DTOs
- Swagger tags por módulo

### Ao trabalhar no scraper:
- Script principal: `lib/captcha_manual.py`
- Ver `lib/MIGRATION_API_MODE.md` para modificações necessárias
- Modo API precisa: argparse, JSON stdout, aguardar stdin

### Ao criar migrations:
```bash
npm run migration:generate -- -n NomeDaMigration
npm run migration:run
```

### Ao criar testes:
```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Com coverage
```

---

**Última atualização:** 2025-11-08
**Autor:** Eduardo Ferreira (eduardo@ocdigital.com.br)
**Versão Backend:** 1.0.0 (MVP em desenvolvimento)
