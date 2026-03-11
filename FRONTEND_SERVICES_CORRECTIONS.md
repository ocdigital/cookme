# Frontend Services - Corrections & Updates

## 📋 Summary

All frontend API services have been refactored and corrected to match the actual backend API endpoints. The services are now properly organized, typed, and ready for integration.

---

## ✅ Services Created/Updated

### 1. **usuariosService.ts** (NEW)
**Purpose**: User profile management and admin user listing
**Endpoints**:
- `GET /usuarios/me` - Get current user profile
- `PATCH /usuarios/me` - Update profile (nome, telefone, avatar_url)
- `POST /usuarios/me/avatar` - Update avatar URL
- `DELETE /usuarios/me` - Delete user account
- `GET /usuarios/preferencias` - Get user preferences
- `PATCH /usuarios/preferencias` - Update preferences
- `GET /admin/usuarios` - List all users (admin)
- `GET /admin/usuarios/stats` - Get user statistics (admin)

**Key Methods**:
```typescript
usuariosService.getMe()                              // Get current user
usuariosService.updateMe(data)                       // Update profile
usuariosService.updateAvatar(url)                    // Update avatar
usuariosService.getPreferencias()                    // Get preferences
usuariosService.updatePreferencias(data)             // Update preferences
usuariosService.getAll(page, limit, filters)         // List users (admin)
usuariosService.getStats()                           // Get stats (admin)
```

### 2. **produtosService.ts** (NEW)
**Purpose**: Complete product management including search, brands, and categories
**Endpoints**:
- `GET /produtos` - List products with filters
- `GET /produtos/:id` - Get product by ID
- `GET /produtos/barcode/:codigo` - Find by barcode
- `GET /produtos/search` - Autocomplete search
- `POST /produtos` - Create product (admin)
- `PATCH /produtos/:id` - Update product (admin)
- `DELETE /produtos/:id` - Delete product (admin)
- `GET /produtos/marcas/all` - List all brands
- `POST /produtos/marcas` - Create brand (admin)
- `GET /produtos/categorias/all` - List all categories
- `POST /produtos/categorias` - Create category (admin)
- `GET /produtos/stats` - Get product statistics

**Key Methods**:
```typescript
produtosService.getAll(page, limit, filters)        // List products
produtosService.getById(id)                         // Get product
produtosService.getByBarcode(codigo)                // Find by barcode
produtosService.search(query)                       // Autocomplete search
produtosService.create(data)                        // Create (admin)
produtosService.getMarcas()                         // List brands
produtosService.getCategorias()                     // List categories
produtosService.getStats()                          // Get statistics
```

### 3. **comprasService.ts** (NEW)
**Purpose**: Purchase tracking and management
**Endpoints**:
- `GET /compras` - List user's purchases
- `GET /compras/:id` - Get purchase by ID
- `POST /compras` - Create purchase
- `DELETE /compras/:id` - Delete purchase
- `GET /compras/stats` - Get purchase statistics

**Key Methods**:
```typescript
comprasService.getAll(page, limit)                  // List purchases
comprasService.getById(id)                          // Get purchase
comprasService.create(data)                         // Create purchase
comprasService.delete(id)                           // Delete purchase
comprasService.getStats()                           // Get statistics
```

### 4. **inventarioService.ts** (NEW)
**Purpose**: Inventory/stock management
**Endpoints**:
- `GET /inventario` - List inventory items
- `GET /inventario/:id` - Get item by ID
- `POST /inventario` - Add item
- `PATCH /inventario/:id` - Update item
- `DELETE /inventario/:id` - Remove item
- `GET /inventario/stats` - Get inventory statistics
- `GET /inventario/vencendo` - Items expiring soon
- `GET /inventario/vencidos` - Expired items

**Key Methods**:
```typescript
inventarioService.getAll(page, limit)               // List items
inventarioService.getById(id)                       // Get item
inventarioService.create(data)                      // Add item
inventarioService.update(id, data)                  // Update item
inventarioService.delete(id)                        // Remove item
inventarioService.getStats()                        // Get statistics
inventarioService.getVencendo(dias)                 // Expiring soon
inventarioService.getVencidos()                     // Expired items
```

### 5. **notificacoesService.ts** (UPDATED)
**Purpose**: Real API integration for notifications (was previously mock)
**Endpoints**:
- `GET /notificacoes` - List notifications
- `GET /notificacoes/unread-count` - Get unread count
- `POST /notificacoes/:id/mark-read` - Mark as read
- `POST /notificacoes/mark-all-read` - Mark all as read
- `DELETE /notificacoes/:id` - Delete notification

**Key Methods**:
```typescript
notificacoesService.getAll(page, limit)             // List notifications
notificacoesService.getUnreadCount()                // Get unread count
notificacoesService.markAsRead(id)                  // Mark as read
notificacoesService.markAllAsRead()                 // Mark all as read
notificacoesService.delete(id)                      // Delete notification
notificacoesService.getNotificationIcon(type)      // Get icon (helper)
notificacoesService.getNotificationColor(type)     // Get colors (helper)
notificacoesService.formatRelativeTime(date)       // Format time (helper)
```

### 6. **recipesService.ts** (Already Good)
**Status**: Already well-implemented, minor improvements
**Includes**:
- Full recipe CRUD
- Advanced filtering
- Recipe execution tracking
- AI generation methods (ready for backend implementation)
- Helper functions for UI

