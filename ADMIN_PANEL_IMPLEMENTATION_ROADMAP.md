# Admin Dashboard Implementation Roadmap

## Overview
This document outlines the step-by-step approach to building a comprehensive admin dashboard for CookMe. The backend already has extensive APIs and data models - this focuses on what needs to be added to support admin features.

---

## Phase 1: Foundation (Week 1)
### Goal: Set up admin infrastructure

#### 1.1 Backend - Add Admin Endpoints
**Files to create/modify:**
- `/src/modules/usuarios/usuarios.controller.ts`
- `/src/modules/usuarios/usuarios.service.ts`

**What to implement:**
```typescript
// New admin endpoints in usuarios.controller.ts:
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Get('admin/all')
async getAllUsers(@Query() filters: UserFilterDto): Promise<Usuario[]> {
  // List all users with filtering
}

@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Patch('admin/:id/role')
async updateUserRole(@Param('id') id: string, @Body() body: {role: UserRole}): Promise<Usuario> {
  // Change user role (USER, PREMIUM, ADMIN)
}

@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Delete('admin/:id')
async deleteUser(@Param('id') id: string): Promise<void> {
  // Hard delete user account
}

@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Get('admin/stats')
async getUserStatistics(): Promise<UserStatsDto> {
  // Aggregate stats: total users, by role, active, etc.
}
```

**Data to query:**
- Total users by role
- New users (last 7 days, 30 days, etc.)
- Active users (last login)
- Premium subscribers
- Admin count

#### 1.2 Frontend - Admin Authentication
**Create:**
- Admin login page (reuse auth logic)
- Admin dashboard layout/navigation
- Role check middleware

#### 1.3 Database
**Nothing new needed - users table already has role field**

**Queries to enable:**
```sql
SELECT role, COUNT(*) FROM usuarios GROUP BY role;
SELECT * FROM usuarios WHERE role = 'ADMIN';
SELECT * FROM usuarios WHERE ultimo_acesso > NOW() - INTERVAL '7 days';
```

---

## Phase 2: User Management (Week 1-2)
### Goal: Complete admin user management interface

#### 2.1 Backend Enhancements

**New Admin Endpoints:**

```typescript
// List all users with pagination & filtering
GET /api/admin/usuarios?role=USER&limit=50&offset=0&search=email

// Get detailed user profile with activity
GET /api/admin/usuarios/:id/detail

// View user's purchases
GET /api/admin/usuarios/:id/compras

// View user's inventory
GET /api/admin/usuarios/:id/inventario

// View user's recipes
GET /api/admin/usuarios/:id/receitas

// Send notification to user (future feature)
POST /api/admin/usuarios/:id/notify

// View user's affiliate earnings
GET /api/admin/usuarios/:id/affiliate-earnings

// View user's subscription details
GET /api/admin/usuarios/:id/subscription
```

**User Statistics Endpoints:**

```typescript
GET /api/admin/stats/users/overview
GET /api/admin/stats/users/by-role
GET /api/admin/stats/users/by-registration-date
GET /api/admin/stats/users/active
GET /api/admin/stats/users/churn
```

#### 2.2 Frontend - User Management Dashboard

**UI Components:**
- User list table with pagination
- Filter sidebar (role, status, date range)
- User detail modal
- Role assignment dropdown
- Delete confirmation dialog
- Activity timeline view
- Search bar

**Pages:**
- `/admin/users` - Main user list
- `/admin/users/:id` - User detail page
- `/admin/users/:id/activity` - Activity log

#### 2.3 Database Queries

```sql
-- Get users with activity stats
SELECT u.*, 
       COUNT(DISTINCT c.id) as total_compras,
       COUNT(DISTINCT i.id) as inventario_items,
       MAX(u.ultimo_acesso) as last_active
FROM usuarios u
LEFT JOIN compras c ON u.id = c.usuario_id
LEFT JOIN inventario i ON u.id = i.usuario_id
GROUP BY u.id
ORDER BY u.criado_em DESC;

-- User growth over time
SELECT DATE(criado_em) as data, COUNT(*) as novos
FROM usuarios
GROUP BY DATE(criado_em)
ORDER BY data DESC;

-- Active users by role
SELECT role, COUNT(DISTINCT id) as ativos
FROM usuarios
WHERE ultimo_acesso > NOW() - INTERVAL '7 days'
GROUP BY role;
```

