# CookMe Backend - Contexto do Projeto

## Visão Geral

**CookMe** é um Motor de Otimização de Inventário (MOI) que ajuda usuários a gerenciar seu estoque de alimentos, reduzir desperdício e sugerir receitas baseadas no que possuem em casa.

**Stack Técnico:**
- **Framework:** NestJS 11.x (Node.js/TypeScript)
- **Banco de Dados:** PostgreSQL 15 (TypeORM)
- **Cache:** Redis 7
- **Autenticação:** JWT (Access + Refresh Tokens)
- **Documentação:** Swagger/OpenAPI
- **Containerização:** Docker & Docker Compose

**Status Atual:** Backend completo com todos os módulos principais implementados. Pronto para integração com frontend.

---

## Arquitetura

### Estrutura de Diretórios
```
src/
├── config/              # Configurações (app, database)
├── common/              # Compartilhados (guards, decorators, enums)
├── modules/
│   ├── auth/           # Autenticação e autorização
│   ├── usuarios/       # Gestão de usuários e preferências
│   ├── produtos/       # Catálogo de produtos, marcas e categorias
│   ├── compras/        # Registro de compras
│   ├── inventario/     # Gestão de estoque
│   ├── receitas/       # Receitas e sugestões MOI
│   └── barcode/        # Scanner de código de barras
└── main.ts             # Bootstrap da aplicação
```

### Padrões Arquiteturais
- **Clean Architecture:** Separação clara entre camadas (Controller → Service → Repository)
- **Domain-Driven Design:** Entities com lógica de negócio
- **Dependency Injection:** Fornecido pelo NestJS
- **Global Guards:** JWT Auth habilitado por padrão, rotas públicas via decorator `@Public()`

---

## Módulos Implementados

### 1. Auth (Autenticação)
**Status:** ✅ Completo

**Funcionalidades:**
- Registro de novos usuários (hash bcrypt)
- Login com JWT (access token + refresh token)
- Refresh token rotation
- Logout (invalidação de refresh token)
- Endpoint "me" para dados do usuário autenticado

**Segurança:**
- Senhas hasheadas com bcrypt
- Access tokens com expiração curta (15min)
- Refresh tokens com expiração longa (7 dias)
- Refresh tokens armazenados no banco (não em cookies)

**Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

---

### 2. Usuarios (Usuários)
**Status:** ✅ Completo

**Funcionalidades:**
- CRUD de perfil do usuário
- Sistema de preferências personalizadas:
  - Notificações de validade
  - Dias de alerta antes do vencimento
  - Restrições alimentares (vegetariano, vegano, etc.)
  - Preferências culinárias (italiana, brasileira, etc.)

**Endpoints:**
- `GET /api/usuarios/me` - Perfil do usuário
- `PATCH /api/usuarios/me` - Atualizar perfil
- `DELETE /api/usuarios/me` - Deletar conta
- `GET /api/usuarios/preferencias` - Obter preferências
- `PATCH /api/usuarios/preferencias` - Atualizar preferências

---

### 3. Produtos (Catálogo)
**Status:** ✅ Completo

**Funcionalidades:**
- CRUD de produtos
- Sistema de marcas
- Sistema de categorias hierárquicas
- Busca por nome ou código de barras
- Informações nutricionais (JSON)
- Tags para classificação
- Produtos alternativos (sugestões)
- Validade média em dias

**Unidades de Medida Suportadas:**
- `kg`, `g`, `mg`, `l`, `ml`, `un` (unidade)

**Endpoints:**
- Produtos: 6 endpoints (Create, Read, Update, Delete, List, Search by Barcode)
- Marcas: 3 endpoints (Create, List, Get)
- Categorias: 3 endpoints (Create, List, Get)

---

### 4. Compras (Registro de Compras)
**Status:** ✅ Completo

**Funcionalidades:**
- Registro de compras com múltiplos itens
- Tracking de:
  - Data da compra
  - Local da compra
  - Valor total e preços unitários
  - Método de cadastro (manual, nota fiscal, foto)
  - Tempo de cadastro (UX analytics)
- Estatísticas de compras
- Histórico de compras do usuário
- Integração automática com inventário (ao criar compra)

**Endpoints:**
- `POST /api/compras` - Criar compra (com itens)
- `GET /api/compras` - Listar compras
- `GET /api/compras/:id` - Buscar compra
- `GET /api/compras/stats` - Estatísticas
- `DELETE /api/compras/:id` - Deletar compra

---

