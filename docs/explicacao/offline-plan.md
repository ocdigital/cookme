# CookMe — Plano Offline First

**Status:** Planejado — não iniciado  
**Estimativa:** 3–4 semanas (pode ser feito em sprints independentes)  
**Prioridade:** Alta — app hoje fica inutilizável sem internet

---

## Contexto

Hoje o app é **100% online**. Cada abertura de tela dispara requests à API. Sem conexão = tela em branco ou erro. Isso é inaceitável para um app de cozinha: o usuário está no meio do preparo e perde o WiFi, ou está no mercado sem 4G bom.

**Referências estudadas:**
- [TanStack Query offline docs](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [React Native offline-first com TanStack Query + SQLite](https://github.com/kapobajza/React_Native_Offline_first_sample)
- [MMKV + Zustand offline setup](https://medium.com/@nithinpatelmlm/expo-react-native-easy-offline-first-setup-in-expo-using-mmkv-and-zustand-react-native-mmkv-and-68f662c6bc3f)
- [Callstack offline tool belt](https://www.callstack.com/blog/your-react-native-offline-tool-belt)
- [Building offline-first with React Query + AsyncStorage](https://dev.to/msaadullah/building-offline-first-apps-using-react-native-react-query-and-asyncstorage-1h4i)

---

## Princípios de Design

1. **Cache primeiro, rede segundo** — mostrar dados cacheados imediatamente, atualizar em background
2. **Fila de mutações** — ações do usuário (favoritar, marcar feita, editar lista) são enfileiradas offline e sincronizadas quando reconectar
3. **Nunca bloquear, sempre avisar** — banner offline visível, funções que precisam de rede ficam desabilitadas com tooltip explicativo
4. **Graceful degradation** — cada tela tem um nível de funcionalidade offline definido

---

## Stack Escolhida

| Biblioteca | Papel | Por quê |
|---|---|---|
| `@tanstack/react-query` | Cache + data fetching + offline sync | Padrão de mercado, suporte nativo a offline/persist |
| `react-native-mmkv` | Persistência local (rápido, síncrono) | 30x mais rápido que AsyncStorage, funciona bem com TanStack |
| `@tanstack/query-sync-storage-persister` | Ponte TanStack ↔ MMKV | Persiste cache entre sessões |
| `@react-native-community/netinfo` | Detectar conexão | Confiável, mantido, já usado em apps grandes |
| `zustand` + `persist` middleware | Estado global offline (fila de mutações) | Já instalado, só falta usar |

---

## O que funciona offline (por tela)

### ✅ Totalmente offline (com cache)
| Tela | O que cachear | TTL sugerido |
|---|---|---|
| **Home** | receitas disponíveis, inventário resumido, planejamento hoje | 10 min |
| **Despensa** | lista completa do inventário | 15 min |
| **Receitas** | lista de receitas disponíveis + parciais | 10 min |
| **Receita Detalhe** | dados completos da receita, ingredientes | 24h (raramente muda) |
| **Semana** | planejamento semanal completo | 30 min |
| **Listas** | listas de compras + itens | 10 min |
| **Favoritas** | receitas favoritadas | 30 min |
| **Receitas Feitas** | histórico | 1h |
| **Vencendo** | produtos vencendo | 15 min |
| **Compras** | histórico de compras | 1h |

### ⚠️ Parcialmente offline (lê cache, fila para escrita)
| Tela | Leitura | Escrita (fila) |
|---|---|---|
| **Despensa** | inventário do cache | adicionar/editar/remover → fila |
| **Receitas** | lista do cache | favoritar → fila; gerar IA → bloqueado |
| **Receita Detalhe** | dados do cache | favoritar, avaliar → fila; descontar ingredientes → fila |
| **Semana** | planejamento do cache | definir receita, marcar feita → fila |
| **Listas** | listas do cache | criar item, marcar comprado → fila |

### ❌ Requer internet (bloqueado offline com aviso)
| Tela | Por quê |
|---|---|
| **OCR / QR Scanner** | upload de imagem + IA no servidor |
| **Gerar Receitas (IA)** | LLM no servidor |
| **Validação de produtos** | treino do modelo no servidor |
| **Login / Registro** | auth sempre online |
| **Importar cupom** | processamento server-side |

---

## Arquitetura

```
App
├── QueryClientProvider (TanStack Query)
│   └── PersistQueryClient (MMKV persister)
│       ├── Queries → cache automático com TTL
│       └── Mutations → retry automático ao reconectar
├── NetworkProvider (NetInfo)
│   └── useNetworkStatus() hook global
└── OfflineBanner (componente global no _layout)
```

### Fluxo de dados

```
Usuário abre tela
       ↓
TanStack Query verifica cache MMKV
       ↓
Cache válido?  ──YES──→ Exibe imediatamente + refetch background
       │
      NO
       ↓
Online?  ──YES──→ Fetch API → salva cache → exibe
       │
      NO
       ↓
Cache expirado existe?  ──YES──→ Exibe com aviso "Dados podem estar desatualizados"
       │
      NO
       ↓
Exibe "Sem dados offline disponíveis" + botão tentar novamente
```

### Fila de mutações offline

```
Usuário faz ação (ex: favoritar)
       ↓
Online?  ──YES──→ Executa imediatamente (otimista: UI atualiza antes da resposta)
       │
      NO
       ↓
Adiciona à fila Zustand (persiste em MMKV)
UI atualiza otimisticamente
       ↓
NetInfo detecta reconexão
       ↓
Processa fila em ordem → sync com servidor
       ↓
Em caso de conflito → servidor ganha (estratégia server-wins)
```

---

## UX: Banner e indicadores offline

### Banner global (topo da tela)
```
┌─────────────────────────────────────────────────┐
│  📡  Sem conexão · Mostrando dados salvos       │
└─────────────────────────────────────────────────┘
```
- Aparece quando `isConnected === false`
- Some automaticamente ao reconectar (com animação suave)
- Cor: `ink[700]` fundo + texto branco (discreto, não invasivo)

### Botões bloqueados offline
- Ícone de nuvem com X ao lado
- Tooltip: "Precisa de internet"
- Visualmente desabilitado mas não removido (usuário sabe que a função existe)

### Dados expirados (cache velho)
- Texto sutil abaixo do conteúdo: "Atualizado às 14:32 · Offline"
- Sem bloquear a tela — só informativo

### Ao reconectar
- Banner verde por 2s: "Conexão restaurada · Sincronizando..."
- Fila de mutações processa silenciosamente em background

---

## Implementação — Sprints

### Sprint 1 — Fundação (3-4 dias)
**Sem mudar nenhuma tela ainda**

1. Instalar deps: `@tanstack/react-query`, `react-native-mmkv`, `@tanstack/query-sync-storage-persister`, `@react-native-community/netinfo`
2. Criar `QueryClientProvider` com MMKV persister no `_layout.tsx`
3. Criar `NetworkProvider` + hook `useNetworkStatus()`
4. Criar componente `OfflineBanner` global
5. Criar store Zustand `useMutationQueueStore` com persist MMKV
6. Criar hook `useOfflineMutation` (wrapper de useMutation com fila)

**Entregável:** Banner offline funciona, base instalada, nenhuma tela quebrada.

---

### Sprint 2 — Telas de leitura (4-5 dias)
**Migrar todas as telas read-heavy para TanStack Query**

Ordem por impacto:
1. `receitas.tsx` — `useQuery('receitas-disponiveis')`
2. `despensa.tsx` — `useQuery('inventario')`
3. `index.tsx` (Home) — múltiplos `useQuery` com `staleTime` diferente por dado
4. `semana.tsx` — `useQuery('planejamento-semana')`
5. `listas.tsx` — `useQuery('listas')`
6. `receita/[id].tsx` — `useQuery('receita', id)` com TTL longo

**Resultado:** Dados carregam instantaneamente na 2ª abertura (do cache). Funciona offline com dados do último acesso.

---

### Sprint 3 — Mutações com fila (3-4 dias)

1. Favoritar receita → `useOfflineMutation` com update otimista
2. Marcar planejamento feito → fila offline
3. Marcar item de lista comprado → fila offline
4. Editar inventário (esgotado, validade) → fila offline
5. Avaliar receita → fila offline (pode acumular offline)

**Resultado:** Usuário pode interagir com o app offline. Tudo sincroniza ao reconectar.

---

### Sprint 4 — UX e polish (2-3 dias)

1. Botões bloqueados offline (OCR, Gerar IA, etc.) com tooltip
2. Indicador "Atualizado às HH:MM" em telas com cache
3. Animação de reconexão (banner verde)
4. Tela de erro offline (quando sem cache E sem internet)
5. Testes em modo avião

---

## Arquivos a criar/modificar

### Novos arquivos
```
mobile/src/
├── providers/
│   ├── QueryProvider.tsx          # TanStack Query + MMKV persister
│   └── NetworkProvider.tsx        # NetInfo + contexto global
├── stores/
│   └── mutationQueue.store.ts     # Zustand + persist (fila offline)
├── hooks/
│   ├── useNetworkStatus.ts        # isConnected, isInternetReachable
│   └── useOfflineMutation.ts      # wrapper useMutation com fila
├── components/
│   └── OfflineBanner.tsx          # Banner global topo
└── lib/
    └── queryClient.ts             # Config QueryClient + persister
```

### Arquivos modificados
```
mobile/app/_layout.tsx             # Adicionar QueryProvider + NetworkProvider
mobile/app/(app)/(tabs)/receitas.tsx
mobile/app/(app)/(tabs)/despensa.tsx
mobile/app/(app)/(tabs)/index.tsx
mobile/app/(app)/(tabs)/semana.tsx
mobile/app/(app)/(tabs)/listas.tsx
mobile/app/(app)/receita/[id].tsx
mobile/app/(app)/favoritas/index.tsx
mobile/app/(app)/vencendo/index.tsx
```

---

## TTLs de cache (staleTime / gcTime)

| Dado | staleTime | gcTime (manter no disco) |
|---|---|---|
| Receita individual | 24h | 7 dias |
| Lista de receitas disponíveis | 10 min | 1h |
| Inventário | 5 min | 2h |
| Planejamento semanal | 15 min | 24h |
| Listas de compras | 5 min | 24h |
| Favoritas | 30 min | 7 dias |
| Perfil do usuário | 1h | 7 dias |
| Notificações (contagem) | 1 min | 5 min |
| Histórico compras | 1h | 7 dias |

---

## Conflitos e edge cases

| Situação | Tratamento |
|---|---|
| Usuário edita item offline, outro dispositivo edita online | Server-wins no sync |
| Fila acumula 20+ mutações | Processar em batch, mostrar progresso |
| Token expirado quando fila processa | Refresh token primeiro, retry mutação |
| Produto deletado online, fila tem update dele | Ignorar silenciosamente (404 = skip) |
| App desinstalado e reinstalado | Cache limpo, login necessário |

---

## O que NÃO fazer

- Não implementar SQLite/Realm — MMKV é suficiente para esse volume de dados
- Não sincronizar bidirecional complexo — server-wins é simples e confiável
- Não cachear imagens offline — Expo Image já tem cache de imagens nativo
- Não fazer offline do OCR/IA — inviável por design, só bloquear com aviso claro

---

## Dependências a instalar

```bash
cd mobile
npx expo install @tanstack/react-query react-native-mmkv @tanstack/query-sync-storage-persister @react-native-community/netinfo
```

> Nota: `react-native-mmkv` requer build nativo. Não funciona com Expo Go puro.
> Precisa usar **development build** (`eas build --profile development`) ou
> substituir por `@react-native-async-storage/async-storage` para manter
> compatibilidade com Expo Go durante desenvolvimento.
> 
> **Recomendado:** AsyncStorage em dev (Expo Go), MMKV em produção (APK/AAB).
> TanStack Query suporta trocar o persister sem mudar código das telas.

---

## Métricas de sucesso

- [ ] App abre telas em < 100ms quando cache válido (vs 1-3s atual)
- [ ] Usuário consegue ver receitas e despensa sem internet após 1 uso online
- [ ] Favoritar/marcar offline sincroniza ao reconectar sem erro
- [ ] Nenhuma tela mostra tela em branco — sempre mostra cache ou mensagem clara
- [ ] Funciona em modo avião após primeiro uso

---

*Documento criado em junho/2026. Atualizar status ao iniciar cada sprint.*
