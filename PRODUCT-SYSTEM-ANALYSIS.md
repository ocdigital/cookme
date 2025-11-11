# CookMe Codebase Analysis: Product Registration & Categorization

## Executive Summary

The CookMe application has a complete product registration system with categories and hierarchical support. Products are currently **unrestricted** and can be of any type. The system supports food items implicitly (through categories like "Grãos", "Laticínios") but lacks explicit type restrictions.

---

## A) Current Product Registration Flow

### 1. **Backend Flow (NestJS)**

#### Entry Point: `ProdutosController`
- **File:** `/backend/src/modules/produtos/produtos.controller.ts`
- **Endpoint:** `POST /produtos`
- **Handler:** `create(createProdutoDto: CreateProdutoDto)`

#### Business Logic: `ProdutosService`
- **File:** `/backend/src/modules/produtos/produtos.service.ts`
- **Method:** `async create(createProdutoDto: CreateProdutoDto): Promise<Produto>`

**Current Validation:**
```typescript
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  // Only validates: codigo_barras uniqueness
  if (createProdutoDto.codigo_barras) {
    const existing = await this.produtoRepository.findOne({
      where: { codigo_barras: createProdutoDto.codigo_barras },
    });
    if (existing) {
      throw new ConflictException('Código de barras já cadastrado');
    }
  }
  
  const produto = this.produtoRepository.create(createProdutoDto);
  return this.produtoRepository.save(produto);
}
```

**Key Point:** No validation on category type or product type restrictions!

#### DTO: `CreateProdutoDto`
- **File:** `/backend/src/modules/produtos/dto/create-produto.dto.ts`
- **Required Fields:**
  - `nome` (string, required)
  - `unidade_padrao` (enum: UnidadeMedida, required)

**Optional Fields:**
  - `codigo_barras` (string, unique)
  - `marca_id` (UUID)
  - `categoria_id` (UUID) ← **Category assignment**
  - `descricao` (string)
  - `validade_media_dias` (number)
  - `informacoes_nutricionais` (JSON object)
  - `tags` (string array)
  - `alternativas_ids` (string array)

---

### 2. **Mobile App Flow (React Native)**

**Current State:** No product creation screen exists in the mobile app
- **Screens Present:** HomeScreen, QRScannerScreen, HistoryScreen, PurchaseDetailsScreen, LoginScreen, etc.
- **No:** Product registration/creation UI
- **How Products Enter System:** Via purchases (compras) import from receipts

**Purchase Items Display:** `PurchaseDetailsScreen.js`
```javascript
const renderItemCard = ({ item }) => (
  <View style={styles.itemCard}>
    <Text style={styles.itemName}>{item.produto?.nome || 'Produto desconhecido'}</Text>
    <Text style={styles.itemCode}>Código: {item.produto?.codigo_barras || 'N/A'}</Text>
    // Shows: produto.nome, produto.codigo_barras, quantidade, unidade
  </View>
);
```

**API Service:** `/mobile/src/services/api.js`
- Has `productsService` (commented/missing)
- Uses `comprasService`, `inventarioService`, `receitasService`
- No dedicated product management endpoints called from mobile

---

## B) Product Structure & Category System

### 1. **Produto Entity Structure**

**File:** `/backend/src/modules/produtos/entities/produto.entity.ts`

