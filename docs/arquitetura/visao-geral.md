# 🏗️ Arquitetura do CookMe

## 📊 Diagrama de Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA COOKME - VISÃO GERAL                        │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────┐
                    │      CAMADA DE APRESENTAÇÃO       │
                    └────────────────────────────────────┘
                              │              │
                    ┌─────────▼──────┐  ┌───▼─────────┐
                    │  FRONTEND      │  │   MOBILE    │
                    │  (React 19)    │  │ (React Nav) │
                    │  Port: 5173    │  │ Port: 8081  │
                    └─────────┬──────┘  └───┬─────────┘
                              │              │
                    ┌─────────▼──────────────▼──────────┐
                    │   CAMADA DE API (REST)            │
                    │   Axios Interceptors              │
                    │   Token Management                │
                    └─────────┬───────────────────────┬─┘
                              │                       │
        ┌─────────────────────▼───────────────┐       │
        │     BACKEND (NestJS)                │       │
        │     Port: 3000                      │       │
        │                                     │       │
        │  ┌──────────────────────────────┐  │       │
        │  │    API Controllers           │  │       │
        │  │  ┌──────────────────────┐   │  │       │
        │  │  │ /api/auth            │   │  │       │
        │  │  │ /api/usuarios        │   │  │       │
        │  │  │ /api/produtos        │   │  │       │
        │  │  │ /api/receitas        │   │  │       │
        │  │  │ /api/compras         │   │  │       │
        │  │  │ /api/inventario      │   │  │       │
        │  │  │ /api/admin           │   │  │       │
        │  │  └──────────────────────┘   │  │       │
        │  └──────────────────────────────┘  │       │
        │           │                         │       │
        │  ┌────────▼──────────────────────┐ │       │
        │  │    Services & Business Logic  │ │       │
        │  │  ┌──────────────────────────┐ │ │       │
        │  │  │ AuthService             │ │ │       │
        │  │  │ UsuariosService         │ │ │       │
        │  │  │ ProdutosService         │ │ │       │
        │  │  │ ReceitasService (MOI)   │ │ │       │
        │  │  │ ComprasService          │ │ │       │
        │  │  │ InventarioService       │ │ │       │
        │  │  │ ProductClassService     │ │ │       │
        │  │  └──────────────────────────┘ │ │       │
        │  └────────┬───────────────────────┘ │       │
        │           │                         │       │
        │  ┌────────▼──────────────────────┐ │       │
        │  │    Repositories (TypeORM)     │ │       │
        │  │  (Database Access Layer)      │ │       │
        │  └────────┬───────────────────────┘ │       │
        └───────────┼───────────────────────┬─┘       │
                    │                       │         │
        ┌───────────▼──────────┐   ┌───────▼────┐   │
        │   PostgreSQL         │   │   Redis    │   │
        │   (Port: 5432)       │   │   (Cache)  │   │
        │                      │   │            │   │
        │ ┌──────────────────┐ │   └────────────┘   │
        │ │ Entities:        │ │                     │
        │ │ - usuarios       │ │   ┌─────────────┐  │
        │ │ - produtos       │ │   │ Google AI   │  │
        │ │ - receitas       │ │   │ (Claude)    │  │
        │ │ - compras        │ │   │             │  │
        │ │ - inventario     │ │   │ Recipe Gen  │  │
        │ │ - etc            │ │   │ Product     │  │
        │ │                  │ │   │ Classify    │  │
        │ └──────────────────┘ │   └─────────────┘  │
        └──────────────────────┘                     │
                                                      └──→ (External APIs)
