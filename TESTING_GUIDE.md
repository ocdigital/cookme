# 📚 Guia de Testes - CookMe

## Como continuar os testes que comecei para você

Este guia explica como rodar, completar e criar novos testes no projeto CookMe. Use como referência enquanto aprende!

---

## ✅ O que já foi criado

```
✅ backend/src/modules/auth/auth.service.spec.ts
   └─ Testes unitários do AuthService
   └─ Contém: 5 testes funcionando + 5 TODOs comentados

✅ backend/src/modules/auth/auth.controller.spec.ts
   └─ Testes de integração do AuthController
   └─ Contém: 5 testes funcionando + 5 TODOs comentados
```

---

## 🚀 Como rodar os testes

### Rodar TODOS os testes
```bash
npm test
```

### Rodar APENAS auth (recomendado durante desenvolvimento)
```bash
npm test -- auth
```

### Rodar com WATCH (recarrega automaticamente)
```bash
npm test -- auth --watch
```

### Rodar com COBERTURA
```bash
npm test -- auth --coverage
```

Exemplo de output esperado:
```
PASS  src/modules/auth/auth.service.spec.ts (1.234 s)
  AuthService
    register
      ✓ deve registrar um novo usuário com sucesso (123 ms)
    login
      ✓ deve fazer login com sucesso (45 ms)
    refreshToken
      ✓ deve renovar o access token com sucesso (78 ms)
    ...
```

---

## 📋 Tarefas para você completar

### FASE 1: Complete os TODOs (Auth Module)

#### 1️⃣ **auth.service.spec.ts** - 5 testes faltando

Abra o arquivo e procure por:
```typescript
/**
 * CONTINUE: Adicione este teste você mesmo!
 *
 * TODO: Escreva um teste para o caso de EMAIL JÁ EXISTIR
```

**Testes a completar:**
1. Register - Email já existe (ConflictException)
2. Login - Usuário não encontrado (UnauthorizedException)
3. Login - Senha incorreta
4. RefreshToken - Token inválido
5. RefreshToken - Token não corresponde ao BD
6. ValidateUser - Usuário não encontrado

**Tempo estimado:** 30-45 minutos

#### 2️⃣ **auth.controller.spec.ts** - 5 testes faltando

**Testes a completar:**
1. Register - Email já existe (409 Conflict)
2. Register - Dados inválidos
3. Login - Credenciais inválidas (401 Unauthorized)
4. Login - Email não encontrado
5. RefreshToken - Token inválido
6. RefreshToken - Token expirado
7. Logout - Usuário não autenticado
8. GetProfile - Sem autenticação

**Tempo estimado:** 30-45 minutos

---

### FASE 2: Testes de Integração E2E (Auth)

Crie um arquivo novo: `backend/src/modules/auth/auth.e2e-spec.ts`

```typescript
// TEMPLATE para E2E
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Importa app REAL (com BD)
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('deve registrar usuário e retornar tokens', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          senha: 'senha123',
          nome: 'Test User',
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    // CONTINUE: Adicione mais testes E2E aqui
    // - Register com email duplicado
    // - Register com dados inválidos
    // - Login com credenciais
    // - Refresh token
    // - Logout
  });
});
```

---

### FASE 3: Testes do Módulo Produtos

**Prioridade:** ALTA (Produtos é o endpoint mais crítico)

Crie: `backend/src/modules/produtos/produtos.service.spec.ts`

```typescript
// TEMPLATE
describe('ProdutosService', () => {
  let service: ProdutosService;
  let produtoRepository: jest.Mocked<Repository<Produto>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        {
          provide: getRepositoryToken(Produto),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            // ... outros métodos
          },
        },
      ],
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de produtos', async () => {
      // ARRANGE
      const mockProdutos = [
        { id: '1', nome: 'Arroz', tipo: 'ALIMENTO' },
        { id: '2', nome: 'Feijão', tipo: 'ALIMENTO' },
      ];

      produtoRepository.find.mockResolvedValue(mockProdutos);

      // ACT
      const result = await service.findAll({
        page: 1,
        limit: 10,
      });

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe('Arroz');
    });

    // TODO: Teste findAll com filtros
    // TODO: Teste findAll com búsqueda
    // TODO: Teste findAll com paginação inválida
  });

  describe('findByBarcode', () => {
    // TODO: Implemente testes para busca por código de barras
  });

  // TODO: Teste findOne
  // TODO: Teste create
  // TODO: Teste update
  // TODO: Teste delete
});
```

---

### FASE 4: Testes do Módulo Receitas (Algoritmo MOI)

**Prioridade:** ALTA (Lógica complexa)

Procure pela função MOI em: `backend/src/modules/receitas/receitas.service.ts`