```typescript
@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true, unique: true })
  @Index()
  codigo_barras: string;

  @Column({ nullable: true })
  codigo_interno: string;

  @Column('uuid', { nullable: true })
  marca_id: string;

  @Column('uuid', { nullable: true })
  categoria_id: string;  // ← Category relationship

  @Column({
    type: 'enum',
    enum: UnidadeMedida,
    default: UnidadeMedida.UN,
  })
  unidade_padrao: UnidadeMedida;

  @Column({ type: 'int', nullable: true })
  validade_media_dias: number;

  @Column({ nullable: true })
  imagem_url: string;

  @Column({ type: 'jsonb', nullable: true })
  informacoes_nutricionais: {
    calorias?: number;
    proteinas?: number;
    carboidratos?: number;
    gorduras?: number;
    fibras?: number;
    sodio?: number;
    acucares?: number;
  };

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('simple-array', { nullable: true })
  alternativas_ids: string[];

  @Column({ default: 'manual' })
  origem: string; // manual, api_externa, usuario, marca

  @Column({ default: false })
  verificado: boolean;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;

  // Relationships
  @ManyToOne(() => Marca, (marca) => marca.produtos, { nullable: true })
  @JoinColumn({ name: 'marca_id' })
  marca: Marca;

  @ManyToOne(() => Categoria, (categoria) => categoria.produtos, { nullable: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @OneToMany(() => CompraItem, (item) => item.produto)
  compra_itens: CompraItem[];

  @OneToMany(() => Inventario, (inventario) => inventario.produto)
  inventario: Inventario[];

  @OneToMany(() => ReceitaIngrediente, (ingrediente) => ingrediente.produto)
  receita_ingredientes: ReceitaIngrediente[];
}
```

### 2. **Categoria Entity Structure**

**File:** `/backend/src/modules/produtos/entities/categoria.entity.ts`

```typescript
@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  icone: string; // Nome do ícone (ex: "apple", "meat", "dairy")

  // Category hierarchy support
  @Column('uuid', { nullable: true })
  categoria_pai_id: string;

  @CreateDateColumn()
  criado_em: Date;

  // Relationships
  @ManyToOne(() => Categoria, (categoria) => categoria.subcategorias, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoria_pai_id' })
  categoria_pai: Categoria;

  @OneToMany(() => Categoria, (categoria) => categoria.categoria_pai)
  subcategorias: Categoria[];

  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos: Produto[];
}
```

### 3. **Marca Entity Structure**

**File:** `/backend/src/modules/produtos/entities/marca.entity.ts`

```typescript
@Entity('marcas')
export class Marca {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nome: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  site: string;

  @Column({ default: false })
  parceiro_patrocinio: boolean; // Sponsorship system

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;

  @OneToMany(() => Produto, (produto) => produto.marca)
  produtos: Produto[];
}
```

### 4. **API Endpoints for Product Management**

**File:** `/backend/src/modules/produtos/produtos.controller.ts`

#### Products
- `POST /produtos` - Create product
- `GET /produtos` - List products (supports search & categoriaId filter)
- `GET /produtos/barcode/:codigo` - Search by barcode
- `GET /produtos/:id` - Get product by ID
- `PATCH /produtos/:id` - Update product
- `DELETE /produtos/:id` - Delete product

#### Brands
- `POST /produtos/marcas` - Create brand
- `GET /produtos/marcas/all` - List all brands
- `GET /produtos/marcas/:id` - Get brand by ID

#### Categories
- `POST /produtos/categorias` - Create category
- `GET /produtos/categorias/all` - List all categories (with hierarchy)
- `GET /produtos/categorias/:id` - Get category by ID

---

## C) Existing Filters & Validations on Product Types

### 1. **Current Status: NONE**

The product system has:
- ✅ **Barcode uniqueness validation** (prevents duplicates)
- ✅ **Category association support** (but not enforced)
- ✅ **Optional tags system** (free-form text array)
- ✅ **Origin tracking** (manual, api_externa, usuario, marca)
- ❌ **NO type restrictions**
- ❌ **NO food-specific validation**
- ❌ **NO category whitelist/enforcement**
- ❌ **NO tags validation**

### 2. **DTO Validation**

**CreateProdutoDto** uses `class-validator`:
```typescript
@IsString()
@IsNotEmpty()
nome: string; // Required: any string

@IsUUID()
@IsOptional()
categoria_id?: string; // Optional: any UUID (no validation that category exists or is food-related)

@IsEnum(UnidadeMedida)
unidade_padrao: UnidadeMedida; // Required: from enum (food-related units: KG, G, ML, L, UN, etc)

@IsArray()
@IsOptional()
tags?: string[]; // Optional: any strings (no validation)
```

