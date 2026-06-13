# Admin Frontend — Visão Geral

Painel admin em React 19 + Vite + React Router. Porta **4000**.

## Stack

| Item | Versão |
|------|--------|
| Framework | React 19 |
| Build | Vite ^7.2 |
| Router | react-router-dom ^7.9 |
| Forms | react-hook-form ^7.71 |
| Toast | sonner + react-hot-toast |
| Icons | lucide-react ^0.553 |
| WebSocket | socket.io-client ^4.8 |
| Estilo | Tailwind CSS |

## Iniciar

```bash
cd frontend
npm run dev   # porta 4000
```

API: `http://localhost:3000` (backend local).

## Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/login` | `LoginPage` | Login admin (JWT) |
| `/trocar-senha` | `TrocarSenhaPage` | Troca de senha obrigatória |
| `/dashboard` | `DashboardPage` | Visão geral: stats, gráficos, atividade recente |
| `/users` | `UsersPage` | Lista de usuários com busca, filtros, paginação |
| `/users/:id` | `UserDetailPage` | Detalhe: histórico compras, inventário, receitas, assinatura |
| `/products` | `ProductsPage` | Catálogo de produtos com edição inline |
| `/recipes` | `RecipesPage` | Banco de receitas com moderação |
| `/analytics` | `AnalyticsPage` | Gráficos de uso, receitas mais feitas, modos alimentares |
| `/moderacao` | `ModeracaoPage` | Receitas `em_revisao` para aprovar/rejeitar |
| `/compras` | `PurchasesPage` | Histórico de compras/OCR dos usuários |
| `/knowledge-base` | `KnowledgeBasePage` | Base de conhecimento de classificação de produtos |
| `/abbreviations` | `AbbreviationsPage` | Gerenciar abreviações (OCR) |
| `/ingredients` | `IngredientsPage` | Ingredientes classificados como `ingrediente_receita` |
| `/audit-logs` | `AuditLogsPage` | Log de ações administrativas |
| `/data-management` | `DataManagementPage` | Seeds, importações, limpezas de dados |
| `/system-config` | `SystemConfigPage` | Configurações do sistema |
| `/logs` | `LogsPage` | Logs de sistema |
| `/profile` | `ProfilePage` | Perfil do admin logado |

Redirecionamento: `/` → `/dashboard` (autenticado) ou `/login`.

---

## Componentes Principais (`src/components/`)

| Componente | Descrição |
|-----------|-----------|
| `Layout` | Sidebar + Header, wrapper de todas as páginas |
| `Sidebar` | Navegação lateral com todos os links |
| `Header` | Barra superior: notificações, settings, usuário |
| `NotificationBell` | Sino com contador de não lidas (WebSocket) |
| `NotificationsPopover` | Popover com lista de notificações |
| `Table` | Tabela genérica com ordenação |
| `TablePagination` | Paginação reutilizável |
| `StatCard` | Card de KPI (número + label + tendência) |
| `StatsBar` | Barra de stats rápidos no topo das páginas |
| `SkeletonLoader` | Loading skeleton |
| `SearchInput` | Input com debounce para buscas |
| `FilterSelect` | Select de filtro com opções |
| `Card` | Container de seção |
| `Button` | Botão com variantes |
| `Input` | Input controlado |
| `ErrorAlert` | Alerta de erro |
| `ConfirmDialog` | Modal de confirmação |
| `AnimatedModal` | Modal base animado |
| `RecipeFormModal` | Form completo de edição de receita |
| `EditProductModal` | Form de edição de produto |
| `UserFormModal` | Form criação/edição de usuário |
| `ChangePasswordModal` | Modal troca de senha |
| `PurchaseDetailsModal` | Detalhe de uma compra |
| `CookmeLogo` | Logo SVG |

---

## Contextos (`src/contexts/`)

### `AuthContext`

```ts
const { user, isAuthenticated, loading, login, logout } = useAuth();
```

- Token JWT em `localStorage`
- `user.role === 'admin'` — apenas admins acessam

### `ThemeContext`

```ts
const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

---

## Services (`src/services/`)

| Arquivo | Endpoints cobertos |
|---------|-------------------|
| `api.ts` | Axios instance, `Authorization: Bearer` |
| `adminService.ts` | `/admin/produtos`, `/admin/usuarios`, stats |
| `adminUsersService.ts` | CRUD usuários admin |
| `recipesService.ts` | `/admin/receitas`, moderação, popular banco |
| `produtosService.ts` | `/produtos` CRUD |
| `inventarioService.ts` | `/inventario` (view admin) |
| `comprasService.ts` | `/compras` |
| `usuariosService.ts` | `/usuarios` |
| `userService.ts` | Perfil do admin logado |
| `notificacoesService.ts` / `notificationsService.ts` | `/notificacoes` |

---

## Hooks (`src/hooks/`)

### `useApi`

```ts
const { data, loading, error, refetch } = useApi<T>(url, options?);
```

Hook genérico para GET com loading/error states.

### `useNotificacoes`

```ts
const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes();
```

Conecta via WebSocket ao backend, fallback polling 30s.

### `useToast`

```ts
const { success, error, info } = useToast();
```

Wrapper do Sonner.

---

## Auth Flow

```
/login
  → POST /auth/login
  → token em localStorage
  → redirect /dashboard
  
Token expirado (401)
  → POST /auth/refresh
  → retry
  → falha → redirect /login

deve_trocar_senha = true
  → redirect /trocar-senha após login
```

---

## Notificações WebSocket (Admin)

Mesma infra do backend:

```ts
// src/hooks/useNotificacoes.ts
const socket = io('http://localhost:3000/notificacoes', {
  auth: { token: jwt }
});

socket.on('nova_notificacao', (notif) => { ... });
```

Fallback: polling `/notificacoes?naoLidas=true` a cada 15s se WebSocket falhar.
