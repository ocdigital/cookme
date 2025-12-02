# 📱 Atualização de Layout - Menu Lateral (Drawer)

## ✨ O que foi implementado

Você solicitou um layout mobile melhor com:
- ✅ Menu lateral que desliza (drawer/hamburger menu)
- ✅ Remoção/otimização de botões do footer
- ✅ Melhor navegação mobile

## 🎯 Mudanças Realizadas

### 1. **Novo Componente DrawerMenu**
📁 `src/components/DrawerMenu.js`

**Características:**
- Header customizado com avatar do usuário
- Seção "Menu Principal" com 6 itens:
  - 🏠 Início
  - 🍳 Receitas
  - 📦 Meu Inventário
  - 🔍 Escanear Cupom
  - 📋 Histórico
  - ❤️ Favoritas

- Seção "Configurações" com:
  - ⚙️ Configurações
  - ℹ️ Sobre

- Footer com botão **Sair** com confirmação de logout
- Design limpo e responsivo

### 2. **Atualização do App.js**

**Antes:**
```
Stack Navigator
├── Login
├── Register
└── Home (com todos os stacks)
    ├── Recipes
    ├── Inventory
    └── etc...
```

**Depois:**
```
Stack Navigator
├── Login
├── Register
└── MainApp (Drawer Navigator) ⭐
    ├── Home (Drawer Screen)
    ├── RecipesList (Drawer Screen)
    ├── Inventory (Drawer Screen)
    ├── QRScanner (Drawer Screen)
    ├── History (Drawer Screen)
    └── Favorites (Drawer Screen)

    + Detail Screens (por cima do drawer):
    ├── Processing
    ├── Captcha
    ├── Result
    ├── PurchaseDetails
    ├── RecipeDetails
    └── Products
```

### 3. **Novo Componente MenuButton** (Opcional)
📁 `src/components/MenuButton.js`

Um botão hamburger reutilizável para telas que precisem (embora o Drawer Navigator já forneça isso automaticamente).

---

## 🎨 Design do Drawer

### Layout
```
┌─────────────────────────┐
│ ────────────────────    │  ← Header (FF8C42)
│ │👤│ Nome Usuário       │
│ │  │ email@exemplo.com  │
│ ────────────────────    │
├─────────────────────────┤
│ MENU PRINCIPAL          │
│ 🏠 Início              │
│    Página inicial       │
│                         │
│ 🍳 Receitas            │
│    Todas as receitas    │
│                         │
│ 📦 Meu Inventário      │
│    Produtos cadastrados│
│                         │
│ ... mais itens ...     │
├─────────────────────────┤
│ CONFIGURAÇÕES           │
│ ⚙️ Configurações       │
│ ℹ️ Sobre               │
├─────────────────────────┤
│ [🚪 SAIR]              │  ← Footer (FF6B35)
└─────────────────────────┘
```

### Cores Utilizadas
- **Background**: #FFFBF0 (Creme)
- **Header**: #FF8C42 (Laranja)
- **Footer (Logout)**: #FF6B35 (Laranja escuro)
- **Text**: #2C1810 (Marrom escuro)

---

## 🔄 Fluxo de Navegação

### Antes
```
HomeScreen
  └─ Barra inferior com 5 botões
  └─ QuickAccess com 4 botões
  └─ Logout em Header ou Modal
```

### Depois
```
HomeScreen
  └─ Menu Lateral (Drawer)
  └─ Header com ícone ⚙️
  └─ Content sem footer buttons
```

---

## 📱 Telas Drawer vs Detail

### Screens no Drawer (principais)
Estas aparecem com o drawer disponível:
- Home
- RecipesList
- Inventory
- QRScanner
- History
- Favorites

**Comportamento:** Swipe da esquerda abre o menu

### Screens no Stack (detalhes)
Estas aparecem **por cima** do drawer:
- Processing (quando scaneia cupom)
- Captcha (modal de CAPTCHA)
- Result (resultado da leitura)
- PurchaseDetails (detalhes da compra)
- RecipeDetails (detalhes da receita)
- Products (lista de produtos)

**Comportamento:** Botão "voltar" no header

---

## 🎯 Como Usar

### Abrir o Drawer
1. Swipe da esquerda para direita
2. Clique no ícone de menu (que aparece automaticamente)

### Navegar
1. Clique em um item do drawer
2. O drawer fecha automaticamente
3. A tela muda com transição

### Fazer Logout
1. Abra o drawer
2. Clique em "Sair" no footer
3. Confirme a ação
4. Volta para Login

---

## 📝 Notas Importantes

### Para HomeScreenRecipes
Remover (já não é mais necessário):
- Botão de logout do header
- Seção de quickAccess com navegação (agora no drawer)
- Footer com botões múltiplos

Manter:
- Alerta de produtos vencendo
- Carousel de receitas
- Seção de sugestões
- Dica do dia

### Para Outras Screens
O drawer está disponível em TODAS as screens internas, então não precisa de botões de navegação separados.

---

## 🚀 Próximos Passos (Opcional)

1. **Adicionar ícone de perfil** no header (já tem espaço)
2. **ProfileScreen** - Para editar dados do usuário
3. **Settings Screen** - Para preferências do app
4. **About Screen** - Informações do app
5. **AnimaçõesCustomizadas** - Transições smooth do drawer

---

## ✅ Checklist de Implementação

- [x] Criar DrawerMenu component
- [x] Importar createDrawerNavigator
- [x] Atualizar App.js com Drawer Navigator
- [x] Mover screens principais para Drawer
- [x] Manter detail screens no Stack
- [x] Adicionar header button (⚙️)
- [x] Implementar logout no drawer footer
- [x] Design responsivo e limpo

---

## 🎨 Customização Futura

### Para mudar cor do drawer:
```javascript
// No App.js - DrawerNavigator screenOptions
drawerStyle: {
  backgroundColor: '#FFFBF0', // Mude aqui
}
```

### Para mudar largura:
```javascript
drawerStyle: {
  width: '70%', // Mude de 75% para X%
}
```

### Para mudar animação:
```javascript
drawerType: 'slide', // Ou 'front' ou 'back'
```

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique que `react-navigation/drawer` está instalado
2. Limpe cache: `expo r -c`
3. Reinstale dependências: `npm install`
4. Reinicie o app