### 5. Inventario (Gestão de Estoque)
**Status:** ✅ Completo

**Funcionalidades:**
- CRUD de itens no inventário
- Tracking de validade
- Localização física do item (geladeira, despensa, etc.)
- Rastreabilidade (link com compra original)
- Alertas de vencimento:
  - Itens vencendo em breve (configurável, padrão 7 dias)
  - Itens já vencidos
- Estatísticas do inventário:
  - Total de itens
  - Valor estimado do estoque
  - Itens próximos do vencimento

**Endpoints:**
- `POST /api/inventario` - Adicionar item
- `GET /api/inventario` - Listar todos (ordenado por validade)
- `GET /api/inventario/stats` - Estatísticas
- `GET /api/inventario/vencendo?days=7` - Itens vencendo
- `GET /api/inventario/vencidos` - Itens vencidos
- `GET /api/inventario/:id` - Buscar item
- `PATCH /api/inventario/:id` - Atualizar item
- `DELETE /api/inventario/:id` - Remover item

---

### 6. Receitas (Receitas e Sugestões)
**Status:** ✅ Completo (Motor MOI implementado)

**Funcionalidades:**
- CRUD de receitas
- Ingredientes com quantidades e unidades
- Ingredientes opcionais
- Metadata de receitas:
  - Tempo de preparo
  - Rendimento (porções)
  - Dificuldade (fácil, média, difícil)
  - Tags de dieta (vegetariano, vegano, sem glúten, etc.)
  - Tags de preparo (rápido, forno, grelha, etc.)
  - Categoria (café da manhã, almoço, jantar, sobremesa)
- **Motor MOI (Sugestões Inteligentes):**
  - Analisa inventário do usuário
  - Calcula compatibilidade com receitas
  - Prioriza receitas com ingredientes próximos do vencimento
  - Considera preferências e restrições alimentares
- Histórico de receitas executadas
- Sistema de avaliação (1-5 estrelas)
- Atualização automática do inventário ao executar receita

**Endpoints:**
- `POST /api/receitas` - Criar receita
- `GET /api/receitas` - Listar com filtros
- `GET /api/receitas/:id` - Buscar receita
- `GET /api/receitas/sugestoes` - **Motor MOI** (sugestões inteligentes)
- `GET /api/receitas/executadas` - Histórico
- `POST /api/receitas/:id/executar` - Marcar como executada
- `DELETE /api/receitas/:id` - Deletar receita

**Algoritmo MOI:**
1. Busca todas as receitas
2. Para cada receita, calcula % de ingredientes disponíveis
3. Verifica compatibilidade com restrições alimentares do usuário
4. Prioriza receitas com ingredientes próximos ao vencimento
5. Retorna receitas ordenadas por score (disponibilidade + urgência)

---

### 7. Barcode (Scanner de Códigos)
**Status:** ✅ Implementado (estrutura pronta)

**Funcionalidades:**
- Busca de produtos por código de barras
- Preparado para integração com APIs externas (Open Food Facts, etc.)
- Atualmente busca no catálogo interno

**Endpoint:**
- `GET /api/barcode/scan/:codigo`

**Próximos passos:**
- Integrar com API externa de produtos (Open Food Facts)
- Cache de consultas externas

---

### 8. Scraper (Cupons Fiscais SAT-SP)
**Status:** ✅ Completo (Backend pronto, Python pendente)

**Funcionalidades:**
- Scraping automatizado de cupons fiscais SAT-SP
- Integração mobile via QR Code
- Gerenciamento de sessões assíncronas
- Suporte a resolução manual de CAPTCHA (WebView no mobile)
- Processamento em background via spawn de Python
- Comunicação JSON entre NestJS e Python (stdout/stdin)
- Limite de consultas simultâneas (5 por servidor)
- Timeout automático (10 minutos)
- Auto-cleanup de sessões expiradas
- Criação automática de compras após extração

**Arquitetura:**
```
Mobile → Scanneia QR Code
   ↓
POST /api/scraper/consultas
   ↓
Backend cria sessão + Spawna Python
   ↓
Python abre Chrome, preenche dados, aguarda CAPTCHA
   ↓
Mobile faz polling (GET status a cada 2s)
   ↓
Quando status = "aguardando_captcha"
   ↓
Mobile abre WebView para resolver CAPTCHA
   ↓
POST /api/scraper/.../captcha-resolvido
   ↓
Backend envia "continue" para Python
   ↓
Python extrai dados e cria compra via API
   ↓
Status final: "concluido" com compraId
```

