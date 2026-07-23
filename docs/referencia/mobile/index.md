# Mobile — Visão Geral

Expo / React Native com expo-router (file-based routing). Versão Expo ~54.

## Conteúdo

- [Hooks & Services](/referencia/mobile/servicos) — como consumir a API no mobile

## Stack

| Item | Versão / Lib |
|------|-------------|
| Framework | Expo ~54.0.33 |
| Navigation | expo-router ~6.0.23 (file-based) |
| HTTP | axios ^1.13.6 |
| Auth storage | expo-secure-store ^55.0.9 |
| Câmera | expo-camera ^55.0.10 |
| Image picker | expo-image-picker ~17.0.11 |
| Ícones | @expo/vector-icons (MaterialCommunityIcons) |
| Haptics | expo-haptics ~15.0.8 |
| OAuth | expo-auth-session ~7.0.11 |
| Apple Auth | expo-apple-authentication ~8.0.8 |

## Iniciar

```bash
cd mobile
npx expo start
```

API base URL: `http://192.168.86.9:3000/api` (IP fixo rede WiFi local).  
Para alterar: variável de ambiente `EXPO_PUBLIC_API_URL`.

## Estrutura de Arquivos

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── (auth)/                  # Rotas não autenticadas
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Splash / onboarding
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/                   # Rotas autenticadas
│       ├── _layout.tsx
│       ├── (tabs)/              # Bottom tab navigation
│       │   ├── _layout.tsx      # Config das tabs
│       │   ├── index.tsx        # Tab: Início
│       │   ├── despensa.tsx     # Tab: Despensa
│       │   ├── listas.tsx       # Tab: Listas
│       │   ├── receitas.tsx     # Tab: Receitas
│       │   ├── semana.tsx       # Tab: Semana
│       │   └── perfil.tsx       # Tab: Perfil
│       ├── receita/[id].tsx     # Detalhe receita
│       ├── receita-ocr/         # Scan nota fiscal
│       ├── validacao/           # Validação produtos OCR
│       ├── receitas-geradas/    # Receitas geradas por IA
│       ├── favoritas/           # Receitas favoritas
│       ├── minhas-receitas/     # Receitas do usuário
│       ├── receitas-feitas/     # Histórico de receitas feitas
│       ├── listas/[id].tsx      # Detalhe lista de compras
│       ├── compras/             # Histórico de compras
│       ├── notificacoes/        # Notificações
│       ├── vencendo/            # Itens vencendo
│       ├── comparacao/          # Comparação de preços
│       ├── qr-scanner/          # Leitor QR/barcode
│       ├── nova-receita/        # Criar receita
│       ├── settings.tsx         # Preferências
│       ├── profile.tsx          # Perfil detalhado
│       └── privacidade/         # Política de privacidade
├── src/
│   ├── services/
│   │   ├── api.ts               # Axios instance + interceptors
│   │   ├── inventario.service.ts
│   │   ├── lista.service.ts
│   │   ├── planejamento.service.ts
│   │   ├── recipe-generator.service.ts
│   │   ├── validacao.service.ts
│   │   └── notifications.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useInventario.ts
│   │   ├── useListas.ts
│   │   ├── usePlanejamento.ts
│   │   ├── useRecipeGenerator.ts
│   │   ├── useValidacao.ts
│   │   ├── useCookMeAprendizado.ts
│   │   └── useScreenTutorial.ts
│   └── contexts/
│       ├── AuthContext.tsx       # Token JWT, login/logout, user
│       └── ModoAlimentarContext.tsx  # modo_alimentar + corModo
└── constants/
    └── theme.ts                 # Design system tokens
