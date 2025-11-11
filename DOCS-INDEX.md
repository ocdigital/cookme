# CookMe - Índice de Documentação

> Guia de navegação de toda a documentação do projeto

---

## 📚 Para Começar

**Novo no projeto?** Leia nesta ordem:

1. **[CLAUDE-PROJECT-BRIEF.md](CLAUDE-PROJECT-BRIEF.md)** ⭐
   - Resumo executivo (3 min de leitura)
   - Status atual, stack, o que funciona/falta
   - **Ideal para carregar no Claude Projects**

2. **[QUICK-START.md](QUICK-START.md)** ⭐
   - Rodar o projeto em 5 minutos
   - Setup rápido, comandos, testes

3. **[PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md)** ⭐
   - Conhecimento completo do projeto (20 min)
   - Arquitetura, banco de dados, fluxos, tarefas pendentes
   - **Documento principal para desenvolvedores**

---

## 📖 Documentação Geral

### Visão Geral
- **[README.md](README.md)**
  - Visão geral do projeto
  - Instalação e configuração
  - Funcionalidades principais
  - Roadmap

### Arquitetura Técnica
- **[ARCHITECTURE.md](ARCHITECTURE.md)**
  - Diagrama de componentes
  - Módulos do backend
  - Fluxos de dados
  - Stack técnico detalhado
  - Deploy e performance

### Desenvolvimento
- **[CONTRIBUTING.md](CONTRIBUTING.md)**
  - Guia de contribuição
  - Padrões de código
  - Processo de PR

- **[CHANGELOG.md](CHANGELOG.md)**
  - Histórico de versões
  - Mudanças e updates

---

## 🔧 Backend (NestJS)

**Pasta:** `backend/`

### Documentação Principal
- **[backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md)** ⭐
  - Contexto completo do backend (600+ linhas)
  - Todos os módulos detalhados
  - Esquema do banco de dados
  - Endpoints completos
  - O que funciona e o que falta

- **[backend/RESUMO-RAPIDO.md](backend/RESUMO-RAPIDO.md)**
  - Resumo executivo do backend
  - Status dos módulos
  - Checklist rápido

- **[backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md)** ⭐
  - Checklist completo de tarefas
  - Prioridades (Alta, Média, Baixa)
  - Roadmap de releases
  - Progresso geral

### Código e APIs
- **[backend/README.md](backend/README.md)**
  - Instruções básicas do NestJS
  - Comandos de build e testes

- **[backend/CookMe-API.postman_collection.json](backend/CookMe-API.postman_collection.json)** ⭐
  - Collection Postman com 42 requests
  - Todos os endpoints organizados
  - Variáveis e autenticação automática
  - **Importar no Postman para testar**

- **Swagger/OpenAPI**
  - URL: http://localhost:3000/api/docs
  - Documentação interativa
  - Try it out para todos os endpoints

### Estrutura de Código
```
backend/src/
├── modules/
│   ├── auth/         # Autenticação JWT
│   ├── usuarios/     # Usuários e preferências
│   ├── produtos/     # Catálogo de produtos
│   ├── compras/      # Registro de compras
│   ├── inventario/   # Gestão de estoque
│   ├── receitas/     # Receitas + Motor MOI
│   ├── barcode/      # Scanner de códigos
│   └── scraper/      # Integração Python (cupom fiscal)
├── common/           # Guards, decorators, pipes
└── config/           # Configurações (DB, app)
```

---

## 🐍 Scraper Python

**Pasta:** `lib/`

### Documentação
- **[lib/README.md](lib/README.md)**
  - Descrição do scraper
  - Como funciona
  - Setup e uso

- **[lib/MIGRATION_API_MODE.md](lib/MIGRATION_API_MODE.md)** ⚠️
  - **Modificações pendentes** no Python
  - Implementar modo API (CLI args + JSON)
  - Necessário para integração com mobile

### Scripts
- `lib/captcha_manual.py` - Script principal
- `lib/config.example.json` - Template de configuração

---

## 📱 Mobile (App)

**Pasta:** `mobile/` (vazia - não iniciado)

### Documentação de Integração
- **[MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md)** ⭐
  - Como o mobile se integra com o backend
  - Fluxo de cadastro de cupom fiscal
  - 5 endpoints do módulo Scraper
  - Pseudocódigo React Native/Flutter
  - Status de consulta (polling)
  - WebView para CAPTCHA

---

## 🌐 Landing Page

**Pasta:** `landingpage/`

- **[landingpage/README.md](landingpage/README.md)**
  - Landing page do produto
  - HTML/CSS/JavaScript + PHP

---

## 🐳 Docker e Deploy

### Configuração Local
- **[backend/docker-compose.yml](backend/docker-compose.yml)**
  - PostgreSQL 15
  - Redis 7
  - pgAdmin 4

### Variáveis de Ambiente
- **[backend/.env.example](backend/.env.example)**
  - Template de configuração
  - JWT secrets
  - Credenciais de DB e Redis

---

## 📊 Diagramas e Fluxos

### Fluxo de Cupom Fiscal
Ver: [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md) (linhas 9-86)
```
Mobile → Backend → Python → Site Fazenda → CAPTCHA
→ Python extrai dados → Backend salva → Mobile exibe
```

