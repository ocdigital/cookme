# Backend — Endpoints da API

Todos os endpoints têm prefixo `/api`. Autenticação via `Authorization: Bearer <token>` exceto onde indicado `[público]`.

## Auth `/auth`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Registrar novo usuário | público |
| POST | `/auth/login` | Login email/senha | público |
| POST | `/auth/google-login` | Login via Google (`idToken`) | público |
| POST | `/auth/apple-login` | Login via Apple Sign In (`identityToken`, `fullName?`) | público |
| POST | `/auth/refresh` | Renovar access token (`refresh_token`) | público |
| POST | `/auth/logout` | Logout (remove refresh token) | ✓ |
| POST | `/auth/change-password` | Alterar senha | ✓ |
| GET | `/auth/me` | Dados do usuário autenticado | ✓ |

**Response auth:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "usuario": { "id": "...", "nome": "...", "email": "..." }
}
```

---

## Usuários `/usuarios`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/usuarios/me` | Perfil do usuário |
| PATCH | `/usuarios/me` | Atualizar perfil |
| POST | `/usuarios/me/avatar` | Upload avatar (multipart, campo `file`, máx 5MB) |
| DELETE | `/usuarios/me` | Deletar conta |
| GET | `/usuarios/preferencias` | Obter preferências |
| PATCH | `/usuarios/preferencias` | Atualizar preferências |
| PATCH | `/usuarios/push-token` | Salvar push token do dispositivo |

**Preferências (`UpdatePreferenciaDto`):**
```json
{
  "modo_alimentar": "normal | fitness | vegetariano | vegano",
  "refeicoes_planejamento": "almoco_jantar | almoco | jantar",
  "regiao_culinaria": "string"
}
```

---

## Receitas `/receitas`

### Banco e disponibilidade

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/receitas/disponiveis` | Lista receitas com cobertura baseada no inventário do usuário. Inclui parciais (40-69%). Aplica filtro por `modo_alimentar`. |
| GET | `/receitas/quase-possiveis` | Receitas com cobertura 40-74% (quase possíveis). Ordenado por menos ingredientes faltando. |
| GET | `/receitas/mais-feita-hoje` | Receita mais feita hoje (ou mais popular global), filtrada por modo alimentar |
| GET | `/receitas/fitness` | Receitas fitness com cobertura do inventário |
| GET | `/receitas/:id` | Receita por ID com cobertura do usuário |

**Response `/receitas/disponiveis`:**
```json
{
  "total": 42,
  "disponiveis": 18,
  "parciais": 24,
  "ingredientes_ativos": 15,
  "ingredientes_vencendo": ["arroz", "ovo"],
  "modo_alimentar": "normal",
  "receitas": [{
    "id": "...",
    "nome": "...",
    "cobertura": 85,
    "disponivel": true,
    "tem_protagonista": true,
    "faltando": [],
    "usa_vencendo": ["arroz"],
    "tags_dieta": "fitness,proteico"
  }]
}
```

### Favoritos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/receitas/favoritas` | Lista receitas favoritas |
| POST | `/receitas/:id/favoritar` | Toggle favorito (add/remove) |
| GET | `/receitas/:id/favoritado` | Verifica se está favoritada |

### Minhas receitas (enviadas pelo usuário)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/receitas/minhas` | Lista receitas criadas pelo usuário |
| POST | `/receitas/minhas` | Cria receita (entra em revisão `status_moderacao: em_revisao`) |
| DELETE | `/receitas/minhas/:id` | Remove própria receita |

**Body POST `/receitas/minhas`:**
```json
{
  "titulo": "Frango Grelhado",
  "descricao": "...",
  "tempo_preparo": 30,
  "dificuldade": "facil | media | dificil",
  "rendimento_porcoes": 2,
  "categoria_receita": "almoco | jantar",
  "modo_preparo": "Passo a passo...",
  "ingredientes": [
    { "nome": "frango", "quantidade": "500", "unidade": "g", "a_gosto": false }
  ]
}
```

### Execução e aprendizado

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/receitas/executadas` | Histórico de receitas executadas (50 últimas) |
| POST | `/receitas/:id/executar` | Registrar execução + incrementa contador global |
| GET | `/receitas/perfil-aprendizado` | Perfil de aprendizado do CookMe sobre o usuário |

### Comprar ingredientes faltando

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/receitas/:id/comprar-faltando` | Adiciona ingredientes faltantes da receita à lista de compras ativa |

**Body:**
```json
{ "lista_id": "uuid-opcional" }
```

