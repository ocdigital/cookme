# CookMe - Arquitetura do Sistema

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ Mobile │  │   Web    │  │ Scraper  │
│  App   │  │ Frontend │  │  Python  │
└────┬───┘  └────┬─────┘  └────┬─────┘
     │           │             │
     └───────────┼─────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   API REST   │
         │   (NestJS)   │
         └───────┬──────┘
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
  ┌──────────┐      ┌───────────┐
  │PostgreSQL│      │   Redis   │
  │ Database │      │   Cache   │
  └──────────┘      └───────────┘
```

## 🏗️ Componentes Principais

### 1. Backend API (NestJS)

**Localização:** `/backend`

**Tecnologias:**
- NestJS (Framework)
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

**Módulos:**

#### Auth Module
- Registro de usuários
- Login/Logout
- Refresh tokens
- Proteção de rotas com Guards

#### Produtos Module
- CRUD de produtos
- Busca por código de barras
- Categorias e marcas
- Informações nutricionais

#### Compras Module
- Registro de compras
- Importação via cupom fiscal
- Histórico e estatísticas

#### Inventário Module
- Gerenciamento de estoque
- Alertas de validade
- Controle de localização

#### Receitas Module
- CRUD de receitas
- Motor MOI (Otimização de Inventário)
- Sugestões inteligentes
- Execução de receitas

**Estrutura de Pastas:**
```
backend/
├── src/
│   ├── auth/              # Autenticação
│   ├── usuarios/          # Gestão de usuários
│   ├── produtos/          # Produtos e catálogo
│   ├── compras/           # Registro de compras
│   ├── inventario/        # Gestão de estoque
│   ├── receitas/          # Receitas e MOI
│   ├── common/            # Código compartilhado
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   └── config/            # Configurações
├── dist/                  # Build de produção
└── test/                  # Testes
```

### 2. Scraper de Cupons Fiscais (Python)

**Localização:** `/lib`

**Tecnologias:**
- Python 3.12+
- Selenium WebDriver
- Requests (HTTP Client)
- Chrome/ChromeDriver

**Classes Principais:**

#### CookMeAPIClient
Responsável pela comunicação com a API backend.

**Responsabilidades:**
- Autenticação JWT
- CRUD de produtos
- Registro de compras
- Mapeamento de dados

#### LeitorQRCodeSAT
Extrai informações do QR Code SAT-SP.

**Responsabilidades:**
- Parse do texto do QR Code
- Extração da chave de acesso
- Validação de formato

#### ConsultaSATRobusta
Automação do processo de consulta no site da Fazenda.

**Responsabilidades:**
- Controle do Selenium
- Navegação no site
- Resolução manual de reCAPTCHA
- Extração de dados do HTML

**Fluxo de Execução:**
```
1. Ler QR Code
2. Extrair chave de acesso (44 dígitos)
3. Abrir navegador (Chrome)
4. Navegar para site da Fazenda
5. Preencher chave de acesso
6. Aguardar resolução manual do reCAPTCHA
7. Submeter formulário
8. Extrair dados do cupom (produtos, valores, etc)
9. Autenticar na API CookMe
10. Para cada produto:
    - Buscar por código de barras
    - Se não existe, criar produto
11. Registrar compra completa
12. Salvar backup JSON local
```

### 3. Banco de Dados (PostgreSQL)

**Esquema Principal:**

```sql
-- Usuários
usuarios
├── id (UUID)
├── email
├── senha_hash
├── nome
├── created_at
└── updated_at

-- Produtos
produtos
├── id (UUID)
├── nome
├── codigo_barras
├── marca_id (FK)
├── categoria_id (FK)
├── unidade_padrao
├── validade_media_dias
├── informacoes_nutricionais (JSON)
└── tags (String[])

-- Compras
compras
├── id (UUID)
├── usuario_id (FK)
├── data_compra
├── local_compra
├── valor_total
├── metodo_cadastro (enum)
└── created_at

-- Itens de Compra
itens_compra
├── id (UUID)
├── compra_id (FK)
├── produto_id (FK)
├── quantidade
├── unidade
├── preco_unitario
└── validade_final

-- Inventário
inventario
├── id (UUID)
├── usuario_id (FK)
├── produto_id (FK)
├── quantidade_disponivel
├── unidade
├── data_validade
├── localizacao
└── metodo_atualizacao (enum)

-- Receitas
receitas
├── id (UUID)
├── usuario_id (FK)
├── nome
├── modo_preparo
├── tempo_preparo
├── rendimento_porcoes
├── dificuldade (enum)
└── categoria_receita

-- Ingredientes de Receita
ingredientes_receita
├── id (UUID)
├── receita_id (FK)
├── produto_id (FK)
├── quantidade
├── unidade
├── opcional
└── ordem
```

**Relacionamentos:**
- Usuario 1:N Compras
- Usuario 1:N Inventario
- Usuario 1:N Receitas
- Compra 1:N ItensCompra
- Produto 1:N ItensCompra
- Produto 1:N Inventario
- Receita 1:N IngredientesReceita

## 🔄 Fluxos de Dados

### Fluxo 1: Cadastro de Compra via Cupom Fiscal

```
Usuario → Scraper Python
    ↓