```

---

## 🗄️ Diagrama de Entidades do Banco de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MODELO DE DADOS - ERD                              │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │   Usuario    │
                            ├──────────────┤
                            │ id (UUID)    │◄──────────┐
                            │ email*       │           │
                            │ senha        │           │
                            │ nome         │           │
                            │ role         │           │
                            │ refresh_token│           │
                            │ ultimo_acesso│           │
                            │ etc          │           │
                            └──────┬───────┘           │
                                   │                   │
                    ┌──────────────┼──────────────┐   │
                    │              │              │   │
           1:1      │    1:many    │  1:many     │   │
                    │              │              │   │
    ┌───────────────▼────┐    ┌────▼─────────┐ ┌──▼──────┐
    │   Preferencia      │    │    Compra    │ │Inventário
    ├────────────────────┤    ├──────────────┤ ├─────────┤
    │ usuario_id* (FK)   │    │ id (UUID)    │ │ usuário_│
    │ tags_dieta         │    │ usuario_id* (FK)── id*   │
    │ restricoes         │    │ data_compra  │ │ produto_│
    │ ingredientes_evitar│    │ valor_total  │ │ id*     │
    │ tempo_maximo_prep  │    │ metodo       │ │ quantid │
    │ etc                │    │ etc          │ │ unidade │
    └────────────────────┘    └────┬─────────┘ │validade │
                                   │           │ etc     │
                        1:many      │           └────┬────┘
                                    │                │
                           ┌────────▼────────┐       │ M:1
                           │  CompraItem     │       │
                           ├─────────────────┤       │
                           │ compra_id* (FK) │       │
                           │ produto_id* (FK)◄───────┘
                           │ quantidade      │
                           │ unidade         │
                           │ preco_unitario  │
                           │ validade        │
                           │ etc             │
                           └─────────────────┘


                           ┌──────────────────────┐
                           │      Produto         │
                           ├──────────────────────┤
                           │ id (UUID)            │◄────────────┐
                           │ nome                 │             │
                           │ codigo_barras*       │             │
                           │ tipo (enum)          │             │
                           │ categoria_id (FK)────┼──────┐      │
                           │ marca_id (FK)────────┼────┐ │      │
                           │ tags (array)         │    │ │      │
                           │ info_nutricionais    │    │ │ M:1  │
                           │ verificado           │    │ │      │
                           │ etc                  │    │ │      │
                           └──────────────────────┘    │ │      │
                                                       │ │      │
                              ┌────────────────────┐   │ │      │
                              │     Receita        │   │ │      │
                              ├────────────────────┤   │ │      │
                              │ id (UUID)          │◄──┼─┼──────┤
                              │ nome               │   │ │      │
                              │ modo_preparo       │   │ │      │
                              │ tempo_preparo      │   │ │      │
                              │ dificuldade        │   │ │      │
                              │ tags_dieta         │   │ │      │
                              │ tags_preparo       │   │ │      │
                              │ categoria_id───────┼───┘ │      │
                              │ info_nutricionais  │     │      │
                              │ avaliacao_media    │     │      │
                              │ vezes_executada    │     │      │
                              │ etc                │     │      │
                              └────────┬───────────┘     │      │
                                       │                 │      │
                           1:many      │                 │      │
                                       │                 │      │
                           ┌───────────▼──────────┐     │      │
                           │ ReceitaIngrediente   │     │      │
                           ├──────────────────────┤     │      │
                           │ receita_id* (FK)     │     │      │
                           │ produto_id* (FK)─────┼─────┘      │
                           │ quantidade           │             │
                           │ unidade              │             │
                           │ opcional             │             │
                           │ etc                  │             │
                           └──────────────────────┘             │
                                                                 │
                                 ┌──────────────────────┐        │
                                 │ ReceitaExecutada     │        │
                                 ├──────────────────────┤        │
                                 │ usuario_id* (FK)─────┼────────┤
                                 │ receita_id* (FK)─────┼────────┘
                                 │ data_execucao        │
                                 │ porcoes_feitas       │
                                 │ tempo_real_preparo   │
                                 │ avaliacao            │
                                 │ comentario           │
                                 │ etc                  │
                                 └──────────────────────┘


                       ┌──────────────┐  ┌──────────────┐
                       │   Categoria  │  │    Marca     │
                       ├──────────────┤  ├──────────────┤
                       │ id (UUID)    │  │ id (UUID)    │
                       │ nome         │  │ nome         │
                       │ descricao    │  │ logo_url     │
                       │ etc          │  │ etc          │
                       └──────────────┘  └──────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTENTICAÇÃO E AUTORIZAÇÃO                             │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  REGISTRO (Sign Up)
    ┌──────────────────────────────────────────────────────────┐
    │ Usuário entra dados: email, senha, nome                 │
    │ Frontend: POST /api/auth/register                       │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Backend:                                                 │
    │ 1. Verifica se email já existe                          │
    │ 2. Hash senha com bcrypt (salt rounds: 10)              │
    │ 3. Cria novo Usuario                                    │
    │ 4. Gera JWT tokens:                                     │
    │    - access_token (15 min)                              │
    │    - refresh_token (7 dias)                             │
    │ 5. Salva refresh_token no BD                            │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Retorna:                                                 │
    │ {                                                        │
    │   access_token: "eyJhbGc...",                           │
    │   refresh_token: "eyJhbGc...",                          │
    │   user: { id, email, nome, role }                       │
    │ }                                                        │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Frontend: Salva tokens em localStorage                  │
    │ localStorage.setItem('accessToken', token)              │
    │ localStorage.setItem('refreshToken', token)             │
    └──────────────────────────────────────────────────────────┘

2️⃣  LOGIN
    ┌──────────────────────────────────────────────────────────┐
    │ Usuário entra: email, senha                             │
    │ Frontend: POST /api/auth/login                          │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Backend:                                                 │
    │ 1. Busca Usuario pelo email                             │
    │ 2. Compara senha com bcrypt.compare()                   │
    │ 3. Atualiza Usuario.ultimo_acesso                       │
    │ 4. Gera novos tokens                                    │
    │ 5. Salva novo refresh_token                             │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼ (Mesma resposta do Registro)

3️⃣  REQUISIÇÃO PROTEGIDA
    ┌──────────────────────────────────────────────────────────┐
    │ Frontend quer acessar /api/receitas                     │
    │ 1. GET com header: "Authorization: Bearer {token}"      │
    │                                                          │
    │ Interceptor Axios:                                       │
    │ - Pega accessToken de localStorage                      │
    │ - Adiciona ao header                                    │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Backend JwtStrategy:                                     │
    │ 1. Extrai token do header                               │
    │ 2. Verifica assinatura com JWT_SECRET                   │
    │ 3. Extrai payload (sub=userId, email, role)             │
    │ 4. Carrega Usuario do BD                                │
    │ 5. Injeta em request.user                               │
    └──────────────────────┬─────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
           Válido   ▼      Inválido/Expirado
                    ✅           ▼
            Continua    ┌──────────────────┐
            requisição  │ Response: 401    │
                        │ Unauthorized     │
                        │                  │
                        │ Frontend:        │
                        │ - Tenta refresh  │
                        │ - POST /refresh  │
                        │   com token novo │
                        │ - Retry request  │
                        └──────────────────┘

4️⃣  TOKEN REFRESH
    ┌──────────────────────────────────────────────────────────┐
    │ Frontend: POST /api/auth/refresh                        │
    │ Body: { refresh_token }                                 │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Backend:                                                 │
    │ 1. Verifica assinatura com JWT_REFRESH_SECRET           │
    │ 2. Busca Usuario pelo payload.sub                       │
    │ 3. Valida: usuario.refresh_token === token              │
    │ 4. Se OK: Gera novos tokens                             │
    │ 5. Salva novo refresh_token                             │
    │ 6. Retorna novos tokens                                 │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Frontend:                                                │
    │ - Salva novo accessToken                                │
    │ - Salva novo refreshToken                               │
    │ - Retorna original requisição com novo token            │
    └──────────────────────────────────────────────────────────┘

5️⃣  LOGOUT
    ┌──────────────────────────────────────────────────────────┐
    │ Frontend: POST /api/auth/logout                         │
    │ Header: "Authorization: Bearer {token}"                 │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Backend:                                                 │
    │ 1. Pega userId do token                                 │
    │ 2. Seta Usuario.refresh_token = null                    │
    │ 3. Retorna 204 No Content                               │
    └──────────────────────┬─────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │ Frontend:                                                │
    │ - Remove tokens de localStorage                         │
    │ - Redireciona para /login                               │
    └──────────────────────────────────────────────────────────┘
```