### 3. **Service Validation**

```typescript
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  // ONLY checks barcode uniqueness
  if (createProdutoDto.codigo_barras) {
    const existing = await this.produtoRepository.findOne({
      where: { codigo_barras: createProdutoDto.codigo_barras },
    });
    if (existing) {
      throw new ConflictException('Código de barras já cadastrado');
    }
  }
  // No other validation - saves directly
  const produto = this.produtoRepository.create(createProdutoDto);
  return this.produtoRepository.save(produto);
}
```

---

## D) Suggestions for Restricting to Food Items Only

### **Option 1: Enum-Based Product Type System** (RECOMMENDED)
Create a ProductType enum to restrict at the schema level:

**Implementation:**
1. Create `ProductType` enum in `/backend/src/common/enums/product-type.enum.ts`:
```typescript
export enum ProductType {
  // Food
  GRAINS = 'grains',
  DAIRY = 'dairy',
  MEAT = 'meat',
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  BEVERAGES = 'beverages',
  CONDIMENTS = 'condiments',
  SNACKS = 'snacks',
  FROZEN = 'frozen',
  CANNED = 'canned',
  OILS_FATS = 'oils_fats',
  SWEETENERS = 'sweeteners',
  SPICES = 'spices',
  ORGANIC = 'organic',
  SUPPLEMENTS = 'supplements',
}
```

2. Add to `Produto` entity:
```typescript
@Column({
  type: 'enum',
  enum: ProductType,
  nullable: false, // Required for all products
})
product_type: ProductType;
```

3. Update `CreateProdutoDto`:
```typescript
@ApiProperty({
  description: 'Tipo de produto (alimentos apenas)',
  enum: ProductType,
  example: ProductType.GRAINS,
})
@IsEnum(ProductType)
product_type: ProductType; // Required
```

4. Add to service:
```typescript
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  // Existing barcode check...
  
  // Validate product type is food-related
  const foodTypes = Object.values(ProductType);
  if (!foodTypes.includes(createProdutoDto.product_type)) {
    throw new BadRequestException('Apenas alimentos são permitidos');
  }
  
  // Continue with creation...
}
```

**Advantages:**
- Type-safe at database level
- Easy to add non-food types later if needed
- Searchable/filterable

---

### **Option 2: Category Whitelist Validation** (COMPLEMENTARY)
Restrict categoria_id to food-related categories:

**Implementation:**
1. Add `is_food_category` flag to `Categoria` entity:
```typescript
@Column({ default: true })
is_food_category: boolean;
```

2. Update service to validate:
```typescript
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  if (createProdutoDto.categoria_id) {
    const categoria = await this.categoriaRepository.findOne({
      where: { id: createProdutoDto.categoria_id },
    });
    
    if (!categoria || !categoria.is_food_category) {
      throw new BadRequestException(
        'Categoria deve ser de alimentos'
      );
    }
  }
  
  // Continue...
}
```

**Advantages:**
- Works with existing category system
- Can dynamically whitelist/blacklist categories
- Admin-controllable

---

### **Option 3: Hybrid Approach** (BEST PRACTICE)

Combine both for maximum safety:

1. **Database Level:** ProductType enum (prevents invalid data at source)
2. **Category Level:** is_food_category flag (ensures semantic correctness)
3. **Service Level:** Dual validation (defense in depth)
4. **Mobile Level:** Only show food categories in UI dropdowns

**Implementation Flow:**
```
User selects category (mobile UI shows only is_food_category = true)
    ↓
POST /produtos with product_type (enum) + categoria_id
    ↓
DTO validation (class-validator checks enum)
    ↓
Service validation:
  - Verify categoria_id is food-related
  - Verify product_type is in allowed enum
  - Check barcode uniqueness
    ↓
Database insert (with ProductType enum constraint)
```

---

## E) Key Files Summary

### Backend (Product System)

