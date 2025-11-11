# CookMe Product System - Visual Flow & Architecture

## 1. Product Registration Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT CREATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

MOBILE APP (React Native)
├─ NO product creation screen exists yet
└─ Products enter via: PurchaseDetailsScreen (from compras import)

API REQUEST
│
├─ POST /api/produtos
│
└─> BACKEND (NestJS)
    │
    ├─> ProdutosController
    │   └─ @Post() create(createProdutoDto)
    │
    └─> DTO Validation (class-validator)
        ├─ @IsNotEmpty() nome
        ├─ @IsEnum(UnidadeMedida) unidade_padrao
        ├─ @IsUUID() @IsOptional() marca_id
        ├─ @IsUUID() @IsOptional() categoria_id [NO VALIDATION!]
        ├─ @IsArray() @IsOptional() tags
        └─ [NO PRODUCT TYPE CHECK!]
        
DATABASE
│
└─> ProdutosService.create()
    ├─ Check: codigo_barras unique? ✓
    ├─ Check: product type is food? ✗ (NO CHECK)
    ├─ Check: category exists? ✗ (NO CHECK)
    ├─ Check: category is food-related? ✗ (NO CHECK)
    └─ Save to DB
    
RESULT
├─ Product saved (ANY type, ANY category)
└─ Returns: Produto with all relationships

```

## 2. Produto Entity Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRODUTO (Product)                          │
│  id (UUID) | nome | descricao | codigo_barras | unidade_padrao   │
│  marca_id | categoria_id | tags | verificado | origem | ...     │
└──────────────────────────────────────────────────────────────────┘
                  │                        │
                  │                        │
        ┌─────────┘                        └──────────┐
        │                                             │
        ▼                                             ▼
    ┌─────────────────┐                    ┌──────────────────┐
    │    MARCA        │                    │   CATEGORIA      │
    │  (Brand)        │                    │ (Food Category)  │
    │                 │                    │                  │
    │ id, nome        │                    │ id, nome         │
    │ logo_url        │                    │ descricao        │
    │ site            │                    │ icone            │
    └─────────────────┘                    │ categoria_pai_id │
                                           │ (hierarchy)      │
                                           └──────────────────┘
                                                    │
                                                    │
                                           ┌────────┴────────┐
                                           │                 │
                                    Subcategories     Parent Category

CURRENT ISSUES:
─────────────────
❌ No product_type field
❌ No is_food_category flag on Categoria
❌ No validation that categoria_id belongs to food
❌ No validation on product_type enum
❌ Tags are free-form (no validation)
```

## 3. API Endpoints for Products

```
┌────────────────────────────────────────────────────────────┐
│              PRODUTOS MODULE - 12 ENDPOINTS                 │
└────────────────────────────────────────────────────────────┘

PRODUCTS (6 endpoints)
├─ POST /api/produtos
│  └─ Create product [NO TYPE VALIDATION ❌]
│
├─ GET /api/produtos
│  ├─ Query: search (text)
│  ├─ Query: categoriaId (UUID)
│  └─ Returns: Produto[] (limit: 50)
│
├─ GET /api/produtos/:id
│  └─ Returns: Produto with relations (marca, categoria)
│
├─ GET /api/produtos/barcode/:codigo
│  └─ Search by barcode
│
├─ PATCH /api/produtos/:id
│  └─ Update product [NO TYPE VALIDATION ❌]
│
└─ DELETE /api/produtos/:id
   └─ Delete product

BRANDS (3 endpoints)
├─ POST /api/produtos/marcas
│  └─ Create brand
│
├─ GET /api/produtos/marcas/all
│  └─ List all brands (ordered by name)
│
└─ GET /api/produtos/marcas/:id
   └─ Get single brand

CATEGORIES (3 endpoints)
├─ POST /api/produtos/categorias
│  └─ Create category [supports hierarchy]
│
├─ GET /api/produtos/categorias/all
│  └─ List all categories with hierarchy
│
└─ GET /api/produtos/categorias/:id
   └─ Get single category with relations

MISSING ENDPOINTS
├─ PUT /api/produtos/categorias/:id (no update)
├─ DELETE /api/produtos/categorias/:id (no delete)
├─ GET /api/produtos?type=GRAINS (type filtering)
└─ GET /api/produtos?is_food_category=true (food filtering)
```

## 4. Current Validation Layer