### Arquitetura Geral
Ver: [ARCHITECTURE.md](ARCHITECTURE.md) (linhas 5-33)
```
Mobile/Web → API REST (NestJS) → PostgreSQL + Redis
           ↓
     Python Scraper
```

### Motor MOI (Sugestões)
Ver: [ARCHITECTURE.md](ARCHITECTURE.md) (linhas 288-313)
```
Usuário → API → Query Inventário + Receitas
→ Algoritmo de matching → Receitas ranqueadas
```

---

## 🔍 Busca Rápida

### "Como rodar o projeto?"
→ [QUICK-START.md](QUICK-START.md)

### "Qual é a stack técnica?"
→ [CLAUDE-PROJECT-BRIEF.md](CLAUDE-PROJECT-BRIEF.md) (seção Stack)

### "Quais endpoints estão disponíveis?"
→ [backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md) (seção API REST)
→ http://localhost:3000/api/docs (Swagger)

### "Como funciona o Motor MOI?"
→ [PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md) (seção Motor MOI)
→ [backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md) (módulo Receitas)

### "O que falta fazer?"
→ [backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md)
→ [CLAUDE-PROJECT-BRIEF.md](CLAUDE-PROJECT-BRIEF.md) (seção "O que FALTA")

### "Como cadastrar cupom fiscal?"
→ [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md)
→ [lib/MIGRATION_API_MODE.md](lib/MIGRATION_API_MODE.md)

### "Como conectar no banco de dados?"
→ [QUICK-START.md](QUICK-START.md) (seção "Verificar Serviços")
→ [PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md) (seção "Conexão PostgreSQL")

### "Qual ORM está sendo usado?"
→ **TypeORM** (não Prisma!)
→ Entities: `backend/src/modules/*/entities/*.entity.ts`

---

## ⚡ Comandos Rápidos

### Backend
```bash
npm run start:dev          # Dev server
npm run build              # Build produção
npm run test               # Testes
npm run migration:generate # Gerar migration
npm run migration:run      # Rodar migrations
```

### Docker
```bash
docker-compose up -d       # Subir serviços
docker-compose down        # Parar serviços
docker-compose logs -f     # Ver logs
```

### Python
```bash
python captcha_manual.py   # Modo interativo
python captcha_manual.py --mode api --session-id xxx --qrcode "..."  # Modo API (após implementar)
```

---

## 🎯 Documentos por Persona

### 👨‍💻 Desenvolvedor Backend (NestJS)
1. [QUICK-START.md](QUICK-START.md) - Setup
2. [backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md) - Contexto completo
3. [backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md) - Tarefas
4. Swagger: http://localhost:3000/api/docs
5. [backend/CookMe-API.postman_collection.json](backend/CookMe-API.postman_collection.json)

### 🐍 Desenvolvedor Python (Scraper)
1. [lib/README.md](lib/README.md) - Overview
2. [lib/MIGRATION_API_MODE.md](lib/MIGRATION_API_MODE.md) - Modificações necessárias
3. [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md) - Integração com backend

### 📱 Desenvolvedor Mobile
1. [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md) - **Leitura obrigatória**
2. [backend/CookMe-API.postman_collection.json](backend/CookMe-API.postman_collection.json) - Testar endpoints
3. Swagger: http://localhost:3000/api/docs

### 🎨 Desenvolvedor Frontend (Web)
1. [backend/PROJETO-CONTEXT.md](backend/PROJETO-CONTEXT.md) - Endpoints disponíveis
2. Swagger: http://localhost:3000/api/docs
3. [backend/CookMe-API.postman_collection.json](backend/CookMe-API.postman_collection.json)

### 🤖 Claude Code / IA Assistant
1. **[CLAUDE-PROJECT-BRIEF.md](CLAUDE-PROJECT-BRIEF.md)** ⭐ - Carregar este
2. [PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md) - Contexto completo
3. [backend/TODO-CHECKLIST.md](backend/TODO-CHECKLIST.md) - Tarefas pendentes

### 🏢 Product Manager / Stakeholder
1. [README.md](README.md) - Visão geral
2. [CLAUDE-PROJECT-BRIEF.md](CLAUDE-PROJECT-BRIEF.md) - Status e progresso
3. [CHANGELOG.md](CHANGELOG.md) - Histórico

---

## 📝 Atualização de Docs

**Última atualização geral:** 2025-11-08

**Documentos atualizados hoje:**
- ✅ Corrigido Prisma → TypeORM em README.md e ARCHITECTURE.md
- ✅ Criado PROJECT-KNOWLEDGE.md (conhecimento completo)
- ✅ Criado QUICK-START.md (guia de 5 minutos)
- ✅ Criado CLAUDE-PROJECT-BRIEF.md (resumo para IA)
- ✅ Criado este índice (DOCS-INDEX.md)

---

**Dúvidas sobre documentação?**
- Consulte este índice
- Busque por palavra-chave nos documentos
- Leia [PROJECT-KNOWLEDGE.md](PROJECT-KNOWLEDGE.md) para visão completa

---

**Desenvolvido com ❤️ para ajudar a reduzir o desperdício de alimentos**