---

## 📱 Fluxo de Dados: Compra via QR Code

```
┌─────────────────────────────────────────────────────────────────────────────┐
│       FLUXO COMPLETO: REGISTRO DE COMPRA COM SCAN QR (Nota Fiscal)         │
└─────────────────────────────────────────────────────────────────────────────┘

1. MOBILE - Iniciar Scan
   ┌────────────────────────┐
   │ HomeScreenRecipes      │
   │ - User taps "Scan QR"  │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ QRScannerScreen        │
   │ - Camera abre          │
   │ - User aponta à nota   │
   │ - Scan QR Code         │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ Extrai: qrCodeTexto                        │
   │ Ex: "SAT12345|2024-01-20|..."              │
   └────────┬───────────────────────────────────┘

2. VALIDAÇÃO E PARSING
   ┌────────────────────────────────────────────┐
   │ POST /api/scraper/consulta                 │
   │ Body: { qrCodeTexto }                      │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ Backend ScraperService:                    │
   │ 1. Parse QR SAT format                     │
   │ 2. Extrai:                                 │
   │    - data_compra                           │
   │    - valor_total                           │
   │    - produto_nomes (lista)                 │
   │ 3. Simula obtenção de receipt (OCR/API)    │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ ShowProcessingScreen                       │
   │ - Exibe spinner                            │
   │ - "Processando compra..."                  │
   └────────────────────────────────────────────┘

3. CLASSIFICAÇÃO IA - BATCH
   ┌────────────────────────────────────────────┐
   │ ProductClassificationService               │
   │ .classificarEmBatch(nomes_produtos)        │
   │                                            │
   │ Divide em chunks (ex: 10 por vez)          │
   │ Para cada chunk:                           │
   │ - Envia para Claude AI                     │
   │ - Claude classifica cada produto           │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ Claude Response (para cada produto):       │
   │ {                                          │
   │   "produto": "Leite Integral",             │
   │   "categoria": "alimento",                 │
   │   "confidence": 0.98,                      │
   │   "reasoning": "Produto lácteo..."         │
   │ }                                          │
   │                                            │
   │ Filtra apenas "categoria: alimento"        │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ Armazena log para auditoria:               │
   │ ProductValidationLog {                     │
   │   usuario_id, texto_original, resposta_ia  │
   │ }                                          │
   └────────────────────────────────────────────┘

4. BUSCAR PRODUTOS NO BANCO
   ┌────────────────────────────────────────────┐
   │ Para cada produto classificado:            │
   │                                            │
   │ ProdutosService.buscarOuCriarPelaNome()    │
   │                                            │
   │ 1. Busca no BD por nome (fuzzy search)     │
   │ 2. Se encontrou: usa produto existente     │
   │ 3. Se não achou: cria novo produto        │
   │    (com dados básicos)                     │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ Retorna lista de Produto IDs               │
   │ Ex: [prod123, prod456, ...]                │
   └────────────────────────────────────────────┘

5. CRIAR COMPRA
   ┌────────────────────────────────────────────┐
   │ ComprasService.criar({                     │
   │   usuario_id,                              │
   │   data_compra,                             │
   │   valor_total,                             │
   │   metodo_cadastro: 'QR_CODE'               │
   │ })                                         │
   │                                            │
   │ Cria: Compra entity                        │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ CRIAR COMPRA ITENS                         │
   │                                            │
   │ Para cada produto validado:                │
   │ CompraItem.create({                        │
   │   compra_id,                               │
   │   produto_id,                              │
   │   quantidade: 1 (padrão),                  │
   │   unidade: 'UN',                           │
   │   preco_unitario: null,                    │
   │   validade_manual: null                    │
   │ })                                         │
   │                                            │
   │ Salva no BD                                │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ ATUALIZAR INVENTÁRIO                       │
   │                                            │
   │ InventarioService.sincronizar()            │
   │                                            │
   │ Para cada CompraItem:                      │
   │ 1. Busca Inventario (usuario, produto)     │
   │ 2. Se existe: quantidade += item qty       │
   │ 3. Se novo: cria Inventario                │
   │ 4. Seta data_validade se tiver             │
   └────────┬───────────────────────────────────┘
            │
            ▼

6. MOBILE - RESULTADO
   ┌────────────────────────────────────────────┐
   │ Frontend recebe resposta:                  │
   │ {                                          │
   │   compra: { id, data, total, ... },        │
   │   itens: [ { produto, qtd, ... }, ... ],   │
   │   sucesso: true                            │
   │ }                                          │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ ResultScreen (Sucesso)                     │
   │ - Mostra lista de itens adicionados        │
   │ - Mostra: "5 produtos adicionados"         │
   │ - Mostra: "2 itens com validade próxima"   │
   │ - Botão: "Ver no Inventário"               │
   │ - Botão: "Voltar para Home"                │
   └────────────────────────────────────────────┘

7. SINCRONIZAÇÃO COM RECEITAS
   ┌────────────────────────────────────────────┐
   │ ReceitasService.gerarSugestoes()           │
   │                                            │
   │ MOI v1 algoritmo:                          │
   │ 1. Carrega Inventario do usuario           │
   │ 2. Para cada Receita no BD:                │
   │    - Conta ingredientes disponíveis        │
   │    - Score = (avail/total) * rating        │
   │ 3. Filtra por preferências do user         │
   │ 4. Ordena por score                        │
   │ 5. Retorna top 10 recipes                  │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────┐
   │ HomeScreenRecipes atualiza                 │
   │ - Novo carousel com "Receitas Sugeridas"   │
   │ - Mostra: "Você pode fazer Bolo..."        │
   │ - "Você tem: Leite, Ovos, Açúcar..."       │
   │ - Clique para ver receita completa         │
   └────────────────────────────────────────────┘
```

