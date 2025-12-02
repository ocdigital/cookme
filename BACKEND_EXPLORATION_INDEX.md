# Backend Exploration - Complete Documentation Index

This directory contains comprehensive documentation of the CookMe backend architecture, APIs, and resources for building an admin dashboard.

## Documentation Files (Read in This Order)

### 1. **START HERE: BACKEND_ADMIN_API_GUIDE.md**
   - Complete API reference for all 10 modules
   - Database entities and relationships
   - Authentication & authorization system
   - All 60+ endpoints documented
   - Critical for understanding what APIs are available

### 2. **BACKEND_MODULES_OVERVIEW.md**
   - Visual architecture diagram
   - Quick breakdown of each module
   - Complete endpoint table
   - Database relationship diagrams
   - Environment setup
   - Best for quick reference

### 3. **BACKEND_FILE_STRUCTURE.md**
   - Complete directory organization
   - File locations for all components
   - NestJS patterns and architecture
   - How to add new admin features
   - Data flow examples

### 4. **ADMIN_DASHBOARD_QUICK_START.md**
   - Quick reference for implementing admin features
   - Available endpoints by admin task
   - Data models for admin dashboard
   - Authorization requirements
   - Sample SQL queries
   - Performance considerations

### 5. **ADMIN_PANEL_IMPLEMENTATION_ROADMAP.md**
   - 7-phase implementation plan (7 weeks)
   - Detailed specs for each phase
   - Backend endpoint specifications
   - Frontend component requirements
   - Testing strategy
   - Timeline and dependencies

---

## Quick Navigation by Use Case

### I want to understand the backend architecture
Start with: **BACKEND_MODULES_OVERVIEW.md** → **BACKEND_ADMIN_API_GUIDE.md**

### I want to build an admin dashboard
Start with: **ADMIN_PANEL_IMPLEMENTATION_ROADMAP.md** → **ADMIN_DASHBOARD_QUICK_START.md**

### I want to understand specific APIs
Start with: **BACKEND_ADMIN_API_GUIDE.md** (use Ctrl+F to find your module)

### I want to find files in the codebase
Start with: **BACKEND_FILE_STRUCTURE.md**

### I want to add new admin features
Start with: **ADMIN_DASHBOARD_QUICK_START.md** → **BACKEND_FILE_STRUCTURE.md** → Code examples

---

## Key Information at a Glance

### 10 Backend Modules
1. **AUTH** - User authentication (register, login, logout)
2. **USUARIOS** - User profile & preferences management
3. **PRODUTOS** - Product catalog with categories & brands
4. **COMPRAS** - Purchase history tracking
5. **INVENTARIO** - Food inventory with expiration alerts
6. **RECEITAS** - Recipe catalog with MOI Engine suggestions
7. **SCRAPER** - OCR receipt scanning (Brazilian SAT system)
8. **BARCODE** - Barcode product lookup
9. **PRODUCT-CLASSIFICATION** - AI-powered food/non-food classification
10. **AFFILIATE** - Affiliate marketing, recommendations & subscriptions

### 60+ API Endpoints
- Public endpoints: 3 (auth/register, auth/login, auth/refresh)
- Protected endpoints: 57+ (all authenticated)
- Admin endpoints: 0 (need to be added)

### Database
- PostgreSQL with TypeORM
- 25+ entities
- Full relationship mappings
- UUID primary keys
- Proper indexing on frequently queried fields

### Authentication
- JWT-based (15-min access token, 7-day refresh token)
- bcrypt password hashing
- Role-based access control (USER, PREMIUM, ADMIN, MARCA)
- Global JWT guard on all routes (except @Public() marked)
- RolesGuard for role-based authorization

---

## Core Entities

### User Management
- **Usuario** - User accounts with roles and preferences
- **Preferencia** - Dietary restrictions and food preferences
- **Subscription** - Premium subscription plans (BASIC, PREMIUM, VIP, FAMILY)

### Products & Inventory
- **Produto** - Product catalog (with nutritional info, tags, barcodes)
- **Categoria** - Hierarchical product categories
- **Marca** - Brand information
- **Inventario** - User food inventory with expiry dates

### Purchases & Recipes
- **Compra** - Purchase records (with method: MANUAL, OCR, BARCODE)
- **CompraItem** - Individual items in a purchase
- **Receita** - Recipe catalog
- **ReceitaIngrediente** - Recipe ingredients
- **ReceitaExecutada** - Recipe execution history with ratings

### Affiliate & Monetization
- **AffiliateLink** - Affiliate marketing links
- **AffiliateClick** - Click tracking
- **AffiliateConversion** - Sales tracking
- **RecipeRecommendation** - AI recommendations
- **Transaction** - Payment transactions

### AI & Classification
- **ProductKnowledgeBase** - AI classification cache
- **AIClassificationLog** - API call logging
- **ProductValidation** - User validation feedback

---

## What Can Be Managed via Admin Dashboard

### User Management
- View all users filtered by role, status, registration date
- Manage user roles (USER → PREMIUM → ADMIN)
- View user activity and metrics
- Delete user accounts
- View subscription and affiliate earnings

### Product Management
- Create/edit/delete products
- Bulk import products (CSV)
- Verify products (mark as curated)
- Manage categories and brands
- Resolve duplicate barcodes
- View product origin and verification status

### Content Moderation
- Review low-confidence AI classifications
- Override classifications manually
- Approve/reject user-created recipes
- Monitor OCR processing queue
- View user reports