**Estados da Sessão:**
- `iniciando` - Iniciando processo
- `consultando_sat` - Acessando site da Fazenda
- `aguardando_captcha` - Mobile deve abrir WebView
- `processando_dados` - Extraindo produtos do cupom
- `salvando_api` - Salvando na API CookMe
- `concluido` - Compra salva com sucesso
- `erro` - Erro no processo
- `timeout` - Tempo limite excedido
- `cancelado` - Cancelado pelo usuário

**Endpoints:**
- `POST /api/scraper/consultas` - Iniciar consulta
- `GET /api/scraper/consultas/:sessionId` - Consultar status
- `POST /api/scraper/consultas/:sessionId/captcha-resolvido` - Notificar CAPTCHA resolvido
- `DELETE /api/scraper/consultas/:sessionId` - Cancelar consulta
- `GET /api/scraper/minhas-consultas` - Listar consultas do usuário

**Tecnologias:**
- NestJS (gerenciamento de sessões)
- Python 3 + Selenium (scraping)
- Chrome WebDriver (automação)
- Child Process (spawn Python)
- JSON (comunicação NestJS ↔ Python)

**Próximos passos:**
- ⚠️ Finalizar modificações no script Python (modo API)
- Testar integração completa
- Implementar WebSocket para substituir polling
- Adicionar suporte para outros tipos de cupons (NFC-e)
- Considerar fila (Bull + Redis) quando escalar

**Documentação:**
- Ver `MOBILE_INTEGRATION.md` para guia completo de integração mobile
- Ver `lib/MIGRATION_API_MODE.md` para modificações necessárias no Python

---

## Banco de Dados

### Entidades (11 tabelas)

1. **usuarios**
   - id, email, senha, nome, role, refresh_token
   - timestamps: created_at, updated_at

2. **preferencias**
   - Relação 1:1 com usuarios
   - notificacoes_validade, dias_alerta_validade
   - restricoes_alimentares[], preferencias_culinarias[]

3. **marcas**
   - id, nome

4. **categorias**
   - id, nome, icone, pai_id (hierárquica)

5. **produtos**
   - id, nome, codigo_barras (único)
   - marca_id, categoria_id
   - unidade_padrao, validade_media_dias
   - informacoes_nutricionais (JSON)
   - tags[], alternativas_ids[]

6. **compras**
   - id, usuario_id, data_compra, local_compra
   - valor_total, metodo_cadastro, tempo_cadastro_segundos

7. **compras_itens**
   - id, compra_id, produto_id
   - quantidade, unidade, preco_unitario
   - validade_final, lote

8. **inventario**
   - id, usuario_id, produto_id
   - quantidade_disponivel, unidade, data_validade
   - localizacao, metodo_atualizacao
   - compra_item_id (rastreabilidade)

9. **receitas**
   - id, nome, modo_preparo
   - tempo_preparo, rendimento_porcoes, dificuldade
   - categoria_receita, tags_dieta[], tags_preparo[]
   - origem (catálogo, usuário, API)

10. **receitas_ingredientes**
    - id, receita_id, produto_id
    - quantidade, unidade, opcional, observacao, ordem

11. **receitas_executadas**
    - id, receita_id, usuario_id
    - data_execucao, porcoes_preparadas, avaliacao, observacoes

---

## Configuração e Deploy

### Docker Compose
**Serviços configurados:**
- PostgreSQL 15 (porta 5432)
- Redis 7 (porta 6379)
- pgAdmin 4 (porta 5050)

**Acesso pgAdmin:**
- URL: http://localhost:5050
- Email: admin@cookme.com
- Senha: admin123

**Conectar no PostgreSQL via pgAdmin:**
- Host: `postgres` (ou `localhost` de fora do Docker)
- Port: 5432
- Database: cookme_db
- Username: cookme
- Password: cookme123

### Variáveis de Ambiente
Ver arquivo `.env.example` para todas as configurações.

**Principais:**
- `PORT=3000`
- `NODE_ENV=development`
- `JWT_SECRET` e `JWT_REFRESH_SECRET` (trocar em produção!)
- Credenciais do PostgreSQL e Redis

---

## Documentação e Testes

### Swagger API Documentation
- **URL:** http://localhost:3000/api/docs
- Todos os endpoints documentados
- Suporte a Bearer Auth (adicione o token após login)
- Schemas de request/response completos