### Geração IA

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/receitas/gerar` | Gera receitas baseado no inventário (rate limit: 10/min) |
| POST | `/receitas/gerar/test` | TEST: gera sem autenticação [público] |

**Body POST `/receitas/gerar`:**
```json
{
  "ingredientes": ["arroz", "frango"],
  "forcar_ia": false
}
```
`ingredientes` vazio → usa todos do inventário do usuário.

### OCR cupom fiscal

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/receitas/ocr/extract-from-image` | OCR de imagem via Gemini Vision (`image` base64, `mimeType?`) |
| POST | `/receitas/ocr/process` | Processa texto OCR de múltiplas fotos, deduplication |
| POST | `/receitas/ocr/validate` | Valida/confirma itens após review |
| POST | `/receitas/ocr/classify-items` | Classifica itens como alimento/não-alimento via IA |

**Body POST `/receitas/ocr/process`:**
```json
{
  "photos": [
    { "ocrText": "...", "photoNumber": 1, "totalPhotos": 2 }
  ],
  "ignoreWarnings": false
}
```

**Response status `review_required`** → tem duplicatas para usuário resolver.
**Response status `success`** → itens prontos.

---

## Inventário `/inventario`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/inventario` | Lista inventário com detalhes de classificação. Query: `ingrediente_receita=true/false` |
| POST | `/inventario` | Adicionar item (DTO completo) |
| POST | `/inventario/adicionar-manual` | Adicionar por nome: `{ nome, quantidade, unidade, data_validade? }` |
| POST | `/inventario/importar-automatico` | Importa ingredientes elegíveis das compras pendentes |
| GET | `/inventario/stats` | Estatísticas do inventário |
| GET | `/inventario/vencendo` | Itens vencendo em breve. Query: `days=7` |
| GET | `/inventario/vencidos` | Itens vencidos |
| GET | `/inventario/ingredientes-disponiveis` | Lista nomes normalizados para matching com receitas |
| GET | `/inventario/:id` | Buscar item por ID |
| PUT | `/inventario/:id` | Atualizar item (com detalhes do produto) |
| PATCH | `/inventario/:id` | Atualizar item (campos parciais) |
| PATCH | `/inventario/:id/nome` | Corrigir nome exibido (treina alias) |
| PATCH | `/inventario/:id/esgotado` | Marcar/desmarcar como esgotado `{ esgotado: true }` |
| DELETE | `/inventario/:id` | Remover item |
| DELETE | `/inventario/todos` | Limpar todo o inventário |

---

## Lista de Compras `/listas`

### Listas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/listas` | Criar lista |
| GET | `/listas` | Listar todas as listas do usuário |
| GET | `/listas/:id` | Obter lista por ID |
| PUT | `/listas/:id` | Atualizar lista |
| DELETE | `/listas/:id` | Deletar lista |
| POST | `/listas/:id/arquivar` | Arquivar lista |
| POST | `/listas/:id/duplicar` | Duplicar lista |
| POST | `/listas/:id/limpar-comprados` | Remove itens marcados como comprados |

### Itens da lista

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/listas/:listaId/itens` | Adicionar item |
| GET | `/listas/:listaId/itens` | Listar itens |
| PUT | `/listas/:listaId/itens/:itemId` | Atualizar item |
| DELETE | `/listas/:listaId/itens/:itemId` | Deletar item |
| PUT | `/listas/:listaId/itens/:itemId/marcar-comprado` | Marcar comprado `{ comprado: true }` |

---

## Planejamento `/planejamento`

Semanas 1-4 do mês. Dias 0=domingo … 6=sábado. Tipos: `almoco` | `jantar`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/planejamento/semana/:semana` | Lista planejamento da semana (1-4) |
| GET | `/planejamento/hoje` | Receita do dia (almoço de hoje) |
| POST | `/planejamento/semana/:semana/dia/:dia/:tipo` | Definir receita. Body: `{ receita_id: "uuid" | null }` |
| POST | `/planejamento/semana/:semana/aleatorio` | Gera semana aleatória. Body: `{ apenas_regional?: false }` |
| POST | `/planejamento/:id/feita` | Marcar como feita. Body: `{ avaliacao?: 1-5 }` |
| DELETE | `/planejamento/semana/:semana/dia/:dia` | Limpar dia. Query: `tipo=almoco\|jantar` |

---

