# Frontend Quick Guide - Dezembro 2025

## 🚀 Início Rápido (2 minutos)

### Tudo que foi feito esta sessão:
```
✅ Página de Perfil     → /profile
✅ Avatar Clicável      → Na header
✅ Notificações         → PopOver com mock
✅ Settings             → PopOver com opções
✅ Menu Sidebar         → Cores melhoradas
✅ Logo                 → Emoji 🍳
```

---

## 🗂️ Estrutura de Arquivos Novos

```
frontend/src/
├── pages/
│   └── ProfilePage.tsx ⭐
│       └─ Página de edição de perfil
│       └─ Avatar automático
│       └─ Info da conta
│
└── services/
    └── notificationsService.ts ⭐
        └─ Mock data (5 notificações)
        └─ Métodos de CRUD
        └─ Helpers (cores, ícones, time)
```

---

## 🔗 Rotas Principais

```javascript
// App.tsx
GET  /profile          → ProfilePage (protegida)
GET  /dashboard        → DashboardPage
GET  /login            → LoginPage (pública)
```

---

## 🎨 Componentes Principais

### Header
```
┌─────────────────────────────────────┐
│  [?] [Sino] [⚙️] | Admin User [👤] │
│        ↓      ↓                 ↓   │
│  Notif PopOver Settings PopOver    │
│  - Mark Read    - Edit Profile     │
│  - Delete       - Change Password  │
│  - Mark All     - Dark Mode        │
│                 - Notifications    │
│                 - Logout           │
└─────────────────────────────────────┘
```

### Sidebar Menu
```
CookMe 🍳
├─ Dashboard         ☐
├─ Usuários         ☐
├─ Produtos         ☐
├─ Receitas         ⭕ (ativo - laranja)
├─ Compras          ☐
├─ Relatórios       ☐
│
└─ Sair (vermelho)
```

### Profile Page
```
┌──────────────────────────────────┐
│ ← Voltar                          │
├──────────────────────────────────┤
│  👤                               │
│  Admin User                       │
│  admin@cookme.com                 │
│                 [Editar]          │
├──────────────────────────────────┤
│ Nome:     [Admin User]    disabled│
│ Email:    [admin@cook...] readonly│
│ Telefone: [(11) 98765-43] disabled│
│ Avatar:   [https://...]   disabled│
│                [Salvar] [Cancelar]│
├──────────────────────────────────┤
│ Tipo: ADMIN                       │
│ Membro desde: 01/12/2025          │
│ Última atualização: 02/12/2025    │
├──────────────────────────────────┤
│                  [Alterar Senha] │
└──────────────────────────────────┘
```

---

## 🔄 Fluxos de Navegação

### Acessar Perfil
```
1. Header Avatar
   ↓
2. Button click
   ↓
3. navigate('/profile')
   ↓
4. ProfilePage render
```

### Editar Perfil
```
1. [Editar] button
   ↓
2. setIsEditing(true)
   ↓
3. Campos ficam editáveis
   ↓
4. [Salvar] → handleSave()
   ↓
5. Success message
```

### Ver Notificações
```
1. Bell icon click
   ↓
2. PopOver abre
   ↓
3. loadNotifications() async
   ↓
4. setNotifications(data)
   ↓
5. Render lista
```

### Ações em Notificação
```
Marcar como lida:  ✓ button → markAsRead(id)
Deletar:          🗑 button → deleteNotification(id)
Marcar tudo:      Footer button → markAllAsRead()
```

---

## 📝 Código Rápido

### Avatar Automático
```typescript
const getDefaultAvatar = (email: string) =>
  `https://i.pravatar.cc/150?u=${email}`;

// uso
<img src={user?.avatar_url || getDefaultAvatar(user.email)} />
```

### Tempo Relativo
```typescript
// "5 minutos atrás"
// "2 horas atrás"
// "1 dia atrás"
const relativeTime = notificationsService.formatRelativeTime(date);
```

### Notificação Com Cor
```typescript
const { bg, text, icon } = notificationsService
  .getNotificationColor('success');