### Financial Management
- View subscription revenue by plan
- Track affiliate commission earnings
- Process commission payouts
- View payment history
- Analyze revenue trends

### Analytics
- DAU/MAU metrics
- User growth and churn
- Purchase statistics
- Product popularity
- Classification accuracy
- Feature adoption rates
- API usage metrics

### System Administration
- Monitor system health
- View error logs
- Manage configuration
- Monitor background jobs
- Clear caches
- Trigger backups

---

## Required Additions for Admin Dashboard

### Backend
These endpoints need to be created (they don't exist yet):

```
User Management:
- GET /api/admin/usuarios (list all)
- GET /api/admin/usuarios/:id/detail
- PATCH /api/admin/usuarios/:id/role
- DELETE /api/admin/usuarios/:id
- GET /api/admin/stats/users/*

Product Management:
- GET /api/admin/produtos
- PATCH /api/admin/produtos/:id/verify
- DELETE /api/admin/produtos/:id/hard-delete
- POST /api/admin/produtos/bulk-import
- GET /api/admin/stats/products/*

Analytics:
- GET /api/admin/analytics/* (all analytics endpoints)

Moderation:
- GET /api/admin/moderation/* (all moderation endpoints)

Monetization:
- GET /api/admin/monetization/* (all monetization endpoints)

System:
- GET /api/admin/system/* (all system endpoints)
```

### Frontend
- Admin dashboard app
- Navigation and routing
- 7+ admin pages (users, products, analytics, etc.)
- Charts and data visualization
- Forms for CRUD operations
- Export functionality (CSV, PDF)

---

## Architecture Decisions

### Technology Stack
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Documentation**: Swagger/OpenAPI (at `/api/docs`)

### Key Features
- **Validation**: Global validation pipe with DTOs
- **Error Handling**: Comprehensive HTTP status codes
- **CORS**: Enabled for web, mobile, and local development
- **Body Parser**: 10MB limit for OCR receipt HTML
- **Logging**: Error/warning logs in development

### Design Patterns
- Entity → DTO → Controller → Service architecture
- Dependency injection throughout
- Custom decorators for security and data injection
- Guards for authentication and authorization
- Module-based feature organization

---

## Important Notes for Development

### Security
- All routes are protected by JWT guard by default
- Use `@Public()` decorator to make routes public
- Use `@Roles()` decorator + `RolesGuard` for role-based access
- Passwords never returned in responses
- Refresh tokens stored in database (can be invalidated)

### Performance
- Key fields are indexed:
  - usuario_id (all user tables)
  - email (unique)
  - codigo_barras (unique)
  - data_validade (inventory)
  - criado_em (all tables)
- Consider pagination for large result sets
- Cache category hierarchy and brand lists

### Data Integrity
- Cascading deletes on user deletion
- Unique constraints prevent duplicates
- Foreign key relationships enforce referential integrity
- Metadata fields (JSONB) for extensibility

### Testing
- Mock API examples available in backend/
- Swagger docs at http://localhost:3000/api/docs
- Sample curl commands in documentation

---

## File Quick Reference

| Document | Purpose | Audience | Length |
|----------|---------|----------|--------|
| BACKEND_ADMIN_API_GUIDE.md | Complete API reference | Developers | Long |
| BACKEND_MODULES_OVERVIEW.md | Quick module overview | Everyone | Medium |
| BACKEND_FILE_STRUCTURE.md | Directory organization | Backend devs | Medium |
| ADMIN_DASHBOARD_QUICK_START.md | Quick implementation guide | Frontend devs | Medium |
| ADMIN_PANEL_IMPLEMENTATION_ROADMAP.md | 7-week implementation plan | Project managers | Long |

---

## Quick Command Reference

### Start the backend
```bash
cd backend
npm install
npm run start:dev
```

### Access APIs
- API Base: `http://localhost:3000/api`
- Swagger Docs: `http://localhost:3000/api/docs`

### Test an endpoint
```bash
# Get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","senha":"password"}'

# Use token in requests
curl http://localhost:3000/api/usuarios/me \
  -H "Authorization: Bearer <token>"
```

---

## Next Steps

1. **Understand the Architecture**
   - Read BACKEND_MODULES_OVERVIEW.md
   - Study BACKEND_ADMIN_API_GUIDE.md
   - Explore file structure in BACKEND_FILE_STRUCTURE.md

2. **Plan Admin Dashboard**
   - Review ADMIN_PANEL_IMPLEMENTATION_ROADMAP.md
   - Prioritize features
   - Create implementation timeline

3. **Start Development**
   - Phase 1: Foundation & User Management
   - Implement backend endpoints first
   - Then build frontend UI

4. **Test Thoroughly**
   - Use Swagger docs to test endpoints
   - Write unit tests for services
   - Integration tests for full workflows

5. **Deploy & Monitor**
   - Set up monitoring
   - Track API metrics
   - Monitor error rates

---

## Contact & Questions

For implementation questions or clarifications, refer to:
- **API Details**: BACKEND_ADMIN_API_GUIDE.md
- **Architecture**: BACKEND_FILE_STRUCTURE.md  
- **Implementation**: ADMIN_PANEL_IMPLEMENTATION_ROADMAP.md
- **Quick Reference**: ADMIN_DASHBOARD_QUICK_START.md

---

**Last Updated**: November 12, 2025
**Backend Version**: NestJS with TypeORM
**API Status**: Production-ready with 60+ endpoints
**Admin Dashboard**: Ready for implementation