```
┌─────────────────────────────────────────────────────────────┐
│          VALIDATION SUMMARY - PRODUCT CREATION              │
└─────────────────────────────────────────────────────────────┘

LAYER 1: DTO Validation (class-validator)
┌──────────────────────────────────────────────────────────────┐
│ CreateProdutoDto                                             │
├──────────────────────────────────────────────────────────────┤
│ ✓ nome: @IsString() @IsNotEmpty()                            │
│ ✓ unidade_padrao: @IsEnum(UnidadeMedida)                     │
│ ✗ categoria_id: @IsUUID() - validates FORMAT only!           │
│ ✗ No product_type field at all                               │
│ ✗ tags: free-form @IsArray() - no validation on content     │
│ ✗ marca_id: @IsUUID() - validates FORMAT only!               │
│ ✗ codigo_barras: @IsString() - no format validation          │
│ ✗ informacoes_nutricionais: @IsObject() - any shape OK       │
└──────────────────────────────────────────────────────────────┘

LAYER 2: Service Validation (Business Logic)
┌──────────────────────────────────────────────────────────────┐
│ ProdutosService.create()                                     │
├──────────────────────────────────────────────────────────────┤
│ ✓ codigo_barras unique check                                 │
│ ✗ No categoria_id existence check                            │
│ ✗ No marca_id existence check                                │
│ ✗ No product_type validation                                 │
│ ✗ No category food-type validation                           │
│ ✗ No tags content validation                                 │
└──────────────────────────────────────────────────────────────┘

LAYER 3: Database Constraints
┌──────────────────────────────────────────────────────────────┐
│ PostgreSQL/TypeORM                                           │
├──────────────────────────────────────────────────────────────┤
│ ✓ PrimaryKey: id (UUID)                                      │
│ ✓ Unique: codigo_barras (if provided)                        │
│ ✓ Index: codigo_barras                                       │
│ ✗ No product_type enum constraint                            │
│ ✗ No is_food_category flag constraint                        │
│ ✗ Foreign keys NOT enforced (marca_id, categoria_id nullable)│
└──────────────────────────────────────────────────────────────┘

SECURITY GAP: Data can be invalid at all layers!
```

## 5. How Products Enter the System Currently

```
┌─────────────────────────────────────────────────────────────┐
│              PRODUCT DATA FLOW INTO SYSTEM                   │
└─────────────────────────────────────────────────────────────┘

PATH 1: Via Purchases (Compras) - MAIN PATH
──────────────────────────────────────────
User imports receipt
     │
     ├─> QR Scanner captures receipt image
     │       │
     │       └─> Python Scraper (SAT integration)
     │               ├─ Extracts product names
     │               ├─ Extracts quantities
     │               └─ Extracts prices
     │
     └─> POST /api/compras (with itens)
             │
             └─> For each item:
                 ├─ Check: produto_id exists?
                 ├─ If NO: Auto-create produto?
                 │          └─ [Behavior unclear - needs verification]
                 │
                 └─ Create compra_item record
                         ├─ produto_id (UUID)
                         ├─ quantidade
                         ├─ unidade
                         ├─ preco_unitario
                         └─ validade_final (manual or scanned)

PATH 2: Manual Product Registration - NOT IMPLEMENTED
─────────────────────────────────────────────────────
User taps "Add Product" (button doesn't exist)
     │
     └─> POST /api/produtos
             │
             └─> Create produto
                 ├─ nome
                 ├─ categoria_id (optional)
                 ├─ marca_id (optional)
                 └─ other fields

PATH 3: Admin Product Database Seed - POSSIBLE
───────────────────────────────────────────────
Admin loads pre-defined products
     │
     └─> Bulk POST /api/produtos

QUESTION: What happens if compra_item references non-existent product_id?
Answer: Foreign key constraint would fail (or products created on-the-fly?)
```

## 6. Proposed Solution - Three Options Compared