### Postman Collection
- **Arquivo:** `CookMe-API.postman_collection.json`
- 42 requests organizados por módulo (atualizar para 47 com Scraper)
- Variáveis de ambiente (baseUrl, access_token)
- Scripts para auto-save de tokens após login/register

**Como usar:**
1. Importar collection no Postman
2. Fazer Register ou Login (token salvo automaticamente)
3. Todos os outros endpoints usam o token automaticamente

---

## O Que Está Funcionando

✅ **Backend completo e funcional**
- Todos os 8 módulos implementados
- 47 endpoints REST funcionais
- Autenticação JWT com refresh tokens
- CRUD completo de todas as entidades
- Motor MOI (sugestões inteligentes) funcionando
- Scraper de cupons fiscais (backend pronto, Python pendente)
- Validação de dados com class-validator
- Documentação Swagger completa
- Collection Postman pronta

✅ **Banco de dados**
- Schema TypeORM completo
- 11 entidades relacionadas
- Índices e constraints configurados
- Migrations preparadas (comando disponível)

✅ **Docker**
- Docker Compose configurado
- PostgreSQL, Redis e pgAdmin rodando
- Redes e volumes persistentes

---

## O Que Falta Implementar

### 🔴 Prioridade Alta

1. **Migrations e Seeding**
   - Criar migrations do TypeORM
   - Seed inicial de categorias e marcas comuns
   - Seed de produtos básicos (arroz, feijão, etc.)
   - Seed de receitas populares
   - **Comando:** `npm run migration:generate` / `npm run seed`

2. **Testes**
   - Unit tests dos services (Jest)
   - E2E tests dos endpoints (Supertest)
   - Cobertura mínima: 70%
   - **Comando:** `npm run test` / `npm run test:e2e`

3. **Variáveis de Ambiente**
   - Criar arquivo `.env` baseado no `.env.example`
   - Trocar secrets JWT em produção
   - Configurar credenciais de APIs externas (se houver)

4. **Scraper de Cupons Fiscais (Finalizar)**
   - ⚠️ Modificar script Python para modo API
   - Adicionar argumentos de linha de comando (--mode, --session-id, --qrcode)
   - Implementar comunicação JSON (stdout/stdin)
   - Testar integração NestJS ↔ Python
   - Atualizar Postman Collection com novos endpoints
   - Ver `lib/MIGRATION_API_MODE.md` para detalhes

### 🟡 Prioridade Média

5. **Integração com APIs Externas**
   - Open Food Facts API (informações de produtos por barcode)
   - Integração no BarcodeService
   - Cache de consultas externas (Redis)

6. **Sistema de Notificações**
   - Criar módulo de notificações
   - Notificar usuário sobre produtos vencendo
   - Email/Push notifications
   - Scheduler (cron jobs)

7. **Upload de Imagens**
   - Fotos de produtos
   - Fotos de receitas
   - OCR para notas fiscais
   - Armazenamento: AWS S3 ou local

8. **Melhorias no Motor MOI**
   - Considerar histórico de receitas executadas
   - Machine Learning para preferências pessoais
   - Sugestões de lista de compras inteligente
   - Integração com serviço Python (ML)

9. **Analytics e Métricas**
   - Dashboard de estatísticas do usuário
   - Relatórios de desperdício evitado
   - Economia gerada
   - Gráficos de consumo

10. **Melhorias no Scraper**
    - Implementar WebSocket para substituir polling
    - Adicionar fila (Bull + Redis) para escalabilidade
    - Suporte para outros tipos de cupons (NFC-e)
    - CAPTCHA automático (serviços de terceiros)

### 🟢 Prioridade Baixa

11. **Sistema de Compartilhamento**
    - Compartilhar receitas entre usuários
    - Sistema de likes e favoritos
    - Comentários em receitas

12. **Gamificação**
    - Sistema de pontos
    - Badges e conquistas
    - Ranking de usuários

13. **Internacionalização**
    - Suporte a múltiplos idiomas (i18n)
    - Conversão de unidades (métrico ↔ imperial)

14. **Performance**
    - Cache com Redis (receitas, produtos)
    - Paginação em listagens grandes
    - Lazy loading de relações

---

## Próximos Passos Recomendados

### Para Desenvolvimento Local

1. **Setup inicial:**
   ```bash
   # Subir containers
   docker-compose up -d

   # Instalar dependências
   npm install

   # Criar .env (copiar de .env.example)
   cp .env.example .env

   # Rodar migrations
   npm run migration:run

   # Rodar seed
   npm run seed

   # Iniciar dev server
   npm run start:dev
   ```