---

## Phase 3: Product Management (Week 2-3)
### Goal: Admin product catalog control

#### 3.1 Backend Enhancements

**New Endpoints:**

```typescript
// Admin-only product operations
@Roles(UserRole.ADMIN)
@Get('/admin/produtos')
async getProductsForAdmin(@Query() filters): Promise<Product[]> {
  // List all products with verification status
}

@Roles(UserRole.ADMIN)
@Get('/admin/produtos/stats')
async getProductStats(): Promise<ProductStatsDto> {
  // Stats: total products, by origin, verified, etc.
}

@Roles(UserRole.ADMIN)
@Patch('/admin/produtos/:id/verify')
async verifyProduct(@Param('id') id: string): Promise<Product> {
  // Mark product as verified
}

@Roles(UserRole.ADMIN)
@Delete('/admin/produtos/:id/hard-delete')
async hardDeleteProduct(@Param('id') id: string): Promise<void> {
  // Completely remove product from catalog
}

@Roles(UserRole.ADMIN)
@Post('/admin/produtos/bulk-import')
async bulkImportProducts(@Body() csvData): Promise<ImportResultDto> {
  // Import products from CSV
}

// Category management
@Roles(UserRole.ADMIN)
@Patch('/admin/categorias/:id')
async updateCategory(@Param('id') id: string, @Body() dto): Promise<Categoria> {
  // Update category details
}

@Roles(UserRole.ADMIN)
@Delete('/admin/categorias/:id')
async deleteCategory(@Param('id') id: string): Promise<void> {
  // Remove category
}

// Brand management
@Roles(UserRole.ADMIN)
@Patch('/admin/marcas/:id')
async updateBrand(@Param('id') id: string, @Body() dto): Promise<Marca> {
  // Update brand
}

@Roles(UserRole.ADMIN)
@Delete('/admin/marcas/:id')
async deleteBrand(@Param('id') id: string): Promise<void> {
  // Remove brand
}
```

#### 3.2 Frontend - Product Management Dashboard

**UI Components:**
- Product list table with pagination
- Advanced filters (category, brand, origin, verified status)
- Product editor modal
- Bulk import form (CSV)
- Image upload
- Category tree editor
- Brand list management
- Barcode search
- Duplicate detection

**Pages:**
- `/admin/products` - Product catalog
- `/admin/products/:id/edit` - Edit product
- `/admin/products/import` - Bulk import
- `/admin/categories` - Category hierarchy
- `/admin/brands` - Brand management

#### 3.3 Database Queries

```sql
-- Products by origin & verification
SELECT origem, verificado, COUNT(*) as total
FROM produtos
GROUP BY origem, verificado;

-- Top products by purchase count
SELECT p.id, p.nome, COUNT(ci.id) as times_purchased
FROM produtos p
LEFT JOIN compra_itens ci ON p.id = ci.produto_id
GROUP BY p.id, p.nome
ORDER BY times_purchased DESC
LIMIT 100;

-- Products without categories
SELECT * FROM produtos WHERE categoria_id IS NULL;

-- Duplicate barcodes (potential issues)
SELECT codigo_barras, COUNT(*) as count
FROM produtos
WHERE codigo_barras IS NOT NULL
GROUP BY codigo_barras
HAVING COUNT(*) > 1;
```

---

## Phase 4: Analytics Dashboard (Week 3-4)
### Goal: Real-time insights into platform usage

#### 4.1 Backend Enhancements

**New Analytics Endpoints:**