```
┌──────────────────────────────────────────────────────────────┐
│       RESTRICTION IMPLEMENTATION OPTIONS COMPARISON          │
└──────────────────────────────────────────────────────────────┘

OPTION 1: ProductType Enum (DATABASE LEVEL)
────────────────────────────────────────────
Implementation:
├─ Create ProductType enum (25+ food types)
├─ Add product_type column to Produto table
├─ Update DTO with @IsEnum(ProductType)
├─ Add enum check in service
└─ Create migration

Advantages:
✓ Type-safe at database level
✓ Prevents non-food data entry
✓ Searchable/filterable
✓ Future-proof (can add non-food types later)
✓ Easy to audit

Disadvantages:
✗ Requires database migration
✗ Must backfill existing products
✗ Adds API complexity

Restrictiveness: HIGH (blocks non-food at all layers)


OPTION 2: Categoria is_food_category Flag
──────────────────────────────────────────
Implementation:
├─ Add is_food_category boolean to Categoria
├─ Update CategoriaService to set flag
├─ Validate in ProdutosService: categoria.is_food_category = true
├─ Filter UI to show only food categories

Advantages:
✓ Works with existing category system
✓ Admin-controlled (can toggle categories)
✓ No API changes needed
✓ Easy to implement
✓ Smaller migration

Disadvantages:
✗ Category not required (categoria_id nullable)
✗ Can still create product without category
✗ Need to audit existing categories
✗ Harder to enforce

Restrictiveness: MEDIUM (can bypass by omitting category)


OPTION 3: HYBRID APPROACH (RECOMMENDED)
───────────────────────────────────────
Layer 1 - Database (ProductType enum)
├─ All products MUST have product_type
└─ Only food types allowed in enum

Layer 2 - Category (is_food_category flag)
├─ Categories marked as food/non-food
└─ Service validates if category provided

Layer 3 - Service (Dual Validation)
├─ Check product_type is in enum
├─ Check categoria_id exists
├─ Check categoria_id.is_food_category = true
└─ Check barcode uniqueness

Layer 4 - Mobile UI
├─ Only show food categories in dropdowns
├─ Only show food products in searches
└─ Default product_type based on category

ADVANTAGES:
✓ Defense in depth
✓ Type-safe everywhere
✓ Admin control via categories
✓ Future extensible
✓ Data quality guaranteed

DISADVANTAGES:
✗ Requires migration
✗ More code changes
✗ Backfill needed
✗ But worth it for data integrity!

Restrictiveness: MAXIMUM (multi-layer enforcement)
```

## 7. Files That Need Changes

