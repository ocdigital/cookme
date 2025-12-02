# Backend File Structure Reference

## Directory Organization

```
backend/
├── src/
│   ├── app.module.ts                     - Root app module
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── main.ts                           - Application bootstrap
│   │
│   ├── common/                           - Shared utilities
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts       - @Public() mark routes as public
│   │   │   ├── roles.decorator.ts        - @Roles() role-based access
│   │   │   ├── current-user.decorator.ts - @CurrentUser() inject user
│   │   │   └── index.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         - Global JWT protection
│   │   │   ├── roles.guard.ts            - Role-based authorization
│   │   │   └── index.ts
│   │   └── enums/
│   │       ├── user-role.enum.ts         - USER, PREMIUM, ADMIN, MARCA
│   │       ├── dificuldade-receita.enum.ts - FACIL, MEDIA, DIFICIL
│   │       ├── unidade-medida.enum.ts    - UN, G, ML, KG, L, etc.
│   │       ├── metodo-cadastro.enum.ts   - MANUAL, OCR, BARCODE
│   │       └── index.ts
│   │
│   ├── config/                           - Configuration files
│   │   ├── app.config.ts                 - Application settings
│   │   ├── database.config.ts            - PostgreSQL/TypeORM setup
│   │   ├── jwt.config.ts                 - JWT configuration
│   │   └── index.ts
│   │
│   ├── database/
│   │   ├── migrations/                   - Database migrations (empty)
│   │   ├── seeds/
│   │   │   ├── seed.ts                   - Main seed file
│   │   │   ├── seed-food-categories.ts   - Food category seeds
│   │   │   └── verify-categories.ts      - Verify seed data
│   │   └── index.ts
│   │
│   └── modules/                          - Feature modules
│       │
│       ├── auth/                         - Authentication
│       │   ├── auth.controller.ts        - Register, Login, Refresh, Logout
│       │   ├── auth.service.ts           - JWT token generation, password hashing
│       │   ├── auth.module.ts
│       │   ├── dto/
│       │   │   ├── login.dto.ts
│       │   │   ├── register.dto.ts
│       │   │   ├── refresh-token.dto.ts
│       │   │   └── auth-response.dto.ts
│       │   └── strategies/
│       │       ├── jwt.strategy.ts       - Passport JWT strategy
│       │       └── index.ts
│       │
│       ├── usuarios/                     - User management
│       │   ├── usuarios.controller.ts    - Profile, Preferences
│       │   ├── usuarios.service.ts
│       │   ├── usuarios.module.ts
│       │   ├── entities/
│       │   │   ├── usuario.entity.ts     - User table schema
│       │   │   └── preferencia.entity.ts - Food preferences
│       │   └── dto/
│       │       ├── update-usuario.dto.ts
│       │       └── update-preferencia.dto.ts
│       │
│       ├── produtos/                     - Product catalog
│       │   ├── produtos.controller.ts    - CRUD for products, brands, categories
│       │   ├── produtos.service.ts
│       │   ├── produtos.module.ts
│       │   ├── entities/
│       │   │   ├── produto.entity.ts     - Product table (with nutritional info)
│       │   │   ├── categoria.entity.ts   - Category table (hierarchical)
│       │   │   └── marca.entity.ts       - Brand table
│       │   └── dto/
│       │       ├── create-produto.dto.ts
│       │       ├── update-produto.dto.ts
│       │       ├── create-categoria.dto.ts
│       │       └── create-marca.dto.ts
│       │
│       ├── compras/                      - Purchase management
│       │   ├── compras.controller.ts     - Record, List, Stats
│       │   ├── compras.service.ts
│       │   ├── compras.module.ts
│       │   ├── entities/
│       │   │   ├── compra.entity.ts      - Purchase table
│       │   │   └── compra-item.entity.ts - Purchase line items
│       │   └── dto/
│       │       └── create-compra.dto.ts
│       │
│       ├── inventario/                   - Food inventory
│       │   ├── inventario.controller.ts  - Add, List, Expiry alerts
│       │   ├── inventario.service.ts
│       │   ├── inventario.module.ts
│       │   ├── entities/
│       │   │   └── inventario.entity.ts  - Inventory table (with expiry tracking)
│       │   └── dto/
│       │       ├── create-inventario.dto.ts
│       │       └── update-inventario.dto.ts
│       │
│       ├── receitas/                     - Recipes
│       │   ├── receitas.controller.ts    - CRUD, Suggestions, History
│       │   ├── receitas.service.ts       - MOI Engine
│       │   ├── receitas.module.ts
│       │   ├── entities/
│       │   │   ├── receita.entity.ts     - Recipe table
│       │   │   ├── receita-ingrediente.entity.ts - Recipe ingredients
│       │   │   └── receita-executada.entity.ts - Recipe history
│       │   └── dto/
│       │       ├── create-receita.dto.ts
│       │       └── executar-receita.dto.ts
│       │
│       ├── scraper/                      - OCR receipt scanning
│       │   ├── scraper.controller.ts     - Start OCR, Check status, CAPTCHA
│       │   ├── scraper.service.ts        - Session management, OCR logic
│       │   ├── scraper.module.ts
│       │   ├── interfaces/
│       │   │   └── scraper-session.interface.ts - Session types
│       │   └── dto/
│       │       ├── iniciar-consulta.dto.ts
│       │       └── captcha-resolvido.dto.ts
│       │
│       ├── barcode/                      - Barcode scanning
│       │   ├── barcode.controller.ts     - Barcode lookup
│       │   ├── barcode.service.ts
│       │   └── barcode.module.ts
│       │
│       ├── product-classification/       - AI classification
│       │   ├── controllers/
│       │   │   └── product-classification.controller.ts
│       │   ├── services/
│       │   │   ├── product-classification.service.ts
│       │   │   └── intelligent-inventory.service.ts
│       │   ├── product-classification.module.ts
│       │   ├── entities/
│       │   │   ├── product-knowledge-base.entity.ts - Classification cache
│       │   │   ├── ai-classification-log.entity.ts - API logs
│       │   │   └── product-validation.entity.ts - User validations
│       │   └── dto/
│       │       └── (DTOs as needed)
│       │
│       └── affiliate/                    - Affiliate & Subscriptions
│           ├── affiliate.controller.ts   - Clicks, Links, Recommendations, Subscriptions
│           ├── services/
│           │   ├── affiliate.service.ts
│           │   ├── recommendation.service.ts
│           │   └── subscription.service.ts
│           ├── affiliate.module.ts
│           ├── entities/
│           │   ├── affiliate-link.entity.ts
│           │   ├── affiliate-click.entity.ts
│           │   ├── affiliate-conversion.entity.ts
│           │   ├── recipe-recommendation.entity.ts
│           │   ├── subscription.entity.ts
│           │   └── transaction.entity.ts
│           └── dto/
│               └── (DTOs as needed)
│
├── package.json                          - Dependencies
├── package-lock.json
├── tsconfig.json                         - TypeScript configuration
├── nest-cli.json                         - NestJS CLI config
├── .env (not in repo)                    - Environment variables
├── .env.example                          - Environment template
└── README.md                              - Backend documentation

```