```typescript
@Roles(UserRole.ADMIN)
@Get('/admin/analytics/overview')
async getOverview(@Query() range: DateRangeDto): Promise<OverviewStatsDto> {
  // Dashboard metrics for date range
}

@Roles(UserRole.ADMIN)
@Get('/admin/analytics/users')
async getUserAnalytics(@Query() range: DateRangeDto): Promise<UserAnalyticsDto> {
  // DAU, MAU, retention, churn
}

@Roles(UserRole.ADMIN)
@Get('/admin/analytics/purchases')
async getPurchaseAnalytics(@Query() range: DateRangeDto): Promise<PurchaseAnalyticsDto> {
  // Total sales, average order value, frequency
}

@Roles(UserRole.ADMIN)
@Get('/admin/analytics/revenue')
async getRevenueAnalytics(@Query() range: DateRangeDto): Promise<RevenueAnalyticsDto> {
  // Subscription revenue, affiliate earnings, growth
}

@Roles(UserRole.ADMIN)
@Get('/admin/analytics/products')
async getProductAnalytics(@Query() range: DateRangeDto): Promise<ProductAnalyticsDto> {
  // Top products, categories, trending
}

@Roles(UserRole.ADMIN)
@Get('/admin/analytics/classification')
async getClassificationMetrics(): Promise<ClassificationMetricsDto> {
  // AI classification accuracy, confidence scores
}

@Roles(UserRole.ADMIN)
@Get('/admin/analytics/export')
async exportAnalytics(@Query() params: ExportParamsDto): Promise<File> {
  // Export data as CSV or PDF
}
```

**What to display:**
- DAU/MAU trends
- New user registrations
- Feature adoption rates
- Revenue by source
- Top products
- Classification accuracy
- System health

#### 4.2 Frontend - Analytics Dashboard

**UI Components:**
- Line charts (users, revenue over time)
- Bar charts (top products, categories)
- Pie charts (revenue by plan, etc.)
- KPI cards (summary metrics)
- Date range picker
- Export buttons
- Data table for details
- Filters

**Pages:**
- `/admin/analytics` - Main dashboard
- `/admin/analytics/users` - User metrics
- `/admin/analytics/revenue` - Financial metrics
- `/admin/analytics/products` - Product metrics
- `/admin/analytics/export` - Data export

#### 4.3 Database Queries

```sql
-- Daily active users
SELECT DATE(ultimo_acesso) as data, COUNT(DISTINCT id) as dau
FROM usuarios
WHERE ultimo_acesso > NOW() - INTERVAL '30 days'
GROUP BY DATE(ultimo_acesso);

-- Monthly active users
SELECT 
  DATE_TRUNC('month', ultimo_acesso)::DATE as month,
  COUNT(DISTINCT id) as mau
FROM usuarios
WHERE ultimo_acesso > NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', ultimo_acesso)
ORDER BY month DESC;

-- Revenue by subscription plan
SELECT p.plano, COUNT(*) as count, 
       COALESCE(SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END), 0) as active
FROM subscriptions s
GROUP BY p.plano;

-- Purchase trends
SELECT DATE(data_compra) as data, 
       COUNT(*) as compras,
       SUM(valor_total) as total
FROM compras
GROUP BY DATE(data_compra)
ORDER BY data DESC;
```

---

## Phase 5: Moderation & Classification (Week 4-5)
### Goal: Review and approve user content

#### 5.1 Backend Enhancements

**New Moderation Endpoints:**

```typescript
@Roles(UserRole.ADMIN)
@Get('/admin/moderation/low-confidence')
async getLowConfidenceProducts(@Query() confidence: number): Promise<Product[]> {
  // Products with low classification confidence
}

@Roles(UserRole.ADMIN)
@Post('/admin/moderation/override-classification')
async overrideClassification(@Body() dto: ClassificationOverrideDto): Promise<void> {
  // Manually override AI classification
}

@Roles(UserRole.ADMIN)
@Get('/admin/moderation/recipes')
async getRecipesForReview(): Promise<Recipe[]> {
  // Recipes pending approval
}

@Roles(UserRole.ADMIN)
@Patch('/admin/moderation/recipes/:id/approve')
async approveRecipe(@Param('id') id: string): Promise<Recipe> {
  // Approve recipe for public view
}

@Roles(UserRole.ADMIN)
@Get('/admin/moderation/ocr-queue')
async getOCRQueue(): Promise<ScraperSession[]> {
  // Pending OCR sessions
}

@Roles(UserRole.ADMIN)
@Get('/admin/moderation/reports')
async getUserReports(): Promise<Report[]> {
  // User-reported issues
}
```

