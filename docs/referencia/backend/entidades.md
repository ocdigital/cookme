# Backend — Entidades TypeORM

## `usuarios` (Usuario)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `email` | string unique | indexado |
| `senha` | string | **`senha`** (não `senha_hash`), excluída das responses |
| `nome` | string | |
| `telefone` | string nullable | |
| `role` | enum | `user` \| `admin` |
| `alertas_habilitados` | bool | default true |
| `horario_alertas` | time | ex: `08:00:00` |
| `avatar_url` | string nullable | |
| `email_verificado` | bool | |
| `deve_trocar_senha` | bool | |
| `refresh_token` | text nullable | excluído das responses |
| `push_token` | string nullable | Expo push token |
| `google_id` | string nullable | OAuth Google |
| `apple_id` | string nullable | Apple Sign In |
| `criado_em` / `atualizado_em` | timestamp | |

**Relações:** `OneToOne` Preferencia, `OneToMany` Compra/Inventario/ReceitaExecutada

---

## `preferencias` (Preferencia)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `modo_alimentar` | string | `normal` \| `fitness` \| `vegetariano` \| `vegano` |
| `refeicoes_planejamento` | string | `almoco_jantar` \| `almoco` \| `jantar` |
| `regiao_culinaria` | string | estado/região (filtro regional desabilitado) |

---

## `receitas` (Receita)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `nome` | string | indexado |
| `descricao` | text nullable | |
| `modo_preparo` | text | |
| `tempo_preparo` | int nullable | minutos |
| `rendimento_porcoes` | int | default 1 |
| `dificuldade` | enum | `facil` \| `media` \| `dificil` |
| `tags_dieta` | simple-array | CSV: `fitness,vegetariano,vegano,low-carb,proteico` |
| `tags_preparo` | simple-array | CSV: `rapido,facil,festa` |
| `categoria_receita` | string | `almoco` \| `jantar` \| `cafe-da-manha` \| `sobremesa` |
| `imagem_url` | string nullable | Freepik via Puppeteer |
| `informacoes_nutricionais` | jsonb | `{ calorias, proteinas, carboidratos, gorduras }` |
| `ingredientes_chave` | text[] | array lowercase sem acento para matching |
| `origem` | string | `catalogo` \| `ia_gerada` \| `usuario` \| `internet` |
| `fonte_url` | string nullable | URL da fonte (TudoGostoso etc) |
| `status_moderacao` | string | `ok` \| `pendente` \| `rejeitado` \| `em_revisao` |
| `autor_id` | uuid nullable | usuário que enviou (origem = usuario) |
| `vezes_executada` | int | contador global |
| `avaliacao_media` | decimal | média das avaliações |
| `criado_em` / `atualizado_em` | timestamp | |

> ⚠️ `tags_dieta` é `simple-array` (CSV). Nunca filtrar com LIKE no SQL — filtrar em JS após `find()`.

**Relações:** `OneToMany` ReceitaIngrediente, ReceitaExecutada

---

## `receita_ingredientes` (ReceitaIngrediente)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `receita_id` | uuid FK | |
| `observacao` | string | texto livre: "500g de frango" |
| `a_gosto` | bool | |
| `ordem` | int | ordem de exibição |

---

## `receitas_executadas` (ReceitaExecutada)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `receita_id` | uuid FK | |
| `criado_em` | timestamp | quando foi executada |

---

## `receitas_favoritas` (ReceitaFavorita)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `receita_id` | uuid FK | |

---

## `inventario` (Inventario)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | indexado |
| `produto_id` | uuid FK | indexado |
| `quantidade_disponivel` | decimal(10,3) | |
| `unidade` | enum UnidadeMedida | `g` \| `kg` \| `ml` \| `l` \| `un` \| `cx` ... |
| `data_validade` | date nullable | indexado |
| `compra_item_id` | uuid nullable | rastreabilidade |
| `metodo_atualizacao` | enum | `manual` \| `ocr` \| `barcode` \| `importacao` |
| `localizacao` | string nullable | `geladeira` \| `despensa` \| `freezer` |
| `esgotado` | bool | |
| `esgotado_em` | timestamp nullable | |
| `criado_em` / `ultima_atualizacao` | timestamp | |