```
┌──────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION IMPACT ANALYSIS                  │
└──────────────────────────────────────────────────────────────┘

PHASE 1: Create ProductType Enum
────────────────────────────────
NEW FILE: /backend/src/common/enums/product-type.enum.ts
├─ Export ProductType enum
├─ Include 25+ food types
└─ Add comments for each type

MODIFY: /backend/src/modules/produtos/entities/produto.entity.ts
├─ Add import: import { ProductType } from '@common/enums/product-type.enum'
├─ Add column: product_type (enum, required)
└─ Update constructor if needed

MODIFY: /backend/src/modules/produtos/dto/create-produto.dto.ts
├─ Add import: import { ProductType } from '@common/enums/product-type.enum'
├─ Add field: @IsEnum(ProductType) product_type
├─ Add @ApiProperty documenting the field
└─ Make field required

MODIFY: /backend/src/modules/produtos/dto/update-produto.dto.ts
├─ Inherits from CreateProdutoDto (PartialType)
├─ product_type becomes optional in updates
└─ No changes needed (auto-inherited)

MODIFY: /backend/src/modules/produtos/produtos.service.ts
├─ Add validation in create():
│  ├─ Verify product_type is in enum
│  ├─ Verify categoria_id exists (if provided)
│  └─ Keep barcode check
│
└─ Add validation in update():
   ├─ Same checks as create()
   └─ Only if fields are being modified

MODIFY: /backend/src/modules/produtos/produtos.controller.ts
├─ No changes needed (DTO validation happens automatically)
└─ Swagger docs auto-generated from DTO

DATABASE MIGRATION: (TypeORM)
├─ Create migration that:
│  ├─ Adds product_type column with enum type
│  ├─ Sets default product_type for existing records
│  │  └─ Could default to PROCESSED or require manual assignment
│  └─ Adds NOT NULL constraint
└─ File: /backend/src/migrations/[timestamp]-add-product-type.ts


PHASE 2: Add Category Food Flag
────────────────────────────────
MODIFY: /backend/src/modules/produtos/entities/categoria.entity.ts
├─ Add column: is_food_category (boolean, default: true)
└─ Consider: is_active, is_visible flags too

MODIFY: /backend/src/modules/produtos/dto/create-categoria.dto.ts
├─ Add field: @IsBoolean() @IsOptional() is_food_category
├─ Set default in schema
└─ Add documentation

MODIFY: /backend/src/modules/produtos/produtos.service.ts
├─ In create(produto):
│  ├─ If categoria_id provided:
│  │  ├─ Fetch categoria
│  │  ├─ Check categoria.is_food_category === true
│  │  └─ Throw error if false
│  └─ Continue with creation
│
├─ In update(produto):
│  └─ Same category checks

DATABASE MIGRATION:
├─ Add is_food_category boolean column
├─ Set default: true
├─ Update: is_food_category = true WHERE categoria_id IS NOT NULL
└─ File: /backend/src/migrations/[timestamp]-add-is-food-category.ts


PHASE 3: Mobile Integration
────────────────────────────
NEW FILE: /mobile/src/screens/ProductCreationScreen.js
├─ Form with product fields
├─ Category dropdown (filtered to is_food_category = true)
├─ ProductType selector (enum options)
├─ Barcode scanner integration
└─ Submit to POST /api/produtos

MODIFY: /mobile/src/services/api.js
├─ Add productsService (uncomment/implement):
│  ├─ async createProduct(data)
│  ├─ async getCategories()
│  ├─ async searchProducts(search)
│  └─ async getProductsByCategory(categoryId)
└─ Add ProductType enum import

MODIFY: /mobile/src/screens/HomeScreen.js
├─ Add button to navigate to ProductCreationScreen
└─ Or implement in PurchaseDetailsScreen for quick add

MODIFY: App.js (Navigation)
├─ Add route: ProductCreationScreen
└─ Add navigation stack if needed


PHASE 4: Test & Documentation
──────────────────────────────
TEST FILES:
├─ /backend/test/produtos.e2e-spec.ts
│  ├─ Test: Cannot create product without product_type
│  ├─ Test: Cannot create with invalid product_type
│  ├─ Test: Cannot create with non-food category
│  └─ Test: Cannot update category to non-food
│
└─ /mobile/src/screens/__tests__/ProductCreationScreen.test.js

DOCUMENTATION:
├─ Update: /backend/README.md
├─ Update: /ARCHITECTURE.md
├─ Create: /backend/PRODUCT-TYPE-SYSTEM.md
└─ Update: /MOBILE_INTEGRATION.md


SUMMARY TABLE:
──────────────
File                                  | Lines | Type    | Status
-------------------------------------------------------------------
product-type.enum.ts                  | 25    | NEW     | To create
produto.entity.ts                      | 5     | MODIFY  | Add field
create-produto.dto.ts                  | 8     | MODIFY  | Add field
update-produto.dto.ts                  | 0     | NONE    | Auto-inherited
produtos.service.ts                    | 15    | MODIFY  | Add validation
produtos.controller.ts                 | 0     | NONE    | Auto-docs
categoria.entity.ts                    | 2     | MODIFY  | Add flag
create-categoria.dto.ts                | 3     | MODIFY  | Add field
[migration-1].ts                       | 20    | NEW     | Create migration
[migration-2].ts                       | 20    | NEW     | Create migration
-------------------------------------------------------------------
Total Changes: ~100 lines of code
Total New Files: 3
Total Migrations: 2
Estimated Time: 2-3 hours implementation + testing
```

## 8. Risk Assessment

```
LOW RISK ITEMS:
├─ Creating new enum (no side effects)
├─ Adding new DTO field (backward compatible if optional)
├─ Adding service validation (improves data quality)
└─ Adding new mobile screen (no existing screens affected)

MEDIUM RISK ITEMS:
├─ Database migrations (can be rolled back)
├─ Adding NOT NULL column (must handle existing data)
├─ Category flag validation (might reject existing data)
└─ Mobile navigation changes

HIGH RISK ITEMS:
├─ None identified if:
   ├─ Migrations are tested first
   ├─ Existing products are backfilled
   ├─ Feature flags used for rollout
   └─ Thorough testing before production

MITIGATION STRATEGIES:
├─ Create migrations with default values
├─ Test migrations on development database
├─ Implement feature flag for new validation
├─ Gradual rollout to mobile app
├─ Monitor error logs for validation failures
└─ Keep rollback plan ready
```

---

## 9. Quick Reference: Where Each Piece Is

