# GUIA DE APRENDIZADO - COOKME
## Do Básico ao Avançado

---

## 📚 ÍNDICE
- [Backend NestJS](#backend-nestjs)
- [Frontend React](#frontend-react)
- [Mobile React Native](#mobile-react-native)
- [Conceitos Transversais](#conceitos-transversais)
- [Princípios de Design (SOLID, DRY, KISS, YAGNI)](#-princípios-de-design-no-cookme)

---

## BACKEND NESTJS

### NÍVEL 1 - FUNDAMENTOS

#### Node.js & TypeScript Basics
- Variáveis, tipos primitivos, interfaces
- Arrow functions, async/await
- Modules (imports/exports)
- Decorators (@Controller, @Module, @Injectable)

#### NestJS Essentials
- Arquitetura de módulos (Module, Controller, Service, Provider)
- Ciclo de vida da aplicação
- Injeção de dependência (Dependency Injection)
- Exemplo: `usuarios.module.ts` → `usuarios.controller.ts` → `usuarios.service.ts`

#### HTTP Basics
- Métodos HTTP (GET, POST, PUT, DELETE)
- Status codes (200, 201, 400, 401, 404, 500)
- Request/Response cycle
- Path parameters vs Query parameters

#### Banco de Dados - PostgreSQL
- Conceitos SQL básicos (SELECT, INSERT, UPDATE, DELETE)
- Tabelas e colunas
- Primary keys e Foreign keys
- WHERE, ORDER BY, LIMIT

---

### NÍVEL 2 - INTERMEDIÁRIO

#### TypeORM - ORM do projeto
- Entities (classes que representam tabelas)
- Decorators: `@Entity`, `@Column`, `@PrimaryGeneratedColumn`
- Relacionamentos: `@OneToMany`, `@ManyToOne`, `@OneToOne`
- Repository pattern (buscar, criar, atualizar, deletar dados)
- Exemplo: `Usuario`, `Produto`, `Receita` entities

#### Controllers & Routes
- Route decorators: `@Get`, `@Post`, `@Put`, `@Delete`
- Path variables: `@Param('id')`
- Body parameters: `@Body()`
- Query parameters: `@Query()`
- Response status: `@HttpCode()`

#### DTOs (Data Transfer Objects)
- Validação com class-validator (`@IsString`, `@IsEmail`, `@IsNumber`)
- Transformação com class-transformer
- Exemplo: `CreateProdutoDTO`, `UpdateUsuarioDTO`

#### Services - Lógica de Negócio
- Separação entre Controller (rotas) e Service (lógica)
- Injeção de repositories
- Métodos para CRUD operations
- Exemplo: `ProdutosService.findAll()`, `UsuariosService.create()`

#### Pipes & Validation
- Global validation pipes
- Validação automática de DTOs
- Transformação de tipos (type: 'uuid')

---

### NÍVEL 3 - AVANÇADO

#### Autenticação & Autorização (JWT)
- JWT tokens (Header.Payload.Signature)
- `@nestjs/jwt` module para geração e verificação
- Passport.js strategies (passport-jwt)
- Fluxo: Login → Gera token → Armazena secret → Verifica em cada requisição
- Exemplo: `AuthController.login()` e `JwtAuthGuard`

#### Guards & Decorators Customizados
- `JwtAuthGuard` - Valida se token é válido
- `RolesGuard` - Valida permissões por role
- Decorators: `@Public()`, `@Roles(UserRole.ADMIN)`, `@CurrentUser()`
- Enums: `UserRole` (ADMIN, USER, PREMIUM, MARCA)

#### Bcrypt - Hashing de Senhas
- Hash one-way (não reversível)
- Salt rounds para segurança
- Comparação de hashes
- Usado em: `auth.service.ts` para armazenar senhas

#### Redis - Cache
- In-memory data store
- Reduz queries ao banco de dados
- Configuração: `cache.config.ts`
- Decorator: `@Cacheable()`, `@CacheEvict()`
- Exemplo: Cachear lista de produtos

#### Relacionamentos Complexos
- OneToMany (Um usuario tem muitos pedidos)
- ManyToOne (Muitos pedidos pertencem a um usuario)
- OneToOne (Usuario tem uma Preferencia)
- Lazy loading vs Eager loading
- Query optimization com joins

#### Migrations - Versionamento do Banco
- Histórico de mudanças no schema
- Comandos: `typeorm migration:generate`, `migration:run`
- Rollback de alterações
- Mantém sincronização entre ambientes

#### Seeding - Dados Iniciais
- População automática do banco
- Scripts em `database/seeds/`
- Exemplo: `seed-categorias-alimentos.ts`, `seed-receitas.ts`
- Usado para ambiente de desenvolvimento e testes

#### Modules Avançados
- Feature modules (cada módulo é auto-contido)
- Imports e Exports de providers
- Module organization: `usuarios.module.ts` importa providers
- 14 módulos no projeto: Auth, Usuarios, Produtos, Receitas, etc

#### Swagger/OpenAPI - Documentação
- `@nestjs/swagger` para auto-documentação
- Decorators: `@ApiOperation`, `@ApiResponse`, `@ApiParam`
- Gera documentação interativa em `/api/docs`
- Teste de endpoints direto na UI

#### Enums & Constants
- `UserRole`: ADMIN, USER, PREMIUM, MARCA
- `UnidadeMedida`: ml, g, kg, l, unidade
- `DificuldadeReceita`: fácil, médio, difícil
- `ProductType`: alimento, bebida, utensílio

#### Testing
- Jest framework
- Testes unitários (services isolados)
- Testes de integração (controllers + services)
- Supertest para testar endpoints HTTP
- Exemplo: `auth.service.spec.ts`, `produtos.service.spec.ts`

#### Tratamento de Erros
- Custom exceptions: `BadRequestException`, `UnauthorizedException`, `NotFoundException`
- Exception filters para resposta customizada
- Logging de erros

#### Performance & Best Practices
- N+1 query prevention (usar eager loading)
- Paginação em listas grandes
- Rate limiting para proteção
- Compression de responses
- Timeouts em requisições externas

#### Integração Google Generative AI
- `@google/generative-ai` para IA
- Classificação de produtos
- Geração de descrições
- Análise de imagens

---

## FRONTEND REACT

### NÍVEL 1 - FUNDAMENTOS

#### JavaScript/TypeScript Basics
- Variáveis (const, let), tipos primitivos
- Arrays e Objects
- Arrow functions, destructuring
- Template literals (backticks)
- Spread operator (...)

#### React Fundamentals
- Components (Functional components)
- JSX - HTML em JavaScript
- Props - Passagem de dados
- State (useState hook)
- Rendering condicional (if, ternary)
- Listas (map, key)

#### Component Structure
- Componentes reutilizáveis
- Props vs State
- Component composition (componentes dentro de componentes)
- Children prop
- Exemplo: `Card.tsx`, `Header.tsx`

#### Hooks Básicos
- `useState` - Gerenciar estado local
- `useEffect` - Side effects (fetch, subscriptions)
- Dependency array ([])
- Cleanup functions

---

### NÍVEL 2 - INTERMEDIÁRIO

#### Routing com React Router
- `BrowserRouter`, `Routes`, `Route`
- Links de navegação
- Path parameters: `/products/:id`
- Query parameters: `?status=active`
- useNavigate, useParams, useLocation hooks
- Exemplo: `ProductsPage.tsx` navega para detalhes

#### Context API - State Management
- Criar context: `createContext`
- Provider: Envolver aplicação
- useContext: Consumir dados
- Exemplo: `AuthContext` (user, token), `ThemeContext` (dark mode)

#### HTTP com Axios
- GET, POST, PUT, DELETE requests
- Base URL configuration
- Request/Response interceptors
- Tratamento de erros
- Exemplo: `authService.ts`, `productsService.ts`

#### Autenticação Frontend
- Storage de tokens (localStorage)
- JWT tokens (access + refresh)
- Interceptor automático de headers
- Redirect para login se não autenticado
- Protected routes com PrivateRoute component

#### Forms & Validation
- Controlled components (input value = state)
- onChange handlers
- Form submission
- Validação básica (required, email, length)
- Modal forms: `UserFormModal.tsx`, `DeleteConfirmationModal.tsx`

#### TypeScript em React
- Tipagem de props: `interface ComponentProps {}`
- Tipagem de state: `useState<Type>()`
- Event types: `React.ChangeEvent<HTMLInputElement>`
- Tipos genéricos: `interface ApiResponse<T> {}`

#### API Services
- Arquivos separados para cada recurso
- Métodos para cada endpoint
- Exemplo: `authService.login()`, `productsService.getAll()`
- Tratamento de erros centralizado

---

### NÍVEL 3 - AVANÇADO

#### Tailwind CSS
- Utility-first CSS (classes pré-definidas)
- Responsive design: `sm:`, `md:`, `lg:`, `xl:`
- Dark mode: `dark:` prefix
- Flexbox: `flex`, `justify-center`, `items-center`
- Grid: `grid`, `grid-cols-3`
- Customização: `tailwind.config.js`
- Exemplo: `Header.tsx`, `Card.tsx` usam classes Tailwind

#### Advanced Hooks
- `useEffect` com dependencies para fetch
- Cleanup (return function em useEffect)
- Custom hooks: `useAuth()`, `useTheme()`
- Hook composition

#### Gerenciamento de Estado Avançado
- Context nesting (múltiplos contexts)
- Reducer pattern (useReducer) para estado complexo
- Performance: `useMemo`, `useCallback`
- Evitar renders desnecessários

#### Protected Routes & Auth Flow
- Verificar autenticação antes de renderizar página
- Redirect automático para login
- Refresh token automático quando expira
- Logout e limpeza de estado

#### Code Splitting & Lazy Loading
- `React.lazy()` para componentes
- `Suspense` para loading state
- Importação dinâmica de módulos
- Melhora performance inicial

#### Vite Build Tool
- Hot Module Replacement (HMR) para desenvolvimento rápido
- Otimização de bundle (minificação, tree-shaking)
- Configuração em `vite.config.ts`
- Environment variables: `.env`, `.env.local`

#### Performance Optimization
- Evitar renders desnecessários com React.memo
- Memoização de callbacks (useCallback)
- Memoização de valores (useMemo)
- Lazy loading de imagens

#### Icon Library - Lucide React
- `<Mail />`, `<Heart />`, `<Settings />` componentes
- Customizar cor e tamanho
- Usado em toda interface

#### Responsive Design
- Mobile-first approach
- Breakpoints: xs, sm, md, lg, xl
- Media queries via Tailwind
- Teste em diferentes resoluções

#### Pages & Layouts
- Layout wrapper para estrutura consistente
- Pages: LoginPage, DashboardPage, ProductsPage, RecipesPage, UsersPage, PurchasesPage, ProfilePage
- Sidebar para navegação
- Header com user info

#### Components Reutilizáveis
- `Card.tsx` - Container genérico
- `Header.tsx` - Cabeçalho da página
- `Sidebar.tsx` - Menu lateral
- `Layout.tsx` - Wrapper de layout
- Modais: DeleteConfirmationModal, UserFormModal
- Popovers: NotificationsPopover, SettingsPopover

#### Dark Mode
- Tema configurado em Context
- Persistência em localStorage
- Toggle em SettingsPopover
- Classes Tailwind `dark:` aplicadas

#### Type Safety
- Interfaces para todas as respostas API
- Tipos genéricos para responses paginadas
- Event types corretos
- Strict TypeScript config

---

## MOBILE REACT NATIVE

### NÍVEL 1 - FUNDAMENTOS

#### React Native Basics
- Componentes: `<View>`, `<Text>`, `<ScrollView>`, `<TouchableOpacity>`
- StyleSheet para performance
- Layouts com Flexbox
- Diferenças vs React web (no div, no CSS direto)

#### JavaScript Fundamentals (para Mobile)
- Async/await para operações
- Array methods (map, filter)
- Object destructuring
- Módulos (import/export)

#### Expo Fundamentals
- Expo Go app para testar rapidamente
- Desenvolvimento sem emular iOS/Android
- EAS Build para builds nativas
- `app.json` configuração

#### SafeAreaContext
- `useSafeAreaInsets()` para evitar notch/status bar
- `SafeAreaView` wrapper
- Padding seguro em telas

#### Platform-Specific Code
- `Platform.select()` para iOS vs Android
- Diferentes estilos/comportamentos
- Teste em ambos os dispositivos

---

### NÍVEL 2 - INTERMEDIÁRIO

#### React Navigation - Navegação
- Stack Navigator (pilha de telas)
- Bottom Tab Navigator (5 abas principais)
- Navigation params: `navigation.navigate('Detail', {id: 1})`
- Back button automático em stack
- Tab switching e state preservation

#### Screens & Navigation Structure
- Auth Stack: LoginScreen, RegisterScreen
- Main Tabs: HomeScreenRecipes, RecipesListScreen, InventoryScreen, FavoritesScreen
- Detail Stack: RecipeDetailsScreen, PurchaseDetailsScreen
- Modal Stack: ProcessingScreen, ResultScreen, CaptchaScreen
- Navegação entre screens

#### HTTP Requests com Axios
- Base URL configuration por environment
- Interceptors para auth tokens
- Error handling
- Timeouts (30 segundos)
- Exemplo: `authService.login()`, `receitasService.getRecipes()`

#### Autenticação Mobile
- Login com email/password
- Tokens armazenados em SecureStore
- Auto-login ao abrir app
- Logout e limpeza
- Token refresh automático

#### Camera & QR Scanner
- `expo-camera` module
- Permissions (iOS e Android)
- QR code scanning
- Flash toggle
- Exemplo: `QRScannerScreen.js` lê código do recibo

#### Secure Storage
- `expo-secure-store` para tokens
- Mais seguro que localStorage
- Criptografia nativa
- Armazenar: `access_token`, `refresh_token`

#### Context API em Mobile
- `AuthContext` para estado do usuário
- Provider no root da aplicação
- `useAuth()` hook customizado
- Compartilhar dados entre screens

#### Forms & Input
- TextInput component
- Form validation
- Keyboard handling
- Submit handlers
- Error messages

#### Loading & Error States
- Loading spinners durante requisições
- Error messages para usuário
- Retry mechanisms
- Empty states quando sem dados

---

### NÍVEL 3 - AVANÇADO

#### Advanced Navigation Patterns
- Nested navigation (tabs dentro de stack)
- Deep linking (URLs para abrir screens)
- Navigation params typing
- Custom header components
- Gestures (swipe back)

#### Camera Advanced
- Permissões diferentes por OS
- Camera vs CameraRoll
- Photo library access
- Privacy considerations

#### State Management em Mobile
- Context vs Redux (projeto usa Context)
- Async operations com Context
- Performance otimization
- Avoid prop drilling com useContext

#### Platform-Specific Optimizations
- iOS Safe Area (notch, home indicator)
- Android back button behavior
- Different screen sizes
- Orientation handling (portrait/landscape)

#### Assets & Resources
- `expo-asset` para imagens/vídeos
- `expo-font` para custom fonts
- Lazy loading de assets
- Resource optimization

#### Styling Mobile
- StyleSheet.create() para performance
- Responsive design (Dimensions API)
- Absolutas vs relatives positioning
- Safe spacing com margins/padding

#### Status Bar
- `expo-status-bar` configuração
- Light vs Dark style
- Appearance em diferentes screens
- Platform differences

#### Navigation Lifecycle
- Screen focusing/blurring
- Cleanup em unmount
- State reset entre navigações
- useFocusEffect hook

#### List Performance
- FlatList vs ScrollView
- Renderização virtualized
- Key em lists
- Pagination para grandes listas

#### Date/Time Handling
- Data expiração (inventário)
- Formatação de datas
- Timestamps
- Timezones

#### Debugging
- React DevTools
- Network tab (ver requisições)
- Console logs
- Expo debugging tools

#### Best Practices
- Evitar renders desnecessários
- Memoização de componentes
- Gerenciar dependencies em useEffect
- Cleanup em unmount
- Memory leaks prevention

---

## CONCEITOS TRANSVERSAIS

### Autenticação & Autorização (em todos os 3)
- JWT tokens (access + refresh)
- Role-based access control (ADMIN, USER, PREMIUM, MARCA)
- Token storage seguro
- Refresh automático quando expira
- Logout e sessão

### API Design
- RESTful endpoints (`/usuarios`, `/produtos/:id`)
- Status codes apropriados
- Request/response standardization
- Error handling consistent
- Pagination para grandes datasets

### Banco de Dados
- Relacionamentos (OneToMany, ManyToOne, OneToOne)
- Constraints e validações
- Migrations para versionamento
- Seeds para dados iniciais
- Índices para performance

### Caching
- Redis em backend
- localStorage em frontend
- SecureStore em mobile
- Invalidação de cache quando necessário

### Tratamento de Erros
- Try/catch em async operations
- Mensagens amigáveis para usuário
- Logging de erros
- Fallbacks graceful

### Performance
- Lazy loading (dados e componentes)
- Paginação
- Caching
- Minificação (build)
- Otimização de imagens

### TypeScript em Todos
- Tipagem de variáveis
- Interfaces para contratos
- Enums para constantes
- Strict mode habilitado
- Type safety prevents bugs

### Testing
- Unit tests (services, utilities)
- Integration tests (endpoints)
- Mock de dados
- Cobertura de casos importantes
- Jest como framework padrão

### Deployment
- Backend: Deploy em servidor Node
- Frontend: Build estático, servir via HTTP
- Mobile: Build APK (Android) ou IPA (iOS)
- Environment variables para diferentes ambientes

---

## 📊 ORDEM SUGERIDA DE APRENDIZADO

### Semana 1-2: Fundamentos Globais
1. TypeScript basics
2. Autenticação & JWT
3. REST API concepts
4. HTTP requests

### Semana 3-4: Backend (NestJS)
1. Node.js & NestJS intro
2. Modules, Controllers, Services
3. DTOs & Validation
4. TypeORM & Database

### Semana 5-6: Frontend (React)
1. React basics (components, hooks)
2. Routing & Navigation
3. Context API
4. Axios & HTTP
5. Tailwind CSS

### Semana 7-8: Mobile (React Native)
1. React Native basics
2. Navigation (React Navigation)
3. Screens & Components
4. APIs & HTTP

### Semana 9-10: Advanced Topics
1. Guards & Decorators (backend)
2. Performance optimization (frontend)
3. Camera & QR Scanner (mobile)
4. Caching & Redis

### Semana 11-12: Integration & Testing
1. Testing frameworks
2. Integration patterns
3. Deployment
4. Performance monitoring

---

## 🔗 ENTENDER FLUXOS PRINCIPAIS

### Fluxo 1: Cadastro de Usuário
1. **Mobile**: RegisterScreen → submitForm
2. **Frontend**: RegisterPage → authService.register()
3. **Backend**: AuthController.register() → AuthService.register() → Salva em DB
4. **Retorno**: Token gerado, armazenado em SecureStore/localStorage

### Fluxo 2: Login de Usuário
1. **Mobile/Frontend**: Submit credenciais
2. **Backend**: Valida email/password, gera JWT token
3. **Retorno**: access_token, refresh_token
4. **Storage**: Armazenado localmente
5. **Uso**: Header `Authorization: Bearer <token>` em todas requisições

### Fluxo 3: Scan QR Code & Processo de Compra
1. **Mobile**: QRScannerScreen capture QR
2. **Backend**: ProcessarQRCode → Scrape data do recibo
3. **Google AI**: Classifica produtos
4. **Database**: Salva compra e produtos
5. **Frontend/Mobile**: Exibe resultado com sugestões

### Fluxo 4: Geração de Receitas
1. **Mobile/Frontend**: Request receitas
2. **Backend**: ReceitasService.getRecipeSuggestions()
3. **Google AI**: Gera receita baseado em inventário
4. **Retorno**: Receita com ingredientes e modo de preparo
5. **UI**: Exibe receita com ingredientes do inventário destacados

### Fluxo 5: Admin Gerencia Produtos
1. **Frontend**: AdminProductsPage
2. **Backend**: AdminController → Lista produtos com filtros
3. **Database**: Query com paginação
4. **UI**: Table com produtos, editar/deletar opções
5. **Update**: Save volta para backend via AdminService

---

## 📝 RESUMO TECH STACK

| Camada | Tecnologias |
|--------|------------|
| **Backend** | NestJS, TypeScript, PostgreSQL, TypeORM, JWT, Redis, Google AI |
| **Frontend** | React, TypeScript, Vite, React Router, Context API, Tailwind CSS, Axios |
| **Mobile** | React Native, Expo, React Navigation, Axios, Secure Storage |
| **Compartilhado** | TypeScript, JWT, REST APIs, Axios, Context/State Management |

---

## 🎯 PRÓXIMOS PASSOS

1. **Escolha uma camada** (Backend, Frontend, ou Mobile)
2. **Estude os fundamentos** da seção NÍVEL 1
3. **Explore o código** dos arquivos correspondentes
4. **Pratica modificando** funcionalidades pequenas
5. **Avanço para NÍVEL 2** e depois NÍVEL 3
6. **Estude os fluxos** para ver tudo integrado

---

## 📐 PRINCÍPIOS DE DESIGN NO COOKME

### O que são Princípios de Design?

São diretrizes fundamentais que tornam o código mais **legível**, **mantível** e **escalável**. O CookMe segue muitos desses princípios:

---

### 1. SOLID

#### Single Responsibility Principle (SRP)

**Conceito**: Uma classe/função deve ter apenas UMA razão para mudar.

**✅ BEM APLICADO no CookMe**:

```typescript
// Backend: AuthService (apenas autenticação)
@Injectable()
export class AuthService {
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Apenas registro
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Apenas login
  }

  private async generateTokens(usuario: Usuario) {
    // Apenas gerar tokens
  }
}

// Frontend: useApi hook (apenas estado de API)
export const useApi = <T,>(apiCall: () => Promise<any>) => {
  const [state, setState] = useState({...});
  // Apenas gerencia estado de requisição
};

// Mobile: Botão (apenas renderizar botão)
export const Button = ({ variant, size, loading, children }) => {
  // Apenas UI, sem lógica
};
```

**❌ PROBLEMA encontrado**:

```typescript
// ProductsPage mistura múltiplas responsabilidades
export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState([]);      // Estado
  const [stats, setStats] = useState(null);          // Estado
  const [loading, setLoading] = useState(true);      // Estado
  const [error, setError] = useState(null);          // Estado
  const [searchTerm, setSearchTerm] = useState('');  // Filtro
  const [categoryFilter, setCategoryFilter] = useState(''); // Filtro
  const [page, setPage] = useState(1);              // Paginação

  // 7 responsabilidades em 1 componente ❌
};
```

**🔧 COMO CORRIGIR**:

```typescript
// Extrair estado em custom hooks
export const useProductFiltering = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {...};
  return { products, loading, error, loadProducts };
};

// Agora ProductsPage é simples
export const ProductsPage = () => {
  const { products, loading, error, loadProducts } = useProductFiltering();
  // SRP respeitado ✅
};
```

**Aprender**: Search "Single Responsibility Principle" + sua linguagem

---

#### Open/Closed Principle (OCP)

**Conceito**: Aberto para EXTENSÃO, fechado para MODIFICAÇÃO.

**✅ BEM APLICADO**:

```typescript
// Button component: extensível via props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; // Fácil adicionar
  size?: 'sm' | 'md' | 'lg'; // Fácil adicionar
}

const variantStyles = {
  primary: '...',
  secondary: '...',
  danger: '...',
  ghost: '...',
  // Novo variant? Apenas add aqui, nenhuma mudança no código
};
```

**❌ PROBLEMA**:

```typescript
// Receita.update() tem que modificar código para cada campo
async update(id: string, updateReceitaDto: UpdateReceitaDto) {
  const receita = await this.findOne(id);

  if (updateReceitaDto.nome !== undefined) receita.nome = updateReceitaDto.nome;
  if (updateReceitaDto.modo_preparo !== undefined) receita.modo_preparo = updateReceitaDto.modo_preparo;
  if (updateReceitaDto.tempo_preparo !== undefined) receita.tempo_preparo = updateReceitaDto.tempo_preparo;
  // 10+ linhas repetidas ❌
}
```

**🔧 COMO CORRIGIR**:

```typescript
async update(id: string, updateReceitaDto: UpdateReceitaDto) {
  const receita = await this.findOne(id);
  Object.assign(receita, updateReceitaDto); // Automático, extensível ✅
  await this.receitaRepository.save(receita);
}
```

**Aprender**: "Open Closed Principle" + TypeScript/JavaScript

---

#### Liskov Substitution Principle (LSP)

**Conceito**: Subclasses podem substituir classes base sem quebrar código.

**✅ BEM APLICADO**:

```typescript
// Guard correto implementa interface
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Pode substituir qualquer AuthGuard
    return super.canActivate(context);
  }
}

// Pode ser usado em qualquer lugar que AuthGuard é esperado
@UseGuards(JwtAuthGuard)
async getProfile() { ... }
```

**Aprender**: "Liskov Substitution Principle" + linguagem

---

#### Interface Segregation Principle (ISP)

**Conceito**: Muitas interfaces específicas > uma interface gigante.

**✅ BEM APLICADO**:

```typescript
// DTOs específicos por caso de uso
export class CreateProdutoDto {
  @IsString() nome: string;
  @IsEnum(ProductType) tipo?: ProductType;
}

export class CreateReceitaDto {
  @IsString() nome: string;
  @IsArray() ingredientes: ReceitaIngredienteDto[]; // DTO separado
}

// Cliente importa apenas o que precisa
import { CreateProdutoDto } from './dto';
```

**Aprender**: "Interface Segregation" + TypeScript interfaces

---

#### Dependency Inversion Principle (DIP)

**Conceito**: Depender de ABSTRAÇÕES, não de implementações concretas.

**✅ BEM APLICADO**:

```typescript
// Backend: Injeção de dependência
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>, // Abstração
    private jwtService: JwtService, // Abstração
    private configService: ConfigService, // Abstração
  ) {}
}

// Frontend: Abstração via Context
const api: AxiosInstance = axios.create({...});
export const authService = {...}; // Componentes dependem disto, não do axios
```

**Aprender**: "Dependency Inversion" + NestJS/React patterns

---

### 2. DRY (Don't Repeat Yourself)

**Conceito**: Código duplicado = bug duplicado. Centralizar lógica comum.

**✅ BEM APLICADO**:

```typescript
// Backend: Token gerado uma vez, reutilizado
private async generateTokens(usuario: Usuario) {
  // Gerado UMA VEZ
  const tokens = await this.jwtService.signAsync({...});
  return tokens;
}

// Reutilizado em register, login, refresh
async register() { return this.generateTokens(...); }
async login() { return this.generateTokens(...); }
async refreshToken() { return this.generateTokens(...); }

// Frontend: Token refresh em um lugar
api.interceptors.response.use((response) => response, async (error) => {
  // Tratado UMA VEZ, automático em todas requisições
  if (error.status === 401) {
    const newToken = await refresh();
    // Retry automática
  }
});
```

**❌ PROBLEMA**:

```typescript
// Dados teste hardcoded em múltiplos lugares
const loadData = async () => {
  try {
    const data = await service.get();
    if (!data) setData([
      { id: '1', nome: 'Leite', dias: 2 },
      { id: '2', nome: 'Ovos', dias: 3 },
    ]); // REPETIDO
  } catch {
    setData([
      { id: '1', nome: 'Leite', dias: 2 },
      { id: '2', nome: 'Ovos', dias: 3 },
    ]); // REPETIDO AGAIN
  }
};
```

**🔧 COMO CORRIGIR**:

```typescript
const DEFAULT_DATA = [
  { id: '1', nome: 'Leite', dias: 2 },
  { id: '2', nome: 'Ovos', dias: 3 },
];

const loadData = async () => {
  try {
    const data = await service.get();
    setData(data?.length > 0 ? data : DEFAULT_DATA);
  } catch {
    setData(DEFAULT_DATA);
  }
};
```

**Regra**: Se código aparece 2+ vezes, extrair para função/constante.

**Aprender**: "DRY principle" + refatoração

---

### 3. KISS (Keep It Simple, Stupid)

**Conceito**: Solução mais SIMPLES é geralmente a MELHOR.

**✅ BEM APLICADO**:

```typescript
// useApi hook: Simples e elegante
export const useApi = <T,>(apiCall: () => Promise<T>) => {
  const [state, setState] = useState({ data: null, loading: false, error: null });

  const call = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await apiCall();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err) {
      setState({ data: null, loading: false, error: err.message });
    }
  }, [apiCall]);

  return { ...state, call };
};

// Sem Redux, Zustand, ou complexidade desnecessária ✅

// Frontend Button: Simples, feito
export const Button = ({ variant = 'primary', size = 'md', ...props }) => {
  const styles = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-400',
  };
  return <button className={styles[variant]} {...props} />;
};
```

**❌ PROBLEMA**:

```typescript
// Mobile StyleSheet com 500+ linhas de estilos repetitivos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF0' },
  headerContainer: { backgroundColor: '#FF8C42', paddingBottom: 0 },
  headerTop: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  appTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileButtonHeader: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  // ... 500+ linhas mais ❌
});

// Poderia usar tema ou helper functions
```

**Princípio**:
- Comece simples
- Só adicione complexidade se REALMENTE precisar
- Leia seu código: se não entender em 10 segundos, é muito complexo

**Aprender**: "KISS principle" + clean code

---

### 4. YAGNI (You Aren't Gonna Need It)

**Conceito**: Não código para possíveis futuros casos de uso. Código para NOW.

**✅ BEM APLICADO**:

```typescript
// Button component: Apenas props necessárias
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Não add props especulativos como:
// - icon?: React.ReactNode;
// - badge?: number;
// - tooltip?: string;
// - disabled?: boolean; (já tem no HTML attributes)
// Isso SÓ se realmente precisar ✅

// Receita entity: Apenas campos usados
@Entity('receitas')
export class Receita {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() nome: string;
  @Column({ type: 'text' }) modo_preparo: string;
  // Não add campos especulativos como:
  // - author_id?
  // - version?
  // - deprecated_at?
}
```

**❌ PROBLEMA**:

```typescript
// Sugestões de receitas com implementação incompleta
async sugerirReceitas(usuarioId: string): Promise<Receita[]> {
  // TODO: Implementar Motor MOI v1 completo
  // Por enquanto, retorna receitas randômicas
  return this.receitaRepository.find({...});
}

// Essa função YAGNI: foi criada para um futuro
// que talvez nunca chegue ❌
```

**🔧 COMO CORRIGIR**:

```typescript
// Remover até realmente precisar
// Se futuramente precisar, fazer então com requisitos claros

// Mobile: Config com código comentado
// export const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Comentado
// export const API_BASE_URL = 'http://localhost:3000/api'; // Comentado

// Melhor: Usar environment variables, não código comentado
```

**Regra**:
- ✅ Implemente features que REALMENTE precisam agora
- ❌ Não crie especulativamente para "pode ser útil depois"
- ❌ Não deixe código comentado "para depois"

Se precisar: delete e re-implementa quando chegar na hora.

**Aprender**: "YAGNI principle" + agile development

---

### Tabela: Estado do CookMe

| Princípio | Status | Exemplos Bons | Melhorar |
|-----------|--------|---------------|----------|
| **SRP** | 🟢 Bom | AuthService, Controllers, useApi | ProductsPage complexo |
| **OCP** | 🟢 Bom | Button variants, DTOs | Receita.update hardcoded |
| **LSP** | 🟢 Bom | Guards, Context | Mobile fallbacks |
| **ISP** | 🟢 Bom | Específicos DTOs | adminService mixing |
| **DIP** | 🟢 Bom | Service injection | ProductsPage dependencies |
| **DRY** | 🟢 Bom | Token generation | Mobile test data duplicate |
| **KISS** | 🟢 Muito Bom | useApi, Button, Card | Mobile StyleSheet |
| **YAGNI** | 🟡 OK | Minimal props | sugerirReceitas TODO |

---

### ✅ Checklist ao Programar em CookMe

```
□ SRP: Essa classe/função tem apenas UMA responsabilidade?
□ OCP: Posso adicionar novo caso sem modificar código antigo?
□ LSP: Posso substituir essa classe por outra sem quebrar?
□ ISP: Interfaces específicas ou misturando tudo?
□ DIP: Dependo de abstrações ou implementações concretas?

□ DRY: Esse código aparece 2+ vezes?
□ KISS: Existe forma mais simples de fazer?
□ YAGNI: Realmente preciso isso AGORA ou é especulativo?

□ Testes: Posso testar fácil?
□ Legibilidade: Entendo em 10 segundos?
□ Manutenção: Fácil achar e corrigir bugs?
```

---

### Recursos para Aprender Mais

- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID
- **Clean Code by Robert Martin**: Livro essencial
- **Refactoring by Martin Fowler**: Técnicas práticas
- **Design Patterns**: https://refactoring.guru/design-patterns

---

**Última atualização:** 2026-01-28
**Projeto:** CookMe - Inventory Optimization System