```typescript
describe('ReceitasService', () => {
  describe('gerarSugestoes (MOI Algorithm)', () => {
    it('deve sugerir receitas baseado no inventário', async () => {
      // ARRANGE
      const mockInventario = [
        { produto: { id: '1', nome: 'Arroz' }, quantidade: 5 },
        { produto: { id: '2', nome: 'Feijão' }, quantidade: 3 },
      ];

      const mockReceitas = [
        {
          id: '1',
          nome: 'Arroz com Feijão',
          ingredientes: [{ produto_id: '1' }, { produto_id: '2' }],
        },
        // ... mais receitas
      ];

      // ACT
      const sugestoes = await service.gerarSugestoes(mockInventario);

      // ASSERT
      expect(sugestoes).toBeDefined();
      expect(sugestoes.length).toBeGreaterThan(0);
      // TODO: Validar que algoritmo MOI está funcionando
    });
  });
});
```

---

## 📖 Referência Rápida: Jest + NestJS

### Estrutura básica de um teste

```typescript
describe('NomeDaClasse', () => {
  let service: NomeDaClasse;

  // Setup executado antes de CADA teste
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NomeDaClasse],
    }).compile();

    service = module.get<NomeDaClasse>(NomeDaClasse);
  });

  // Teste individual
  it('deve fazer algo específico', async () => {
    // ARRANGE: Preparar dados
    const entrada = { ... };

    // ACT: Executar a função
    const resultado = await service.meuMetodo(entrada);

    // ASSERT: Verificar resultado
    expect(resultado).toBe(esperado);
  });
});
```

### Funções Jest mais usadas

```typescript
// Mocks
jest.fn()                           // Criar função mock
jest.mock('modulo')                // Mockar módulo inteiro
jest.spyOn(obj, 'metodo')         // Espionar método

// Resolver valores
.mockResolvedValue(valor)          // Promise que resolve
.mockResolvedValueOnce(valor)      // Promise resolve UMA VEZ
.mockRejectedValue(erro)           // Promise que rejeita
.mockReturnValue(valor)            // Return síncrono

// Assertions
expect(resultado).toBe(esperado)    // Igualdade exata
expect(resultado).toEqual(esperado) // Deep equality
expect(resultado).toBeDefined()     // Não é undefined
expect(resultado).toThrow(Erro)     // Lança erro
expect(fn).toHaveBeenCalled()      // Função foi chamada
expect(fn).toHaveBeenCalledWith()  // Com esses argumentos
expect(fn).toHaveBeenCalledTimes(1) // Chamada N vezes
```

### Mockar Repositório TypeORM

```typescript
{
  provide: getRepositoryToken(Produto),
  useValue: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
}
```

### Mockar JwtService

```typescript
{
  provide: JwtService,
  useValue: {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
  },
}
```

---

## 🎯 Cobertura de Testes

### Como rodar com cobertura
```bash
npm test -- auth --coverage
```

### Output esperado
```
-------|----------|----------|----------|----------|-------------|
File   | % Stmts  | % Branch | % Funcs  | % Lines  | Uncovered   |
-------|----------|----------|----------|----------|-------------|
Auth   | 95.5     | 92.1     | 100      | 95.5     |             |
-------|----------|----------|----------|----------|-------------|
```

### Metas
- ✅ Statements: >85%
- ✅ Branches: >80%
- ✅ Functions: >90%
- ✅ Lines: >85%

---

## ❌ Erros comuns

### Erro: "Cannot find module 'modulo'"
```
// ❌ Errado
import { Usuario } from '../../../usuarios/usuarios.entity';

// ✅ Correto (use path alias)
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
```

### Erro: "Test timed out after 5000ms"
```
// Aumentar timeout
it('teste lento', async () => {
  // ...
}, 10000); // 10 segundos

// Ou global
jest.setTimeout(10000);
```

### Erro: "toHaveBeenCalledWith expected X but got Y"
```
// Você chamou com argumentos diferentes
// Verifique se a chamada está exatamente igual
expect(fn).toHaveBeenCalledWith(
  esperado1,
  esperado2,
  // ... todos os argumentos
);
```

---

## 📚 Recursos extras

- **Jest Docs:** https://jestjs.io/docs/getting-started
- **NestJS Testing:** https://docs.nestjs.com/fundamentals/testing
- **Testing Library:** Para testar componentes React/Angular
- **SuperTest:** Para testar endpoints HTTP

---

## ✅ Checklist para quando terminar

- [ ] Todos os TODOs dos arquivos auth concluídos
- [ ] Cobertura de teste do auth > 90%
- [ ] Criados testes E2E da auth
- [ ] Iniciados testes de produtos
- [ ] Iniciados testes de receitas
- [ ] CI/CD rodando testes automaticamente

---

## 🚀 Próximo passo

1. Abra `auth.service.spec.ts`
2. Procure por `// TODO:`
3. Implemente os testes seguindo o padrão
4. Rode com `npm test -- auth --watch`
5. Passe para o próximo arquivo

**Bom aprendizado!** 🎓