```
CATEGORIA LOOKUP TABLE
======================
File                          | Entity Name | Purpose
─────────────────────────────────────────────────────
categoria.entity.ts           | Categoria   | Database entity
create-categoria.dto.ts       | DTO         | API input validation
produtos.service.ts           | Service     | CRUD logic
produtos.controller.ts        | Controller  | API routes

PRODUTO LOOKUP TABLE
====================
File                          | Class Name  | Purpose
─────────────────────────────────────────────────────
produto.entity.ts             | Produto     | Database entity with 20+ fields
create-produto.dto.ts         | DTO         | API input validation (8 fields)
update-produto.dto.ts         | DTO         | Update validation (partial)
produtos.service.ts           | Service     | Business logic (barcode check only)
produtos.controller.ts        | Controller  | 6 endpoints for CRUD

MARCA LOOKUP TABLE
==================
File                          | Class Name  | Purpose
─────────────────────────────────────────────────────
marca.entity.ts               | Marca       | Database entity
create-marca.dto.ts           | DTO         | API input validation

VALIDATION FLOW
===============
Input → DTO Validation → Service Validation → Database → Return

DTO Validation:           Runs first (decorators)
Service Validation:       Checks business rules
Database Validation:      Final constraint check
```

---

## 10. Example: Complete Update Request Flow

```
SCENARIO: User creates product "Arroz Tio João 1kg"
─────────────────────────────────────────────────────

REQUEST (Mobile App)
POST /api/produtos
Content-Type: application/json
Authorization: Bearer {token}
{
  "nome": "Arroz Tio João 1kg",
  "codigo_barras": "7891234567890",
  "marca_id": "123e4567-e89b-12d3-a456-426614174000",
  "categoria_id": "223e4567-e89b-12d3-a456-426614174001",
  "unidade_padrao": "KG",
  "validade_media_dias": 365,
  "tags": ["integral", "grãos", "sem-gluten"],
  "informacoes_nutricionais": {
    "calorias": 130,
    "proteinas": 2.5,
    "carboidratos": 28
  }
}

PROCESSING (Backend)
├─ @Controller receives request
├─ @Post() handler calls service.create(dto)
│
├─ DTO Validation (class-validator)
│  ├─ @IsString() nome ✓ "Arroz Tio João 1kg"
│  ├─ @IsString() codigo_barras ✓ "7891234567890"
│  ├─ @IsUUID() marca_id ✓ valid UUID format
│  ├─ @IsUUID() categoria_id ✓ valid UUID format
│  ├─ @IsEnum(UnidadeMedida) unidade_padrao ✓ KG is in enum
│  ├─ @IsInt() @Min(1) validade_media_dias ✓ 365
│  ├─ @IsArray() tags ✓ array of strings
│  └─ @IsObject() informacoes_nutricionais ✓ object shape ok
│
├─ Service Validation (ProdutosService)
│  ├─ Check: codigo_barras = "7891234567890" already exists?
│  │  └─ Query: SELECT * FROM produtos WHERE codigo_barras = ?
│  │     Result: Not found ✓ OK to proceed
│  │
│  ├─ Check: marca_id exists? (CURRENTLY NOT CHECKED - BUG)
│  │  └─ Optional: Could add validation
│  │
│  └─ Check: categoria_id exists? (CURRENTLY NOT CHECKED - BUG)
│     └─ Optional: Could add validation
│
├─ Database Operation
│  └─ INSERT INTO produtos (nome, codigo_barras, marca_id, ...)
│     VALUES ('Arroz...', '789...', '123...', ...)
│     RETURNING * /* returns all columns */
│
└─ Response (201 Created)
   {
     "id": "uuid-generated",
     "nome": "Arroz Tio João 1kg",
     "codigo_barras": "7891234567890",
     "marca_id": "123e4567-e89b-12d3-a456-426614174000",
     "categoria_id": "223e4567-e89b-12d3-a456-426614174001",
     "unidade_padrao": "KG",
     "validade_media_dias": 365,
     "tags": ["integral", "grãos", "sem-gluten"],
     "informacoes_nutricionais": { ... },
     "criado_em": "2025-11-11T...",
     "atualizado_em": "2025-11-11T..."
   }

CURRENT GAPS IDENTIFIED:
├─ No product_type field
├─ No validation that marca_id exists
├─ No validation that categoria_id exists
├─ No validation that category is food-related
└─ Could register non-food items silently
```

---

## Summary

The CookMe product system is **feature-complete but under-validated**. It supports all necessary relationships (categories, brands, nutritional info) but lacks:

1. **Type Safety**: No ProductType enum to prevent non-food items
2. **Referential Integrity**: No checks that marca_id or categoria_id exist
3. **Category Filtering**: No way to mark categories as food/non-food
4. **Mobile UI**: No product creation screen in the app

The recommended solution is a **hybrid 3-layer approach**:
- ProductType enum (database level)
- is_food_category flag (category level)  
- Service validation (application level)

This ensures food-only compliance at all layers.

