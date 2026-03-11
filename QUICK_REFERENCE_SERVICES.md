# Quick Reference - Frontend Services

## 🎯 Import Services

```typescript
import {
  usuariosService,      // User management
  produtosService,      // Products
  comprasService,       // Purchases
  inventarioService,    // Inventory
  notificacoesService,  // Notifications
  recipesService,       // Recipes
  adminService,         // Admin dashboard
  api                   // Raw axios instance
} from '@/services';
```

---

## 👤 User Management

```typescript
// Get current user
const user = await usuariosService.getMe();

// Update profile
await usuariosService.updateMe({ nome: 'New Name' });

// Update avatar
await usuariosService.updateAvatar('https://...');

// Get preferences
const prefs = await usuariosService.getPreferencias();

// Update preferences
await usuariosService.updatePreferencias({
  tags_dieta: ['vegetarian'],
  numero_pessoas: 4
});

// Admin: List all users
const { data, total, page, totalPages } = await usuariosService.getAll(1, 20);

// Admin: Get user stats
const stats = await usuariosService.getStats();
```

---

## 📦 Products

```typescript
// List with filters
const response = await produtosService.getAll(1, 20, {
  search: 'tomate',
  categoriaId: 'uuid'
});

// Get single product
const product = await produtosService.getById('product-id');

// Search by barcode
const product = await produtosService.getByBarcode('123456789');

// Autocomplete search
const results = await produtosService.search('tom');

// Admin: Create product
await produtosService.create({
  nome: 'Tomate Fresco',
  categoria_id: 'uuid',
  unidade_padrao: 'kg'
});

// Admin: Get all categories
const categorias = await produtosService.getCategorias();

// Admin: Get all brands
const marcas = await produtosService.getMarcas();

// Get statistics
const stats = await produtosService.getStats();
```

---

## 🛒 Purchases

```typescript
// List my purchases
const purchases = await comprasService.getAll(1, 20);

// Get single purchase
const purchase = await comprasService.getById('purchase-id');

// Create purchase
await comprasService.create({
  local_compra: 'Supermercado X',
  itens: [
    {
      produto_id: 'uuid',
      quantidade: 2,
      unidade: 'kg',
      preco_unitario: 5.50
    }
  ]
});

// Get purchase statistics
const stats = await comprasService.getStats();
```

---

## 📊 Inventory

```typescript
// List inventory
const items = await inventarioService.getAll(1, 20);

// Get item details
const item = await inventarioService.getById('item-id');

// Add to inventory
await inventarioService.create({
  produto_id: 'uuid',
  quantidade: 5,
  unidade: 'kg',
  data_validade: '2025-12-31',
  local_armazenagem: 'Geladeira'
});

// Update item
await inventarioService.update('item-id', {
  quantidade: 3
});

// Get items expiring soon (default: 7 days)
const expiring = await inventarioService.getVencendo(7);

// Get expired items
const expired = await inventarioService.getVencidos();

// Get inventory statistics
const stats = await inventarioService.getStats();
```

---

## 🔔 Notifications

```typescript
// List notifications
const notifications = await notificacoesService.getAll(1, 20);

// Get unread count
const count = await notificacoesService.getUnreadCount();

// Mark single notification as read
await notificacoesService.markAsRead('notif-id');

// Mark all as read
await notificacoesService.markAllAsRead();

// Delete notification
await notificacoesService.delete('notif-id');

// UI Helpers
const icon = notificacoesService.getNotificationIcon('success');
const colors = notificacoesService.getNotificationColor('error');
const time = notificacoesService.formatRelativeTime(date);
```

---

## 🍳 Recipes

```typescript
// List recipes with filters
const recipes = await recipesService.getAll({
  search: 'frango',
  dificuldade: 'facil',
  tags_dieta: ['vegetarian'],
  page: 1,
  limit: 20
});

// Get single recipe
const recipe = await recipesService.getById('recipe-id');

// Create recipe
await recipesService.create({
  nome: 'Salada Verde',
  modo_preparo: 'Misture tudo...',
  tempo_preparo: 15,
  rendimento_porcoes: 4,
  dificuldade: 'facil',
  ingredientes: [
    { produto_id: 'uuid', quantidade: 200, unidade: 'g' }
  ]
});

// Execute recipe
await recipesService.executar('recipe-id', {
  porcoes_feitas: 2,
  avaliacao: 8,
  comentario: 'Ficou delicioso!'
});

// Get suggestions (MOI Engine)
const suggestions = await recipesService.getSugestoes();

// Generate with AI (when implemented)
await recipesService.gerarComIA(['tomate', 'alface', 'queijo']);
```

---

## 🛠️ Admin Dashboard

```typescript
// List products (admin)
const products = await adminService.listProducts(1, 20, {
  search: 'termo',
  categoriaId: 'uuid'
});

// Get product statistics
const stats = await adminService.getProductStats();
```

---

## ⚙️ Error Handling Pattern

```typescript
async function loadData() {
  try {
    const data = await usuariosService.getMe();
    // Success
  } catch (error) {
    // Handle error
    console.error(error.response?.data?.message);
  }
}
```

---

## 📂 Files Location

- Services: `frontend/src/services/`
- Import from: `@/services`

---

**Total Services**: 8 | **Total Methods**: 54+ | **Status**: ✅ Production Ready