---

## 🚀 Fluxo de Dados: Sugestão de Receita

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO: SUGESTÃO INTELIGENTE DE RECEITAS                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. USUÁRIO VISUALIZA HOME
   ┌──────────────────────────┐
   │ HomeScreenRecipes        │
   │ useEffect(() => {        │
   │   carregarReceitas()     │
   │ })                       │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────┐
   │ GET /api/receitas/sugestoes              │
   │ Header: Authorization: Bearer {token}    │
   └────────┬─────────────────────────────────┘
            │
            ▼

2. BACKEND - CARREGAR DADOS
   ┌──────────────────────────────────────────┐
   │ ReceitasService.gerarSugestoes()         │
   │                                          │
   │ 1. Pega userId do JWT token              │
   │                                          │
   │ 2. SELECT * FROM inventario              │
   │    WHERE usuario_id = userId             │
   │                                          │
   │    Resultado:                            │
   │    [                                     │
   │      { produto: Leite (500ml), qty: 2 },│
   │      { produto: Ovos, qty: 6 },          │
   │      { produto: Açúcar (500g), qty: 1 },│
   │      { produto: Farinha (1kg), qty: 1 }, │
   │      ...mais itens                       │
   │    ]                                     │
   └────────┬─────────────────────────────────┘
            │
            ▼