### 7. **adminService.ts** (Already Exists)
**Status**: Good for admin dashboard
**Key Methods**:
```typescript
adminService.listProducts(page, limit, filters)     // List products with filters
adminService.getProductStats()                      // Get product statistics
```

### 8. **api.ts** (CLEANED UP)
**Purpose**: Core Axios configuration
**Features**:
- ✅ Auth token injection via interceptor
- ✅ Automatic token refresh on 401
- ✅ Base URL from environment variables
- ✅ Error handling and logging
- ✅ Timeout configuration

---

## 📂 File Organization

```
frontend/src/services/
├── api.ts                      // Core Axios config (updated)
├── index.ts                    // Centralized exports (NEW)
├── usuariosService.ts          // User management (NEW)
├── produtosService.ts          // Product management (NEW)
├── comprasService.ts           // Purchases (NEW)
├── inventarioService.ts        // Inventory (NEW)
├── notificacoesService.ts      // Notifications (UPDATED)
├── recipesService.ts           // Recipes (already good)
├── adminService.ts             // Admin (already exists)
├── adminUsersService.ts        // DEPRECATED (use usuariosService.ts)
├── userService.ts              // DEPRECATED (use usuariosService.ts)
└── ... other existing services
```

---

## 🔧 Endpoint Corrections

### Before vs After

| Feature | Before | After | Status |
|---------|--------|-------|--------|
| User Profile | `api.getProfile()` | `usuariosService.getMe()` | ✅ Fixed |
| Users List (Admin) | `/users` | `/admin/usuarios` | ✅ Fixed |
| Products List | `/products` | `/produtos` | ✅ Fixed |
| Product Search | `/products/search` | `/produtos/search` | ✅ Fixed |
| Purchases | `/purchases` | `/compras` | ✅ Fixed |
| Inventory | N/A | `/inventario` | ✅ New |
| Recipes | `/recipes` | `/receitas` | ✅ Uses recipesService |
| Notifications | Mock data | Real API `/notificacoes` | ✅ Fixed |
| Admin Stats | `/stats/*` | `/admin/*` | ✅ Fixed |

---

## 💡 Usage Examples

### Getting User Profile
```typescript
import { usuariosService } from '@/services';

const user = await usuariosService.getMe();
console.log(user.nome); // Eduardo Ferreira
```

### Listing Products with Filters
```typescript
import { produtosService } from '@/services';

const response = await produtosService.getAll(1, 20, {
  search: 'tomate',
  categoriaId: 'uuid-here'
});
console.log(response.data);  // Products array
console.log(response.total); // Total count
```

### Managing Inventory
```typescript
import { inventarioService } from '@/services';

// Add item
const item = await inventarioService.create({
  produto_id: 'uuid',
  quantidade: 5,
  unidade: 'kg',
  data_validade: '2025-12-31',
  local_armazenagem: 'Geladeira'
});

// Get expiring soon
const expiring = await inventarioService.getVencendo(7);
```

### Getting Notifications
```typescript
import { notificacoesService } from '@/services';

const unreadCount = await notificacoesService.getUnreadCount();
const notifications = await notificacoesService.getAll(1, 10);

// Mark as read
await notificacoesService.markAsRead(notificationId);
```

---

## 🚀 Integration Checklist

- [x] **usuariosService** - User management endpoints
- [x] **produtosService** - Product management endpoints
- [x] **comprasService** - Purchase endpoints
- [x] **inventarioService** - Inventory endpoints
- [x] **notificacoesService** - Notifications with real API
- [x] **recipesService** - Already functional
- [x] **adminService** - Admin dashboard ready
- [x] **api.ts** - Cleaned up and documented
- [x] **index.ts** - Centralized exports
- [ ] **Update pages to use new services** (Next step)
- [ ] **Test all endpoints** (Next step)
- [ ] **Implement error handling** (Next step)

---

## 🔐 Authentication

All services automatically include the auth token via axios interceptor:
```typescript
// Token is automatically added to all requests
const token = localStorage.getItem('accessToken');
// Authorization: Bearer {token}
```

**Token Refresh Flow**:
1. Request fails with 401
2. Interceptor detects 401
3. Calls `POST /auth/refresh` with refreshToken
4. Gets new accessToken
5. Retries original request
6. If refresh fails, redirects to `/login`

---

## 📝 Environment Variables Required

```env
VITE_API_URL=http://localhost:3000/api
```

---

## ✨ Next Steps

1. **Update Pages** - Replace old API calls with new services
2. **Add Error Handling** - Implement try-catch in components
3. **Add Loading States** - Show loading indicators during API calls
4. **Add Toast Notifications** - Feedback for user actions
5. **Implement Real-Time Updates** - WebSocket for notifications
6. **Add Request Caching** - Avoid redundant API calls

---

## 📚 Type Safety

All services are fully typed with TypeScript:
```typescript
// Intellisense and type checking work great
const user: Usuario = await usuariosService.getMe();
const produtos: Produto[] = (await produtosService.getAll()).data;
```

---

## 🎯 Status

- ✅ All services created/updated
- ✅ Endpoints verified against backend
- ✅ Full TypeScript support
- ✅ Proper error handling structure
- ✅ Centralized exports
- ⏳ Ready for component integration
- ⏳ Ready for testing

