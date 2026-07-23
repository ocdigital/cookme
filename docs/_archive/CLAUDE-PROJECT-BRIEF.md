# CookMe - Brief para Claude Projects

> **Resumo executivo otimizado para carregar contexto no Claude Code**

---

## 🎯 Resumo do Projeto

**CookMe** é um Motor de Otimização de Inventário (MOI) para gerenciar alimentos domésticos, cadastrar compras via cupom fiscal SAT automaticamente, e sugerir receitas inteligentes baseadas no inventário do usuário.

**Status:** MVP 40% completo - Backend funcional, falta testes, migrations, e finalizar integração Python.

---

## 🏗️ Stack

- **Backend:** NestJS 11 + TypeScript + TypeORM + PostgreSQL 15 + Redis 7
- **Scraper:** Python 3.12 + Selenium
- **Mobile:** Não iniciado (pasta vazia)
- **Deploy:** Docker Compose (local), produção pendente

---

## 📂 Estrutura

```
/backend/        ✅ 94% - API REST (7.5/8 módulos funcionais)
/lib/            ⏳ 85% - Scraper Python (falta modo API)
/mobile/         ❌  0% - Vazio
/landingpage/    ✅ Landing page
```

---

## ✅ O que FUNCIONA

### Backend (NestJS)

- ✅ **8 módulos REST:** Auth, Usuarios, Produtos, Compras, Inventario, Receitas, Barcode, Scraper
- ✅ **42 endpoints documentados** (Swagger + Postman)
- ✅ **Motor MOI** - Sugestões inteligentes de receitas (`GET /api/receitas/sugestoes`)
- ✅ **JWT Auth** completo (access + refresh tokens)
- ✅ **TypeORM** entities (11 tabelas)
- ✅ **Docker Compose** (PostgreSQL, Redis, pgAdmin)

### Scraper Python

- ✅ Leitura de QR Code SAT-SP
- ✅ Automação Selenium
- ✅ Extração de dados do cupom
- ✅ Integração com API CookMe (modo interativo)

---

## ❌ O que FALTA (Crítico)

### 🔴 Prioridade ALTA

1. **Scraper Python - Modo API** (85% → 100%)
   - Modificar `lib/captcha_manual.py` para aceitar argumentos CLI
   - Comunicação via JSON (stdout) com backend NestJS
   - Ver `lib/MIGRATION_API_MODE.md` para detalhes

2. **Migrations TypeORM** (0%)
   - Gerar: `npm run migration:generate`
   - Rodar: `npm run migration:run`

3. **Seeds** (0%)
   - Categorias padrão (Grãos, Laticínios, etc)
   - Marcas populares (Tio João, Nestlé, etc)
   - Produtos básicos (Arroz, Feijão, etc)
   - Receitas populares

4. **Testes** (0%)
   - Unit tests (0/7 services)
   - E2E tests (0/8 módulos)
   - Meta: 70% coverage

---

## 🗄️ Banco de Dados

**ORM:** TypeORM (NÃO Prisma! Alguns docs antigos mencionam Prisma incorretamente)

**11 Tabelas:**

- `usuarios`, `preferencias`
- `produtos`, `marcas`, `categorias`
- `compras`, `compras_itens`
- `inventario`
- `receitas`, `receitas_ingredientes`, `receitas_executadas`

**Entities:** `backend/src/modules/*/entities/*.entity.ts`

---

## 🔌 Principais Endpoints

### Motor MOI (Destaque)

```http
GET /api/receitas/sugestoes
Authorization: Bearer {token}

# Retorna receitas ranqueadas por:
# - % ingredientes disponíveis no inventário
# - Urgência (produtos vencendo)
# - Preferências alimentares do usuário
```

### Scraper (Integração Mobile)

```http
POST /api/scraper/consultas
{ "qrcodeTexto": "35251..." }

# Inicia processo:
# 1. Cria sessão
# 2. Spawna Python em background
# 3. Python aguarda CAPTCHA
# 4. Mobile resolve CAPTCHA em WebView
# 5. Python continua e salva compra
```

**Fluxo completo:** Ver `MOBILE_INTEGRATION.md`

---

## ⚙️ Como Rodar

```bash
# Backend
cd backend
npm install
docker-compose up -d
npm run start:dev

# API: http://localhost:3000/api
# Swagger: http://localhost:3000/api/docs
# pgAdmin: http://localhost:5050 (admin@cookme.com / admin123)

# Scraper Python (opcional)
cd lib
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp config.example.json config.json
python captcha_manual.py
```

---

## 🐛 Problemas Conhecidos

1. **README.md e ARCHITECTURE.md mencionavam Prisma** → ✅ CORRIGIDO para TypeORM
2. **Scraper Python não tem modo API** → Precisa modificações (ver `lib/MIGRATION_API_MODE.md`)
3. **Sem migrations** → Precisa criar
4. **Sem seeds** → Precisa criar
5. **Sem testes** → 0% coverage

---

## 📊 Progresso

```
Backend:     ████████████████████░  94%
Scraper:     █████████████████░░░  85%
Migrations:  ░░░░░░░░░░░░░░░░░░░░   0%
Seeds:       ░░░░░░░░░░░░░░░░░░░░   0%
Testes:      ░░░░░░░░░░░░░░░░░░░░   0%
Mobile:      ░░░░░░░░░░░░░░░░░░░░   0%

MVP TOTAL:   ████████░░░░░░░░░░░░  40%
```

---

## 🎯 Próximos Passos (Esta Semana)

1. ✅ Finalizar modo API do Python
2. ✅ Criar e rodar migrations
3. ✅ Criar seeds básicos
4. ✅ Testar fluxo: QR Code → API → Inventário
5. ✅ Começar testes unitários (AuthService, ReceitasService)

---

## 📚 Documentação

**Documentos principais:**

- **[PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md)** ← **Leia este para contexto completo**
- [QUICK-START.md](QUICK-START.md) - Rodar em 5 minutos
- [backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md) - Detalhes do backend
- [backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md) - Checklist completo
- [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md) - Integração mobile
- [lib/MIGRATION_API_MODE.md](lib/MIGRATION_API_MODE.md) - Modificações Python pendentes

**APIs e ferramentas:**

- Swagger: <http://localhost:3000/api/docs>
- Postman: `backend/CookMe-API.postman_collection.json`

---

## 💡 Dicas para Claude

### Ao trabalhar no backend

- ORM é **TypeORM**, não Prisma
- Entities: `src/modules/*/entities/*.entity.ts`
- Guards JWT globais ativos, use `@Public()` para rotas públicas
- Validação com class-validator em DTOs

### Ao trabalhar no scraper

- Script principal: `lib/captcha_manual.py`
- Modificações necessárias: ver `lib/MIGRATION_API_MODE.md`
- Comunicação backend ↔ Python: JSON via stdout/stdin

### Comandos úteis

```bash
# Backend
npm run start:dev          # Dev server
npm run migration:generate # Gerar migration
npm run migration:run      # Rodar migrations
npm run test               # Testes
npm run test:cov           # Coverage

# Docker
docker-compose up -d       # Subir serviços
docker-compose logs -f     # Ver logs
```

---

## 🔗 Conexão PostgreSQL

**Via pgAdmin (dentro do Docker):**

- Host: `postgres`
- Port: 5432
- Database: `cookme_db`
- User: `cookme`
- Password: `cookme123`

**De fora do Docker (DBeaver, etc):**

- Host: `localhost`
- (demais iguais)

---

**Última atualização:** 2025-11-08
**Autor:** Eduardo Ferreira
**Versão:** 1.0.0-MVP