3. MOI v1 ALGORITMO - MATCHING
   ┌──────────────────────────────────────────┐
   │ Para cada Receita no banco:              │
   │                                          │
   │ SELECT receita_ingrediente.*             │
   │ FROM receita_ingrediente                 │
   │ WHERE receita_id = $1                    │
   │                                          │
   │ Ex: Receita "Bolo de Chocolate"          │
   │ Ingredientes:                            │
   │   - Leite (200ml) ✅ DISPONÍVEL          │
   │   - Ovos (3) ✅ DISPONÍVEL               │
   │   - Açúcar (100g) ✅ DISPONÍVEL          │
   │   - Farinha (150g) ✅ DISPONÍVEL         │
   │   - Chocolate (50g) ❌ NÃO TEM           │
   │                                          │
   │ Score = 4/5 = 0.8 (80% dos ingredientes)│
   │ Final Score = 0.8 * Rating               │
   │             = 0.8 * 4.5                  │
   │             = 3.6 ⭐⭐⭐                 │
   └────────┬─────────────────────────────────┘
            │
            ▼

4. FILTRAR POR PREFERÊNCIAS
   ┌──────────────────────────────────────────┐
   │ Consulta Preferencia do usuario:         │
   │                                          │
   │ WHERE usuario_id = userId                │
   │                                          │
   │ Resultado:                               │
   │ {                                        │
   │   tags_dieta: [vegano],                  │
   │   tempo_maximo_preparo: 60 min,          │
   │   dificuldade: [facil, media],           │
   │   ingredientes_evitar: [glúten, leite]   │
   │ }                                        │
   │                                          │
   │ FILTRA receitas:                         │
   │ - Que NÃO contenham leite                │
   │ - Que sejam vegan OU que usem leite ❌   │
   │ - Que levem <= 60 min                    │
   │ - Que sejam fácil/média                  │
   └────────┬─────────────────────────────────┘
            │
            ▼