## Compras `/compras`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/compras` | Criar compra com itens |
| GET | `/compras` | Listar compras. Query: `limit`, `mes`, `ano` |
| GET | `/compras/stats` | Estatísticas de compras |
| GET | `/compras/resumo-mes` | Resumo de gastos por mês. Query: `mes`, `ano` |
| POST | `/compras/ocr-cupom` | OCR cupom: `{ image_base64, image_type }` |
| POST | `/compras/ocr-cupom/salvar-itens` | Salvar itens do cupom no inventário |
| POST | `/compras/ocr-validade` | OCR data de validade: `{ image_base64 }` |
| GET | `/compras/:id` | Buscar compra por ID |
| DELETE | `/compras/:id` | Deletar compra |

---

## Produtos `/produtos`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/produtos` | Criar produto |
| GET | `/produtos` | Listar (cache 5min). Query: `search`, `categoriaId`, `page=1`, `limit=50` |
| GET | `/produtos/search` | Autocomplete (cache 10min). Query: `q` |
| GET | `/produtos/:id` | Produto por ID |
| PATCH | `/produtos/:id` | Atualizar produto |
| DELETE | `/produtos/:id` | Deletar produto |
| GET | `/produtos/marcas` | Listar marcas |
| POST | `/produtos/marcas` | Criar marca |
| GET | `/produtos/categorias` | Listar categorias |
| POST | `/produtos/categorias` | Criar categoria |

---

## Notificações `/notificacoes`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notificacoes` | Listar notificações do usuário. Query: `naoLidas=true` |
| GET | `/notificacoes/nao-lidas/count` | Contar não lidas |
| PATCH | `/notificacoes/marcar-todas/lido` | Marcar todas como lidas |
| PATCH | `/notificacoes/:id/lido` | Marcar uma como lida |
| DELETE | `/notificacoes/:id` | Deletar notificação |
| POST | `/notificacoes/test/trigger` | **[TESTE — remover em produção]** Dispara notificação de teste [público] |

**WebSocket:** `ws://localhost:3000/notificacoes` (Socket.io)

**Triggers disponíveis:**
| Trigger | Quando usar |
|---------|------------|
| `receitaDenunciada(id, nome, contador)` | Ao registrar denúncia de receita |
| `novoUsuario(id, nome, email)` | No cadastro de novo usuário |
| `usuarioInativo(id, nome, diasInativo)` | Job diário — 30+ dias sem acesso |
| `produtoIncompleto(id, nome, campos[])` | Ao criar produto sem dados obrigatórios |
| `erroSistema(titulo, detalhes)` | Em handlers de erro crítico |
| `limiteRecursos(recurso, usado, limite)` | Monitoramento de recursos |
| `limiteIAAtingido(provedor, detalhes)` | Cota IA esgotada |

---

## Barcode `/barcode`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/barcode/scan/:codigo` | Busca produto por código de barras |

---

## IA `/ia`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/ia/classificar-produto` | Classifica produto: `{ nome_produto }` |
| POST | `/ia/gerar-receita` | Gera receita: `{ ingredientes[], preferencias? }` |
| POST | `/ia/sugerir-compras` | Sugere compras: `{ inventario[], receitas_desejadas[] }` |

---

## Stripe `/stripe`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/stripe/planos` | Lista planos disponíveis |
| POST | `/stripe/checkout` | Cria sessão Stripe Checkout. Body: `{ plano: "premium_mensal\|premium_anual\|familia" }` |
| POST | `/stripe/portal` | Abre portal de gerenciamento de assinatura |
| GET | `/stripe/status` | Status da assinatura do usuário logado |

---

## Admin `/admin`

> Requer role admin.

### Produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/produtos` | Lista com filtros e paginação |
| GET | `/admin/produtos/categorias` | Lista categorias |
| GET | `/admin/produtos/stats` | Estatísticas de produtos |
| PATCH | `/admin/produtos/:id/classificacao` | Atualiza `ingrediente_receita`: `{ ingrediente_receita: bool }` |

### Usuários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/usuarios` | Lista. Query: `page`, `limit`, `search`, `role` |
| GET | `/admin/usuarios/stats` | Estatísticas |
| POST | `/admin/usuarios` | Criar usuário |
| PATCH | `/admin/usuarios/:id` | Atualizar usuário |
| DELETE | `/admin/usuarios/:id` | Deletar usuário |

### Receitas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/receitas` | Lista receitas com filtros |
| POST | `/admin/receitas/popular-banco` | Popula banco — body: `{ modos?: ["normal","fitness","vegetariano","vegano"] }` |
| POST | `/admin/receitas/popular-banco/:modo` | Popula modo específico: `normal\|fitness\|vegetariano\|vegano` |

### Sistema

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/stats` | Estatísticas gerais do sistema |
| GET | `/admin/health` | Health check |
| GET | `/health` | Health check público |