```

---

## Bottom Tabs

| Tab | Ícone | Arquivo | Descrição |
|-----|-------|---------|-----------|
| Início | `home-outline` | `(tabs)/index.tsx` | Hero carousel, receitas disponíveis, receita do dia |
| Despensa | `fridge-outline` | `(tabs)/despensa.tsx` | Inventário — itens, vencimentos, stats |
| Listas | `cart-outline` | `(tabs)/listas.tsx` | Lista de compras ativa |
| Receitas | `chef-hat` | `(tabs)/receitas.tsx` | Busca e filtros de receitas |
| Semana | `calendar-week` | `(tabs)/semana.tsx` | Planejamento semanal |
| Perfil | `account-outline` | `(tabs)/perfil.tsx` | Dados do usuário |

A cor das tabs muda dinamicamente via `ModoAlimentarContext.corModo`.

---

## Telas Extras (fora das tabs)

| Tela | Rota | Descrição |
|------|------|-----------|
| Detalhe receita | `/(app)/receita/[id]` | Ingredientes, modo preparo, cobertura do inventário, botão executar |
| OCR nota fiscal | `/(app)/receita-ocr` | Câmera + OCR via Gemini, processa múltiplas fotos |
| Validação OCR | `/(app)/validacao` | Confirma/corrige itens extraídos, classifica alimento/não-alimento |
| Receitas geradas | `/(app)/receitas-geradas` | Lista de receitas geradas por IA |
| Favoritas | `/(app)/favoritas` | Receitas favoritadas |
| Minhas receitas | `/(app)/minhas-receitas` | Receitas criadas pelo usuário |
| Receitas feitas | `/(app)/receitas-feitas` | Histórico de execuções |
| Detalhe lista | `/(app)/listas/[id]` | Itens da lista, marcar comprado |
| Histórico compras | `/(app)/compras` | Compras anteriores com OCR |
| Notificações | `/(app)/notificacoes` | Central de notificações |
| Vencendo | `/(app)/vencendo` | Itens próximos do vencimento |
| Comparação | `/(app)/comparacao` | Comparação de preços |
| QR Scanner | `/(app)/qr-scanner` | Leitor de código de barras |
| Nova receita | `/(app)/nova-receita` | Form para criar receita |
| Settings | `/(app)/settings` | Modo alimentar, refeições, notificações |
| Perfil | `/(app)/profile` | Perfil completo, avatar, dados |
| Privacidade | `/(app)/privacidade` | Política de privacidade |

---

## Fluxo OCR (Scan Nota Fiscal)

```
receita-ocr
  → câmera captura imagem(ns)
  → POST /receitas/ocr/extract-from-image  (Gemini Vision)
  → POST /receitas/ocr/process             (deduplicação)
  → POST /receitas/ocr/classify-items      (IA classifica alimento/não)
  → validacao
      → itens confiança ≥75% → auto-confirmado (badge verde)
      → itens confiança <75%  → botão Sim/Não para usuário
  → POST /compras/ocr-cupom/salvar-itens   (salva no inventário)
```

---

## Fluxo Receitas

```
Tab Início / Tab Receitas
  → GET /receitas/disponiveis
      → aplica filtro modo_alimentar
      → cobertura ≥70% → disponível (verde)
      → cobertura 40-69% → parcial (cinza)
  → receita/[id]
      → exibe ingredientes, modo preparo
      → "Comprar faltando" → POST /receitas/:id/comprar-faltando
      → "Fiz essa receita" → POST /receitas/:id/executar
```

---

## Design System (`constants/theme.ts`)

| Token | Valor | Uso |
|-------|-------|-----|
| `colors.green[500]` | `#3D9E52` | Cor primária (modo normal) |
| `colors.green[600]` | `#2E7D3F` | Verde escuro, botões |
| `colors.ink[50]` | `#FAFAF8` | Background principal off-white |
| `colors.ink[900]` | `#1A1610` | Texto principal |
| `colors.amber[400]` | `#F5A623` | Alertas / vencimento |
| `colors.red[500]` | `#E03A2E` | Erros / vencido |

**Typography:**

| Token | fontSize | weight |
|-------|----------|--------|
| `typography.display` | 32 | 700 |
| `typography.h1` | 26 | 700 |
| `typography.h2` | 20 | 700 |
| `typography.h3` | 17 | 600 |
| `typography.body` | 15 | 500 |
| `typography.small` | 13 | 500 |
| `typography.micro` | 11 | 700 |

**Outros tokens:** `radius.xs/sm/md/lg/xl/pill`, `shadows.sm/md/modal`

---

## Contextos

### `AuthContext`

```ts
const { user, isAuthenticated, loading, login, logout, register } = useAuth();
```

- Tokens em `SecureStore`: `accessToken`, `refreshToken`
- Auto-refresh: interceptor axios renova token 401 automaticamente

### `ModoAlimentarContext`

```ts
const { modoAlimentar, setModoAlimentar, corModo } = useModoAlimentar();
```

| Modo | Cor (`corModo`) |
|------|-----------------|
| `normal` | `colors.green[500]` |
| `fitness` | `colors.amber[500]` |
| `vegetariano` | `colors.green[400]` |
| `vegano` | `colors.green[700]` |

---

## Configuração API

Arquivo: `src/services/api.ts`

- Base URL: `EXPO_PUBLIC_API_URL || 'http://192.168.86.9:3000/api'`
- Timeout: 60s (IA pode demorar)
- Auth: Bearer token via `SecureStore`
- 401 → auto-refresh → retry

Para mudar o IP do servidor: altere `EXPO_PUBLIC_API_URL` no `.env` ou diretamente no arquivo.