> ⚠️ Unique constraint: `(usuario_id, produto_id, data_validade)` — ao inserir checar `data_validade IS NULL` separadamente.

---

## `produtos` (Produto)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `nome` | string | |
| `nome_display` | string nullable | nome humanizado |
| `codigo_barras` | string unique nullable | |
| `marca_id` | uuid FK nullable | |
| `categoria_id` | uuid FK nullable | |
| `unidade_padrao` | enum | **`unidade_padrao`** (não `unidade_medida`) |
| `ingrediente_receita` | bool | é ingrediente de receita (vs produto de limpeza etc) |
| `imagem_url` | string nullable | |
| `descricao` | text nullable | |
| `criado_em` / `atualizado_em` | timestamp | |

---

## `listas` (Lista)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `titulo` | string | |
| `status` | string | `ativa` \| `arquivada` |
| `criado_em` / `atualizado_em` | timestamp | |

## `item_lista` (ItemLista)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `lista_id` | uuid FK | |
| `nome` | string | |
| `quantidade` | decimal nullable | |
| `unidade` | string nullable | |
| `observacao` | string nullable | |
| `comprado` | bool | default false |
| `criado_em` | timestamp | |

---

## `compras` (Compra)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `estabelecimento_nome` | string nullable | |
| `data_compra` | date | |
| `valor_total` | decimal | |
| `criado_em` | timestamp | |

**Relações:** `OneToMany` CompraItem

## `compra_itens` (CompraItem)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `compra_id` | uuid FK | |
| `produto_id` | uuid FK nullable | |
| `nome_original` | string | nome como veio do OCR |
| `quantidade` | decimal | |
| `unidade` | string | |
| `valor_unitario` | decimal nullable | |
| `valor_total` | decimal nullable | |
| `codigo_barras` | string nullable | |

---

## `planejamento_semanal` (PlanejamentoSemanal)

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `receita_id` | uuid FK nullable | |
| `numero_semana` | int | 1-4 (semana do mês) |
| `dia_semana` | int | 0=domingo … 6=sábado |
| `tipo_refeicao` | string | `almoco` \| `jantar` |
| `feita` | bool | |
| `avaliacao` | int nullable | 1-5 |
| `criado_em` / `atualizado_em` | timestamp | |

---

## `notificacoes` (Notificacao)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | admin owner |
| `titulo` | string | |
| `mensagem` | text | |
| `tipo` | string | `receita_denunciada` \| `novo_usuario` \| etc |
| `dados` | jsonb | payload extra |
| `lida` | bool | |
| `criado_em` | timestamp | |

---

## `product_knowledge_base` (ProductKnowledgeBase)

Cache compartilhado de classificação de produtos entre usuários.

| Coluna | Tipo | Obs |
| -------- | ------ | ----- |
| `id` | uuid PK | |
| `produto` | string | nome normalizado |
| `categoria` | string | `alimento` \| `nao-alimento` \| `indefinido` |
| `ingrediente_receita` | bool nullable | |
| `descricao` | string nullable | |
| `confidence` | decimal | 0-1 |
| `classificado_por_ia` | bool | |
| `validado_por_usuario` | bool | |
| `criado_em` / `atualizado_em` | timestamp | |

---

## `subscriptions` (Subscription)

| Coluna | Tipo | |
| -------- | ------ | - |
| `id` | uuid PK | |
| `usuario_id` | uuid FK | |
| `plano` | enum | `free` \| `premium` \| `premium_plus` |
| `status` | enum | `ativa` \| `cancelada` \| `expirada` |
| `stripe_customer_id` | string nullable | |
| `stripe_subscription_id` | string nullable | |
| `data_inicio` | timestamp | |
| `data_fim` | timestamp nullable | |

## Enums

| Enum | Valores |
| ------ | --------- |
| `UnidadeMedida` | `g`, `kg`, `ml`, `l`, `un`, `cx`, `pct`, `dz`, `lata`, `garrafa`, `saco` |
| `DificuldadeReceita` | `facil`, `media`, `dificil` |
| `UserRole` | `user`, `admin` |
| `MetodoCadastro` | `manual`, `ocr`, `barcode`, `importacao` |