5. ORDENAR E LIMITAR
   ┌──────────────────────────────────────────┐
   │ ORDER BY score DESC                      │
   │ LIMIT 10                                 │
   │                                          │
   │ Resultado Ordenado:                      │
   │ 1. Bolo de Chocolate      (score: 3.6)   │
   │ 2. Panqueca               (score: 3.4)   │
   │ 3. Omelete                (score: 3.2)   │
   │ 4. Pudim                  (score: 3.0)   │
   │ ... (até 10 receitas)                    │
   └────────┬─────────────────────────────────┘
            │
            ▼

6. RETORNAR COM DETALHES
   ┌──────────────────────────────────────────┐
   │ Para cada Receita selecionada:           │
   │                                          │
   │ JOIN receita_ingrediente                 │
   │ JOIN produto                             │
   │                                          │
   │ Retorna:                                 │
   │ {                                        │
   │   id, nome, tempo_preparo, dificuldade,  │
   │   avaliacao_media, vezes_executada,      │
   │   ingredientes: [                        │
   │     {                                    │
   │       produto: { id, nome, ... },        │
   │       quantidade, unidade,               │
   │       disponivel: true|false,            │
   │       quantidade_inventario              │
   │     },                                   │
   │     ...                                  │
   │   ]                                      │
   │ }                                        │
   └────────┬─────────────────────────────────┘
            │
            ▼

7. CACHE RESPONSE
   ┌──────────────────────────────────────────┐
   │ Redis.set(                               │
   │   "sugestoes_#{userId}",                 │
   │   data,                                  │
   │   { ttl: 5 * 60 } // 5 minutos           │
   │ )                                        │
   │                                          │
   │ Próxima requisição do mesmo usuário      │
   │ dentro de 5 min retorna do cache         │
   └────────┬─────────────────────────────────┘
            │
            ▼

8. FRONTEND - EXIBIR
   ┌──────────────────────────────────────────┐
   │ Response recebido:                       │
   │ [ receita1, receita2, receita3, ... ]    │
   └────────┬─────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────┐
   │ HomeScreenRecipes renderiza:             │
   │                                          │
   │ ┌────────────────────────────────────┐  │
   │ │  "Receitas para você"              │  │
   │ │  Carousel / FlatList                │  │
   │ │  ┌──────────────┐┌──────────────┐  │  │
   │ │  │ Bolo 🍰      ││ Panqueca 🥞  │  │  │
   │ │  │ ⭐⭐⭐⭐⭐    ││ ⭐⭐⭐⭐      │  │  │
   │ │  │ 30 min       ││ 20 min       │  │  │
   │ │  │ Fácil        ││ Fácil        │  │  │
   │ │  │              ││              │  │  │
   │ │  │ Você tem 4/5 ││ Você tem 5/5 │  │  │
   │ │  │ ingredientes ││ ingredientes │  │  │
   │ │  └──────────────┘└──────────────┘  │  │
   │ │  ┌──────────────┐                   │  │
   │ │  │ Omelete 🍳   │ ...              │  │
   │ │  │ ⭐⭐⭐       │                   │  │
   │ │  │ 15 min       │                   │  │
   │ │  │ Fácil        │                   │  │
   │ │  └──────────────┘                   │  │
   │ └────────────────────────────────────┘  │
   └────────────────────────────────────────────┘