#### 5.2 Frontend - Moderation Dashboard

**UI Components:**
- Queue list (low confidence products)
- Classification override form
- Batch approve/reject buttons
- Appeal handling form
- Evidence viewer (images, screenshots)
- Audit log viewer

**Pages:**
- `/admin/moderation` - Moderation queue
- `/admin/moderation/classifications` - Product classifications
- `/admin/moderation/recipes` - Recipe review
- `/admin/moderation/ocr` - OCR processing
- `/admin/moderation/reports` - User reports

---

## Phase 6: Monetization Management (Week 5-6)
### Goal: Manage subscriptions and affiliate earnings

#### 6.1 Backend Enhancements

**New Endpoints:**

```typescript
@Roles(UserRole.ADMIN)
@Get('/admin/monetization/subscriptions')
async getAllSubscriptions(@Query() filters): Promise<Subscription[]> {
  // View all active subscriptions
}

@Roles(UserRole.ADMIN)
@Get('/admin/monetization/subscriptions/stats')
async getSubscriptionStats(): Promise<SubscriptionStatsDto> {
  // Revenue, churn, growth
}

@Roles(UserRole.ADMIN)
@Get('/admin/monetization/affiliate-links')
async getAffiliateLinks(): Promise<AffiliateLink[]> {
  // All affiliate links
}

@Roles(UserRole.ADMIN)
@Post('/admin/monetization/affiliate-links')
async createAffiliateLink(@Body() dto): Promise<AffiliateLink> {
  // Add new affiliate link
}

@Roles(UserRole.ADMIN)
@Get('/admin/monetization/affiliate-stats')
async getAffiliateStats(@Query() range: DateRangeDto): Promise<AffiliateStatsDto> {
  // Click, conversion, and commission data
}

@Roles(UserRole.ADMIN)
@Post('/admin/monetization/affiliate-payouts')
async initiatePayouts(@Body() dto: PayoutDto): Promise<void> {
  // Process affiliate commission payouts
}

@Roles(UserRole.ADMIN)
@Get('/admin/monetization/commissions')
async getCommissions(@Query() filters): Promise<Commission[]> {
  // Pending, confirmed, paid
}
```

#### 6.2 Frontend - Monetization Dashboard

**UI Components:**
- Subscription status table
- Revenue chart
- Churn analysis
- Affiliate link manager
- Click/conversion dashboard
- Commission payout form
- Payment history

**Pages:**
- `/admin/monetization` - Overview
- `/admin/monetization/subscriptions` - Subscription management
- `/admin/monetization/affiliate` - Affiliate management
- `/admin/monetization/payouts` - Commission payouts

---

## Phase 7: System Administration (Week 6-7)
### Goal: System configuration and monitoring

#### 7.1 Backend - Admin Features

```typescript
@Roles(UserRole.ADMIN)
@Get('/admin/system/health')
async getSystemHealth(): Promise<HealthDto> {
  // Database, API, cache status
}

@Roles(UserRole.ADMIN)
@Get('/admin/system/logs')
async getSystemLogs(@Query() params): Promise<Log[]> {
  // Error logs, API logs, access logs
}

@Roles(UserRole.ADMIN)
@Post('/admin/system/config')
async updateConfig(@Body() dto): Promise<void> {
  // Update system configuration
}

@Roles(UserRole.ADMIN)
@Get('/admin/system/jobs')
async getBackgroundJobs(): Promise<Job[]> {
  // Background job status
}

@Roles(UserRole.ADMIN)
@Get('/admin/system/api-metrics')
async getAPIMetrics(@Query() range): Promise<APIMetricsDto> {
  // Request count, response times, error rates
}

@Roles(UserRole.ADMIN)
@Post('/admin/system/clear-cache')
async clearCache(): Promise<void> {
  // Clear Redis cache
}

@Roles(UserRole.ADMIN)
@Post('/admin/system/backup')
async triggerBackup(): Promise<void> {
  // Trigger database backup
}
```