## Key File Locations for Admin Dashboard Development

### Authentication & Authorization
- `/src/modules/auth/` - Login/Register logic
- `/src/common/guards/jwt-auth.guard.ts` - JWT protection
- `/src/common/guards/roles.guard.ts` - Role-based access
- `/src/common/decorators/` - Custom decorators

### Database Models
- `/src/modules/usuarios/entities/usuario.entity.ts` - User model
- `/src/modules/produtos/entities/` - Product models
- `/src/modules/compras/entities/` - Purchase models
- `/src/modules/inventario/entities/inventario.entity.ts` - Inventory
- `/src/modules/receitas/entities/` - Recipe models
- `/src/modules/affiliate/entities/` - Subscription/Affiliate models

### Controllers (API Endpoints)
- `/src/modules/usuarios/usuarios.controller.ts` - User endpoints
- `/src/modules/produtos/produtos.controller.ts` - Product endpoints
- `/src/modules/compras/compras.controller.ts` - Purchase endpoints
- `/src/modules/inventario/inventario.controller.ts` - Inventory endpoints
- `/src/modules/receitas/receitas.controller.ts` - Recipe endpoints
- `/src/modules/affiliate/affiliate.controller.ts` - Monetization endpoints
- `/src/modules/product-classification/controllers/` - Classification endpoints

### Services (Business Logic)
- `/src/modules/*/` - Each module has a `.service.ts` file
- These contain the actual business logic for each domain

### Configuration
- `/src/config/database.config.ts` - Database connection
- `/src/config/jwt.config.ts` - JWT settings
- `/src/config/app.config.ts` - App settings
- `/src/main.ts` - Bootstrap and middleware setup

### Types & Enums
- `/src/common/enums/` - All enumeration types
  - `user-role.enum.ts` - USER, PREMIUM, ADMIN, MARCA
  - `dificuldade-receita.enum.ts` - Recipe difficulty
  - `unidade-medida.enum.ts` - Units of measurement
  - `metodo-cadastro.enum.ts` - Registration methods

## Data Flow Example (User Registration)

```
1. Client POST /api/auth/register
   ↓
2. AuthController.register() [/src/modules/auth/auth.controller.ts]
   ↓
3. AuthService.register() [/src/modules/auth/auth.service.ts]
   ├── Hash password with bcrypt
   ├── Save user to database via UsuarioRepository
   ├── Generate JWT tokens
   └── Save refresh token to DB
   ↓
4. Return AuthResponseDto with tokens and user object
```

## Key Patterns Used

### 1. Entity → DTO Pattern
```
Entity (database schema) → Service (business logic) → Controller (HTTP) → DTO (response)
```

### 2. Dependency Injection
```typescript
constructor(
  @InjectRepository(Usuario)
  private readonly usuarioRepository: Repository<Usuario>,
  private readonly authService: AuthService,
) {}
```

### 3. Custom Decorators
```typescript
@Public() // Mark route as public
@Roles(UserRole.ADMIN) // Require admin role
@CurrentUser() user: Usuario // Inject current user
```

### 4. Guards for Security
```typescript
@UseGuards(JwtAuthGuard) // Verify JWT token
@UseGuards(RolesGuard) // Check user roles
```

## Adding Admin Features

### To Add Admin User Listing:

1. **Add endpoint to controller:**
```typescript
// /src/modules/usuarios/usuarios.controller.ts
@Get('admin/all')
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
async getAllUsers() {
  return this.usuariosService.findAllUsers();
}
```

2. **Add method to service:**
```typescript
// /src/modules/usuarios/usuarios.service.ts
async findAllUsers(): Promise<Usuario[]> {
  return this.usuarioRepository.find();
}
```

3. **Add DTO if needed:**
```typescript
// /src/modules/usuarios/dto/list-users.dto.ts
export class ListUsersDto {
  role?: UserRole;
  search?: string;
  limit?: number;
  offset?: number;
}
```

This pattern applies to all new admin features!