// { bg: 'bg-green-50', text: 'text-green-700', icon: '✅' }
```

---

## 🎯 Status das Features

### ✅ Prontas para Usar
- [x] ProfilePage completa
- [x] Avatar clicável
- [x] Notificações PopOver
- [x] Settings PopOver
- [x] Menu melhorado
- [x] Mock data funcional

### 🔄 TODO - Próximas Features
- [ ] Conectar ProfilePage com API
- [ ] Notificações reais (WebSocket)
- [ ] Dark Mode funcional
- [ ] Change Password
- [ ] Upload de Avatar

---

## 🧪 Como Testar

### 1. Avatar Clicável
```bash
1. Ir para http://localhost:5173/dashboard
2. Clicar no avatar (canto superior direito)
✓ Deve ir para /profile
```

### 2. Notificações
```bash
1. Clicar no sino (header)
✓ PopOver abre
✓ Mostra 5 notificações
✓ Badge mostra "2" (não lidas)
```

### 3. Settings
```bash
1. Clicar na engrenagem (header)
✓ PopOver abre
✓ "Editar Perfil" vai para /profile
✓ "Sair" faz logout
```

### 4. Menu Ativo
```bash
1. Clicar em "Receitas" no menu
✓ Fica com fundo laranja suave
✓ Texto fica laranja
✓ Tem borda esquerda laranja
✓ Texto é legível (não mais branco invisível!)
```

---

## 📱 Responsividade

### Desktop
```
Header normal com todo o texto
Sidebar visível
Menu items com ícone + texto
```

### Mobile
```
Header compacto
Sidebar como drawer (mobile menu)
Menu items ajustados
```

---

## 🎨 Cores Principais

```
Primary (Laranja):        #FF7A5C (ou custom var)
Primary Light:            primary/10 (bg-primary/10)
Primary Dark:             primary/80

Text Colors:
- Heading:               text-gray-900
- Body:                  text-gray-700
- Secondary:             text-gray-500
- Placeholder:           text-gray-400

States:
- Hover:                 opacity-80
- Active:                text-primary bg-primary/10
- Error:                 text-red-600 bg-red-50
- Success:               text-green-600 bg-green-50
```

---

## 📊 Banco de Dados

### User Fields (essenciais)
```typescript
id: string
nome: string
email: string
telefone?: string
avatar_url?: string  // ⭐ Nova
role: 'USER' | 'PREMIUM' | 'ADMIN' | 'MARCA'
createdAt: string
updatedAt: string
```

---

## 🔌 Mock Data

### Notificações (5 items)
```javascript
[
  { id: '1', type: 'success', title: 'Novo produto', ... },
  { id: '2', type: 'warning', title: 'Estoque baixo', ... },
  { id: '3', type: 'info', title: 'Novo usuário', ... },
  { id: '4', type: 'success', title: 'Relatório', ... },
  { id: '5', type: 'error', title: 'Erro sinc', ... }
]
```

---

## 🚨 Problemas Comuns & Soluções

### Avatar não aparece
```javascript
❌ <img src={user.avatar_url} />
✅ <img src={user?.avatar_url || getDefaultAvatar(email)} />
```

### Menu item ativo invisível
```javascript
❌ 'bg-gradient-to-r from-primary to-primary/80 text-white'
✅ 'bg-primary/10 text-primary border-l-4 border-primary'
```

### PopOver não fecha
```javascript
✅ Implementar click-outside listener
✅ Limpar event listener no cleanup
```

### Avatar não é clicável
```javascript
❌ <div>Avatar aqui</div>
✅ <button>Avatar aqui</button>
```

---

## 📚 Referências Rápidas

| Arquivo | Lines | Descrição |
|---------|-------|-----------|
| ProfilePage.tsx | 331 | Página de perfil completa |
| notificationsService.ts | 180 | Mock + helpers |
| Header.tsx | 110 | Avatar clicável |
| SettingsPopover.tsx | 169 | Settings menu |
| NotificationsPopover.tsx | 210 | Notificações |
| Sidebar.tsx | 118 | Menu melhorado |
| App.tsx | 126 | Rotas + layout |

---

## ⚡ Performance

- Avatar: Lazy load com fallback automático
- PopOvers: Click-outside para fechar imediatamente
- Notificações: Mock data (sem API delay)
- Re-renders: Otimizado com useState/useEffect

---

## 🎓 Padrões Usados

1. **Custom Hooks**: useAuth, useNavigate
2. **Event Listeners**: Click-outside detection
3. **Async/Await**: Simulado com setTimeout
4. **TypeScript**: Type-safe em tudo
5. **Tailwind**: Utility-first CSS
6. **React Router**: Protected routes

---

## ✨ Highlights da Sessão

✅ Logo visual com emoji
✅ Menu item ativo com cor correta
✅ Avatar automático com gravatar-like
✅ 3 popovers funcionais
✅ Perfil page completa
✅ Mock data realista
✅ Fluxos de navegação suave
✅ Totalmente responsivo
✅ Documentação completa
✅ Pronto para testar!

---

## 🎯 Próximo Passo

👉 Leia: [SESSION_PROFILE_AND_HEADER_UPDATE.md](SESSION_PROFILE_AND_HEADER_UPDATE.md)

Para detalhes completos sobre implementação!

---

**Status**: ✅ Testado e Funcionando
**Próximo**: Conectar com Backend APIs