#### 7.2 Frontend - System Dashboard

**UI Components:**
- Health status indicators
- API metrics chart
- Log viewer
- Configuration form
- Job queue monitor
- Cache statistics
- Database size info

**Pages:**
- `/admin/system` - System overview
- `/admin/system/health` - Health monitoring
- `/admin/system/logs` - Log viewer
- `/admin/system/jobs` - Job scheduler
- `/admin/system/config` - Configuration

---

## Implementation Timeline Summary

```
Week 1:   Phase 1 (Foundation) + Phase 2 (User Management)
Week 2:   Phase 2 (complete) + Phase 3 (Products - start)
Week 3:   Phase 3 (Products - complete) + Phase 4 (Analytics - start)
Week 4:   Phase 4 (Analytics - complete) + Phase 5 (Moderation - start)
Week 5:   Phase 5 (complete) + Phase 6 (Monetization - start)
Week 6:   Phase 6 (complete) + Phase 7 (System - start)
Week 7:   Phase 7 (complete) + Testing & Polish
```

---

## Testing Strategy

### Unit Tests
- Service methods for admin operations
- Authorization checks on admin endpoints
- Data aggregation queries

### Integration Tests
- Full admin workflows (user creation → deletion)
- Permission checks
- Cascading deletes

### E2E Tests
- Admin dashboard flows
- Data export functionality
- Real-time updates

### Security Testing
- Role-based access (only ADMIN can access)
- Data isolation (users can't see other users' data)
- SQL injection prevention
- XSS protection

---

## Key API Endpoints Summary

### User Management
```
GET    /api/admin/usuarios
GET    /api/admin/usuarios/:id
PATCH  /api/admin/usuarios/:id/role
DELETE /api/admin/usuarios/:id
GET    /api/admin/stats/users/overview
```

### Product Management
```
GET    /api/admin/produtos
PATCH  /api/admin/produtos/:id/verify
DELETE /api/admin/produtos/:id/hard-delete
POST   /api/admin/produtos/bulk-import
GET    /api/admin/categorias
PATCH  /api/admin/categorias/:id
GET    /api/admin/marcas
PATCH  /api/admin/marcas/:id
```

### Analytics
```
GET /api/admin/analytics/overview
GET /api/admin/analytics/users
GET /api/admin/analytics/purchases
GET /api/admin/analytics/revenue
GET /api/admin/analytics/products
GET /api/admin/analytics/export
```

### Moderation
```
GET  /api/admin/moderation/low-confidence
POST /api/admin/moderation/override-classification
GET  /api/admin/moderation/recipes
PATCH /api/admin/moderation/recipes/:id/approve
GET  /api/admin/moderation/ocr-queue
GET  /api/admin/moderation/reports
```

### Monetization
```
GET  /api/admin/monetization/subscriptions
GET  /api/admin/monetization/subscriptions/stats
GET  /api/admin/monetization/affiliate-links
POST /api/admin/monetization/affiliate-links
GET  /api/admin/monetization/affiliate-stats
POST /api/admin/monetization/affiliate-payouts
GET  /api/admin/monetization/commissions
```

### System Admin
```
GET  /api/admin/system/health
GET  /api/admin/system/logs
POST /api/admin/system/config
GET  /api/admin/system/jobs
GET  /api/admin/system/api-metrics
POST /api/admin/system/clear-cache
POST /api/admin/system/backup
```

---

## Dependencies & Tools

### Backend
- TypeORM for database queries (already set up)
- NestJS features (Guards, Decorators)
- Postgres for analytics queries

### Frontend
- React (or Vue)
- React Router for navigation
- Chart library (Chart.js, Recharts)
- Table library (React Table)
- Form library (React Hook Form)

### External Services
- Stripe API (for subscription management)
- CSV parser (for bulk import)
- PDF library (for export)

---