Scraper → Site Fazenda SP (Selenium)
    ↓
Site → Cupom Fiscal HTML
    ↓
Scraper → Parser de Dados
    ↓
Scraper → API POST /auth/login
    ↓
API → JWT Token
    ↓
Scraper → Para cada produto:
    ↓     API GET /produtos/barcode/:codigo
    ↓     Se não existe:
    ↓       API POST /produtos
    ↓
Scraper → API POST /compras
    ↓     {
    ↓       data_compra,
    ↓       local_compra,
    ↓       valor_total,
    ↓       metodo_cadastro: "cupom_sat",
    ↓       itens: [...]
    ↓     }
    ↓
API → Validação
    ↓
API → TypeORM
    ↓
PostgreSQL → Salvar compra + itens
    ↓
API → Response 201 Created
    ↓
Scraper → Salvar JSON backup local
```

### Fluxo 2: Motor MOI (Sugestões de Receitas)

```
Usuario → API GET /receitas/sugestoes
    ↓
API → MOI Service
    ↓
MOI → Query Inventário do usuário
    ↓
MOI → Query Todas as receitas
    ↓
MOI → Algoritmo de Matching:
    ↓   1. Para cada receita:
    ↓      - Calcular % de ingredientes disponíveis
    ↓      - Priorizar produtos próximos ao vencimento
    ↓      - Calcular score de compatibilidade
    ↓   2. Ordenar por:
    ↓      - Score (ingredientes disponíveis)
    ↓      - Urgência (validade)
    ↓      - Preferências do usuário
    ↓
MOI → Top receitas ranqueadas
    ↓
API → Response com sugestões
    ↓
Usuario → Visualiza receitas otimizadas
```

### Fluxo 3: Alerta de Validade

```
Cron Job (diário) → API
    ↓
API → Query Inventário
    ↓   WHERE data_validade <= NOW() + dias_alerta
    ↓
API → Para cada item vencendo:
    ↓   - Criar notificação
    ↓   - Enviar email (se configurado)
    ↓   - Push notification (se mobile)
    ↓
API → Armazenar notificações
    ↓
Usuario → GET /usuarios/notificacoes
    ↓
Usuario → Visualiza alertas
```

## 🔐 Segurança

### Autenticação
- JWT (JSON Web Tokens)
- Access Token (15min)
- Refresh Token (7 dias)
- Bcrypt para hashing de senhas

### Autorização
- Guards do NestJS
- Decoradores customizados
- Validação de ownership (usuário só acessa seus dados)

### Validação
- Class-validator para DTOs
- Pipes de transformação e validação
- Sanitização de inputs

### Proteção
- Helmet.js (headers de segurança)
- CORS configurado
- Rate limiting (prevenção de DDoS)
- TypeORM com QueryBuilder (prevenção de SQL Injection)

## 📊 Performance

### Caching
- Redis para sessões
- Cache de consultas frequentes
- TTL configurável

### Otimizações de Query
- Índices no banco de dados
- Eager loading com TypeORM relations
- Paginação em listagens

### Escalabilidade
- API stateless (horizontal scaling)
- Load balancing ready
- Database connection pooling

## 🧪 Testing

### Backend
- Unit tests (Jest)
- Integration tests
- E2E tests
- Coverage > 80%

### Scraper
- Testes de parsing
- Mock do Selenium
- Validação de dados

## 📦 Deploy

### Backend
```
1. Build: npm run build
2. Migrations: npm run migration:run
3. Start: npm run start:prod
```

### Database
```
1. Docker Compose ou instância gerenciada
2. Backups automáticos
3. Replicação (para produção)
```

### Scraper
```
1. Ambiente virtual Python
2. Cron job ou scheduler
3. Monitoramento de execução
```

## 🔮 Roadmap Técnico

### Fase 1 (Atual)
- ✅ API REST completa
- ✅ Scraper de cupons SAT
- ✅ Motor MOI básico

### Fase 2
- [ ] WebSockets para notificações real-time
- [ ] GraphQL API
- [ ] Microserviços (separar MOI)

### Fase 3
- [ ] Machine Learning para sugestões
- [ ] Processamento de imagens (OCR)
- [ ] Integração com supermercados

### Fase 4
- [ ] App Mobile (React Native)
- [ ] PWA
- [ ] Offline-first

## 📚 Documentação Adicional

- [README.md](README.md) - Visão geral e setup
- [lib/README.md](lib/README.md) - Documentação do scraper
- [backend/README.md](backend/README.md) - Documentação do backend
- API Docs: http://localhost:3000/api/docs (Swagger)

---

**Última atualização:** 2025-11-07
