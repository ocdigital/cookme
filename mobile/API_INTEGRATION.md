# API Integration - Recipes Module

## Overview

The mobile app has been integrated with the NestJS backend API to fetch real data instead of using mock data. This document outlines the API integration for the recipes and inventory features.

---

## Integrated Screens

### 1. **RecipesListScreen**
📍 `src/screens/RecipesListScreen.js`

**API Integration:**
- Fetches recipes from `/api/receitas` endpoint using `receitasService.getReceitas()`
- **Loading State**: Shows spinner while fetching
- **Error Handling**: Falls back to mock data if API fails
- **Features**:
  - Real-time search (client-side filtering)
  - Multiple sort options (alphabetical, time, rating, calories)
  - Full recipe information display

**Data Flow:**
```
useEffect (on mount)
  ↓
loadRecipes()
  ↓
receitasService.getReceitas()
  ↓
Update recipes state
  ↓
filterAndSortRecipes() on search/sort changes
```

---

### 2. **FavoritesScreen**
📍 `src/screens/FavoritesScreen.js`

**API Integration:**
- Fetches favorite recipes from `/api/receitas?favoritas=true` endpoint
- **Loading State**: Shows spinner while fetching
- **Error Handling**: Falls back to mock data if API fails
- **Features**:
  - Search within favorites
  - Sort by recent/time/rating
  - Grid layout (2 columns)
  - Option to explore more recipes if list is empty

**Data Flow:**
```
useEffect (on mount)
  ↓
loadFavorites()
  ↓
receitasService.getReceitas({ favoritas: true })
  ↓
Update favorites state
  ↓
Filter & sort on changes
```

---

### 3. **HomeScreenRecipes**
📍 `src/screens/HomeScreenRecipes.js`

**API Integration:**
- Fetches expiring products from `/api/inventario/vencendo` endpoint
- **Time Range**: Products expiring within 7 days
- **Error Handling**: Silently fails if API unavailable (doesn't disrupt user experience)
- **Features**:
  - Real-time product alerts
  - Days remaining badges
  - Direct link to recipes with expiring products

**Data Flow:**
```
useEffect (on mount)
  ↓
loadExpiringProducts()
  ↓
inventarioService.getVencendo(7)
  ↓
Update expiringProducts state
  ↓
Conditional rendering of alert box
```

---

## API Endpoints Used

### Recipes Service (`receitasService`)
```javascript
// Get all recipes with optional filters
GET /api/receitas
  - Query params: { favoritas?: boolean, search?: string, sort?: string }
  - Returns: Array<Recipe>

// Get recipe suggestions
GET /api/receitas/sugestoes
  - Returns: Array<Recipe>

// Execute recipe (log usage)
POST /api/receitas/:id/executar
  - Body: { porções: number, data: Date }
  - Returns: Recipe execution record
```

### Inventory Service (`inventarioService`)
```javascript
// Get expiring products
GET /api/inventario/vencendo
  - Query params: { days?: number }
  - Returns: Array<Product>

// Get inventory stats
GET /api/inventario/stats
  - Returns: { total: number, expiring: number, expired: number }
```

---

## Data Structure & Field Mapping

### Recipe Object
```javascript
{
  id: string (UUID),
  nome: string,
  descricao: string,
  imagem: string (URL),
  tempoPreparo: number (minutes),
  tempoCozimento: number (minutes),
  calorias: number,
  avaliacoes: number (rating 0-5),
  dificuldade: string ('fácil' | 'médio' | 'difícil'),
  // ... other fields
}
```

### Expiring Product Object
```javascript
{
  id: string (UUID),
  nome: string,
  name: string (alternative field),
  diasRestantes: number,
  daysUntilExpiry: number (alternative field),
  dataValidade: string (Date),
  // ... other fields
}
```

**Note**: The code handles both naming conventions (`nome`/`name`, `diasRestantes`/`daysUntilExpiry`) for compatibility.

---

## Error Handling Strategy

### 1. **Graceful Degradation**
- If API fails, the app falls back to mock data
- User experience is not disrupted
- Error messages are shown when appropriate

### 2. **Error Banners**
- Red error banners appear at the top of screens on API failures
- User-friendly messages in Portuguese
- Non-blocking (doesn't prevent using the app)

### 3. **Loading States**
- Activity indicators shown while fetching
- "Carregando..." messages appear
- Prevents user from perceiving lag

### 4. **Silent Failures**
- Home screen expiring products fail silently (doesn't show alert if API unavailable)
- Better for critical paths (home screen should always be usable)

---

## Offline Fallback

All integrated screens include fallback mechanisms:

| Screen | Fallback | Triggers On |
|--------|----------|-----------|
| RecipesListScreen | Mock recipes (8 items) | API error OR empty response |
| FavoritesScreen | Mock favorites (4 items) | API error OR empty response |
| HomeScreenRecipes | No expiring products | API error (no visual indication) |

---

## Testing the Integration

### Prerequisites
```bash
# Backend running
npm run start:dev  # from /backend directory

# Backend must have:
# ✅ Users table with test user
# ✅ Receitas table with sample recipes
# ✅ Inventario table with products
# ✅ API_BASE_URL pointing to http://localhost:3000
```

### Test Flow
1. **Log in** to app
2. **RecipesListScreen**:
   - See loading spinner briefly
   - See real recipes from API
   - Search/sort functionality works
3. **FavoritesScreen**:
   - See loading spinner briefly
   - See favorite recipes if any exist
   - Otherwise, see mock favorites as fallback
4. **HomeScreenRecipes**:
   - Alert box appears if products expiring
   - Shows real inventory data from API

---

## Configuration

### API Base URL
Located in `src/config/api.js`:
```javascript
export const API_BASE_URL = 'http://localhost:3000/api';
```

Update this if backend port changes or for production deployment.

### Request Timeout
Set to 30 seconds in `src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // ...
});
```

---

## Future Enhancements

### Short-term
- [ ] Implement real favorite/unfavorite functionality
- [ ] Add recipe rating submission
- [ ] Implement recipe search backend-side filtering
- [ ] Cache recipes for offline access

### Long-term
- [ ] ML-based recipe recommendations
- [ ] User preference learning
- [ ] Real-time push notifications for expiring products
- [ ] Social features (share recipes, rate others)

---

## Troubleshooting

### Recipes Not Loading
1. Check backend is running: `npm run start:dev` in /backend
2. Verify API_BASE_URL in `src/config/api.js`
3. Check network tab in React Native debugger
4. Check backend logs for errors

### Expiring Products Not Showing
1. Verify user has products in inventory
2. Check products have `data_validade` within 7 days
3. Check backend `/api/inventario/vencendo` endpoint returns data

### Mock Data Always Showing
1. If intentional, this is the fallback behavior
2. To force API calls only, remove mock data fallback from screens
3. Check error console for API errors

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-11 | Initial API integration for recipes, favorites, and expiring products |