9. USUÁRIO CLICA EM RECEITA
   ┌──────────────────────────────────────────┐
   │ Navega para RecipeDetailsScreen           │
   │ Passa: receita_id                        │
   │                                          │
   │ Exibe:                                   │
   │ - Nome da receita                        │
   │ - Foto (se tiver)                        │
   │ - Modo de preparo passo a passo          │
   │ - Informações nutricionais               │
   │ - Ingredientes com status (✅ ou ❌)     │
   │ - Botões: "Executar" ou "Favoritar"      │
   └────────┬─────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────┐
   │ USER CLICA "Executar Receita"            │
   │ POST /api/receitas/:id/executar          │
   │ Body: {                                  │
   │   porcoes_feitas: 2,                     │
   │   tempo_real_preparo: 45,                │
   │   avaliacao: 5,                          │
   │   comentario: "Ficou perfeita!"          │
   │ }                                        │
   │                                          │
   │ Backend:                                 │
   │ 1. Cria ReceitaExecutada                 │
   │ 2. Deduz ingredientes do Inventario      │
   │ 3. Atualiza vezes_executada              │
   │ 4. Recalcula avaliacao_media             │
   │ 5. Retorna sucesso                       │
   └────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Sincronização: Mobile ↔️ Backend

```
MOBILE SYNCRONIZATION FLOW

Push Updates
├─ User edits Inventário locally
├─ App detects change (AsyncStorage)
├─ Sends to backend:
│  POST /api/inventario (create/update/delete)
└─ Receives confirmation + synced data

Pull Updates
├─ App starts
├─ Checks last_sync_timestamp
├─ GET /api/receitas/sugestoes (get fresh data)
└─ Updates local cache

Offline Mode
├─ Store requests in AsyncStorage.queue
├─ When online, sends batch update
└─ Synchronizes with backend
```

---

## 📊 Stack Tecnológico

```
CAMADA DE APRESENTAÇÃO
├─ Frontend Web
│  ├─ React 19.2.0
│  ├─ TypeScript 5.9
│  ├─ Vite 7.2.2
│  ├─ React Router 7.9.5
│  ├─ Tailwind CSS 4.1.17
│  └─ Axios 1.13.2
│
└─ Mobile Native
   ├─ React Native 0.81.5
   ├─ Expo 54.0.0
   ├─ React Navigation
   ├─ expo-camera (QR Scanner)
   ├─ expo-secure-store
   └─ Axios 1.6.2

CAMADA DE API
├─ NestJS 11.0.1
├─ Express (built-in)
├─ Passport + JWT
├─ Swagger/OpenAPI
└─ CORS enabled

CAMADA DE NEGÓCIOS
├─ TypeScript 5.7.3
├─ bcrypt (password hashing)
├─ class-validator
├─ class-transformer
└─ Google Generative AI SDK

CAMADA DE DADOS
├─ PostgreSQL (latest)
├─ TypeORM 0.3.27
├─ Redis (latest)
├─ cache-manager 7.2.5
└─ pg driver

FERRAMENTAS
├─ Jest 30.0.0 (testes)
├─ ts-jest 29.2.5
├─ ESLint 9.18.0
├─ Prettier 3.4.2
└─ Docker & Docker Compose (opcional)
```

---

## 🔐 Segurança

```
AUTHENTICATION & AUTHORIZATION
├─ JWT tokens (access + refresh)
├─ Bcrypt password hashing (10 rounds)
├─ HttpOnly cookies (opcional)
├─ CORS whitelist
├─ Rate limiting (optional)
└─ Role-based access control (RBAC)

DATA PROTECTION
├─ Encrypted passwords
├─ Secure token storage (mobile)
├─ SQL injection prevention (TypeORM)
├─ XSS prevention (React)
├─ CSRF protection
└─ Input validation & sanitization
```

---

Este documento apresenta a arquitetura completa do CookMe! 🎉

Para diagramas mais detalhados, veja os outros arquivos de documentação.