| File | Purpose | Key Content |
|------|---------|------------|
| `/backend/src/modules/produtos/entities/produto.entity.ts` | Product model | Fields, relationships, no type restrictions |
| `/backend/src/modules/produtos/entities/categoria.entity.ts` | Category model | Hierarchical structure, no food-flag |
| `/backend/src/modules/produtos/entities/marca.entity.ts` | Brand model | Simple: name, logo, website |
| `/backend/src/modules/produtos/dto/create-produto.dto.ts` | Create validation | DTO validators - no product type check |
| `/backend/src/modules/produtos/dto/create-categoria.dto.ts` | Category DTO | Simple: nome, icone, parent_id |
| `/backend/src/modules/produtos/produtos.service.ts` | Business logic | Barcode check only - no type validation |
| `/backend/src/modules/produtos/produtos.controller.ts` | API routes | 12 endpoints for CRUD operations |

### Mobile (Product Display)

| File | Purpose | Key Content |
|------|---------|------------|
| `/mobile/src/services/api.js` | API client | No product endpoints called |
| `/mobile/src/screens/PurchaseDetailsScreen.js` | Purchase display | Shows produto.nome, codigo_barras |
| `/mobile/src/screens/HomeScreen.js` | Dashboard | Displays products from inventory |

---

## F) Recommended Action Plan

### Phase 1: Immediate (Add Type Restriction)
1. Create `ProductType` enum ✅
2. Add `product_type` field to `Produto` entity
3. Update `CreateProdutoDto` with `product_type` field
4. Add validation in `ProdutosService.create()`
5. Create database migration

### Phase 2: Enhancement (Category Flag)
1. Add `is_food_category` boolean to `Categoria` entity
2. Update `CategoriaService` to validate flag
3. Add validation in `ProdutosService.create()` to check category flag

### Phase 3: Mobile Integration
1. Create product creation screen (if needed)
2. Filter category dropdown to show only food categories
3. Set default ProductType based on selected category

### Phase 4: Data Cleanup
1. Audit existing products for invalid types
2. Assign ProductType to existing records
3. Update categories with is_food_category flag

---

## G) Code Examples Ready to Implement

### Create ProductType Enum
```typescript
// /backend/src/common/enums/product-type.enum.ts
export enum ProductType {
  // Staples
  GRAINS = 'grains',
  LEGUMES = 'legumes',
  OILS_FATS = 'oils_fats',
  SPICES = 'spices',
  
  // Proteins
  MEAT = 'meat',
  DAIRY = 'dairy',
  EGGS = 'eggs',
  
  // Fresh
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  HERBS = 'herbs',
  
  // Prepared
  FROZEN = 'frozen',
  CANNED = 'canned',
  PROCESSED = 'processed',
  
  // Beverages
  WATER = 'water',
  JUICE = 'juice',
  COFFEE_TEA = 'coffee_tea',
  MILK = 'milk',
  ALCOHOL = 'alcohol',
  
  // Other
  SUPPLEMENTS = 'supplements',
  CONDIMENTS = 'condiments',
  SNACKS = 'snacks',
}
```

### Updated Produto Entity
```typescript
@Column({
  type: 'enum',
  enum: ProductType,
  nullable: false,
})
product_type: ProductType;
```

### Updated CreateProdutoDto
```typescript
@ApiProperty({
  description: 'Tipo de produto',
  enum: ProductType,
  example: ProductType.GRAINS,
})
@IsEnum(ProductType)
product_type: ProductType;
```

### Service Validation
```typescript
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  // Validate barcode uniqueness
  if (createProdutoDto.codigo_barras) {
    const existing = await this.produtoRepository.findOne({
      where: { codigo_barras: createProdutoDto.codigo_barras },
    });
    if (existing) {
      throw new ConflictException('Código de barras já cadastrado');
    }
  }

  // Validate category if provided
  if (createProdutoDto.categoria_id) {
    const categoria = await this.categoriaRepository.findOne({
      where: { id: createProdutoDto.categoria_id },
    });
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }
    // Optional: Add is_food_category check when implemented
  }

  const produto = this.produtoRepository.create(createProdutoDto);
  return this.produtoRepository.save(produto);
}
```

