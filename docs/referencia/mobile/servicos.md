# Mobile — Hooks e Services

## Services (`src/services/`)

### `api.ts`

Instância Axios central. Todos os services importam daqui.

```ts
import api from '@/src/services/api';
// ou
import api from '../services/api';
```

- Base URL: `EXPO_PUBLIC_API_URL || 'http://192.168.86.9:3000/api'`
- Timeout: 60000ms
- Interceptor request: adiciona `Authorization: Bearer <token>`
- Interceptor response 401: renova token via `/auth/refresh` → retry automático

---

### `inventario.service.ts`

```ts
// Listar inventário
GET /inventario

// Adicionar manual
POST /inventario/adicionar-manual
body: { nome, quantidade, unidade, data_validade? }

// Stats
GET /inventario/stats

// Vencendo em breve
GET /inventario/vencendo?days=7

// Marcar esgotado
PATCH /inventario/:id/esgotado
body: { esgotado: true }

// Corrigir nome
PATCH /inventario/:id/nome
body: { nome: "novo nome" }

// Deletar
DELETE /inventario/:id

// Importar automático das compras
POST /inventario/importar-automatico
```

---

### `lista.service.ts`

```ts
// CRUD listas
POST   /listas
GET    /listas
GET    /listas/:id
PUT    /listas/:id
DELETE /listas/:id
POST   /listas/:id/arquivar
POST   /listas/:id/duplicar
POST   /listas/:id/limpar-comprados

// CRUD itens
POST   /listas/:listaId/itens
GET    /listas/:listaId/itens
PUT    /listas/:listaId/itens/:itemId
DELETE /listas/:listaId/itens/:itemId
PUT    /listas/:listaId/itens/:itemId/marcar-comprado
body: { comprado: true }
```

---

### `planejamento.service.ts`

```ts
// Semana atual
GET /planejamento/semana/:semana

// Receita do dia
GET /planejamento/hoje

// Definir receita
POST /planejamento/semana/:semana/dia/:dia/:tipo
body: { receita_id: "uuid" | null }

// Gerar semana aleatória
POST /planejamento/semana/:semana/aleatorio

// Marcar como feita
POST /planejamento/:id/feita
body: { avaliacao?: 1-5 }
```

---

### `recipe-generator.service.ts`

```ts
// Gerar receitas pelo inventário
POST /receitas/gerar
body: { ingredientes?: string[], forcar_ia?: false }

// Buscar disponíveis
GET /receitas/disponiveis

// Receitas quase possíveis
GET /receitas/quase-possiveis

// Mais feita hoje
GET /receitas/mais-feita-hoje
```

---

### `validacao.service.ts`

```ts
// Extrair OCR de imagem
POST /receitas/ocr/extract-from-image
body: { image: base64, mimeType?: "image/jpeg" }

// Processar texto OCR (múltiplas fotos)
POST /receitas/ocr/process
body: { photos: [{ ocrText, photoNumber, totalPhotos }], ignoreWarnings?: false }

// Classificar itens
POST /receitas/ocr/classify-items
body: { items: [{ nome, preco_total?, quantidade? }] }

// Salvar no inventário
POST /compras/ocr-cupom/salvar-itens
body: { itens: [{ nome, quantidade?, valor?, codigo_barras? }], estabelecimento?: { nome? } }
```

---

### `notifications.ts`

Serviço de push notifications (Expo Notifications).

```ts
// Registrar dispositivo
await registerForPushNotificationsAsync()
// → retorna Expo push token
// → salvar via PATCH /usuarios/push-token
```

---

## Hooks (`src/hooks/`)

### `useAuth`

```ts
const { user, isAuthenticated, loading, login, logout, register } = useAuth();
```

| Função | Descrição |
|--------|-----------|
| `login(email, senha)` | POST `/auth/login`, salva tokens |
| `register(nome, email, senha)` | POST `/auth/register` |
| `logout()` | POST `/auth/logout`, limpa SecureStore |
| `user` | Objeto `Usuario` do JWT |

---

### `useInventario`

```ts
const {
  inventario,
  stats,
  vencendo,
  loading,
  carregarInventario,
  adicionarManual,
  atualizarItem,
  marcarEsgotado,
  removerItem,
  corrigirNome,
} = useInventario();
```

---

### `useListas`

```ts
const {
  listas,
  listaAtiva,
  loading,
  criarLista,
  obterLista,
  adicionarItem,
  marcarComprado,
  limparComprados,
  arquivarLista,
} = useListas();
```

---

### `usePlanejamento`

```ts
const {
  semana,
  hoje,
  loading,
  carregarSemana,
  definirReceita,
  gerarAleatoria,
  marcarFeita,
  limparDia,
} = usePlanejamento();
```

---

### `useRecipeGenerator`

```ts
const {
  receitas,
  loading,
  gerarReceitas,
  disponiveis,
  quasePossiveis,
} = useRecipeGenerator();
```

---

### `useValidacao`

```ts
const {
  itens,
  loading,
  extrairOCR,
  classificarItens,
  confirmarItens,
  salvarNoInventario,
} = useValidacao();
```

---

### `useCookMeAprendizado`

```ts
const { perfil, loading } = useCookMeAprendizado();
// GET /receitas/perfil-aprendizado
// Retorna o que o sistema aprendeu sobre o usuário
```

---

## Variáveis de Ambiente Mobile

```env
# .env (na raiz de /mobile)
EXPO_PUBLIC_API_URL=http://192.168.86.9:3000/api

# Para mudar o servidor (ex: staging):
EXPO_PUBLIC_API_URL=https://api.cookme.app/api
```

> O IP `192.168.86.9` é fixo para desenvolvimento com Expo Go na rede WiFi local. Em produção, substituir pelo domínio real.