2. **Testar API:**
   - Acessar Swagger: http://localhost:3000/api/docs
   - Importar collection Postman
   - Fazer registro de um usuário
   - Testar todos os fluxos principais

3. **Implementar testes:**
   - Começar pelos services mais críticos (AuthService, ReceitasService)
   - Criar factories para dados de teste
   - Configurar banco de teste separado

### Para Produção

1. **Segurança:**
   - Trocar todos os secrets (JWT, DB password)
   - Habilitar HTTPS
   - Rate limiting
   - Helmet.js para headers de segurança
   - CORS configurado para domínio do frontend

2. **Deploy:**
   - CI/CD pipeline (GitHub Actions, GitLab CI)
   - Deploy em cloud (AWS, GCP, Azure, Heroku)
   - Variáveis de ambiente via secrets manager
   - Logs centralizados (Sentry, CloudWatch)
   - Monitoramento (Datadog, New Relic)

3. **Banco de dados:**
   - Backup automático
   - Réplicas read-only
   - Migrations automáticas no deploy

---

## Convenções do Código

### Nomenclatura
- **Entities:** PascalCase (Usuario, Produto, Receita)
- **Controllers:** kebab-case nas rotas (`/api/usuarios/me`)
- **Services:** camelCase nos métodos (`findAll()`, `create()`)
- **DTOs:** Sufixo `Dto` (CreateProdutoDto, UpdateUsuarioDto)
- **Enums:** PascalCase para nome, UPPER_SNAKE_CASE para valores

### Estrutura de Módulo
```
módulo/
├── dto/              # Data Transfer Objects
├── entities/         # Entidades TypeORM
├── módulo.controller.ts
├── módulo.service.ts
├── módulo.module.ts
└── módulo.service.spec.ts (testes)
```

### Response Patterns
- **Sucesso:** Retornar a entidade ou array de entidades
- **Erro 404:** Throw `NotFoundException`
- **Erro 409:** Throw `ConflictException` (conflito de dados)
- **Erro 400:** Throw `BadRequestException` (validação)
- **Erro 401:** Throw `UnauthorizedException` (não autenticado)

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev          # Dev server com hot reload
npm run build              # Build para produção
npm run start:prod         # Rodar build de produção

# Database
npm run migration:generate # Gerar migration
npm run migration:run      # Rodar migrations
npm run migration:revert   # Reverter última migration
npm run seed               # Popular banco com dados iniciais

# Testes
npm run test               # Unit tests
npm run test:watch         # Tests em watch mode
npm run test:cov           # Tests com coverage
npm run test:e2e           # E2E tests

# Linting e Formatação
npm run lint               # ESLint check
npm run format             # Prettier format

# Docker
docker-compose up -d       # Subir todos os serviços
docker-compose down        # Parar todos os serviços
docker-compose logs -f     # Ver logs em tempo real
```

---

## Contato e Recursos

**Documentação:**
- Swagger API: http://localhost:3000/api/docs
- NestJS Docs: https://docs.nestjs.com
- TypeORM Docs: https://typeorm.io

**Arquivos de Referência:**
- `CookMe-API.postman_collection.json` - Collection Postman
- `docker-compose.yml` - Configuração Docker
- `.env.example` - Variáveis de ambiente
- `MOBILE_INTEGRATION.md` - Guia de integração mobile (Scraper)
- `lib/MIGRATION_API_MODE.md` - Modificações Python necessárias

**Autor:** Eduardo Ferreira

---

## Resumo Executivo

**Status do Projeto:** 🟢 Backend Funcional (85% completo)

**O que funciona:**
- ✅ Autenticação e autorização completa
- ✅ CRUD de usuários, produtos, compras, inventário e receitas
- ✅ Motor MOI (sugestões inteligentes de receitas)
- ✅ Sistema de alertas de validade
- ✅ Scraper de cupons fiscais (backend pronto, Python pendente)
- ✅ APIs REST documentadas (47 endpoints)
- ✅ 8 módulos completos

**Próximas tarefas críticas:**
1. Finalizar script Python modo API (Scraper)
2. Criar migrations e seeds do banco
3. Implementar testes (unit + e2e)
4. Atualizar Postman Collection com Scraper
5. Integrar APIs externas (Open Food Facts)
6. Deploy em produção

**Tempo estimado para MVP completo:** 2-3 semanas

**Tecnologias:** NestJS, TypeORM, PostgreSQL, Redis, JWT, Docker, Swagger, Python, Selenium
