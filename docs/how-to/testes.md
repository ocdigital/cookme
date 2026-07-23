  # 🚀 COMECE AQUI - Guia Rápido de Testes

## ⏱️ 5 Minutos Para Começar

### 1. Abra o Terminal
```bash
cd backend
```

### 2. Rode os testes que já estão prontos
```bash
npm test -- auth.service.spec.ts
```

**Você deve ver algo assim:**
```
PASS  src/modules/auth/auth.service.spec.ts
  AuthService
    register
      ✓ deve registrar um novo usuário com sucesso (123 ms)
    login
      ✓ deve fazer login com sucesso (45 ms)
    refreshToken
      ✓ deve renovar o access token com sucesso (78 ms)
    logout
      ✓ deve remover o refresh token do usuário (12 ms)
    validateUser
      ✓ deve retornar o usuário se encontrado (34 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

Se apareceu ✓ (verde), PERFEITO! Os testes estão funcionando.

---

## 🎯 Próximo Passo: Completar os TODOs

### 1. Abra o arquivo em seu editor
```bash
code src/modules/auth/auth.service.spec.ts
```

### 2. Procure por "TODO:"
Procure no arquivo (Ctrl+F) por `TODO:`

Você verá algo assim:
```typescript
/**
 * CONTINUE: Adicione este teste você mesmo!
 *
 * TODO: Escreva um teste para o caso de EMAIL JÁ EXISTIR
 * - Deve lançar ConflictException
 * - Mensagem deve ser: 'Email já cadastrado'
 * - Dica: Use .rejects.toThrow()
 *
 * TEMPLATE para copiar:
 *
 * it('deve lançar ConflictException se email já existe', async () => {
 *   // ARRANGE: mock usuario existente
 *   (usuarioRepository.findOne as jest.Mock).mockResolvedValue(mockUsuario);
 *
 *   // ACT & ASSERT: esperamos que lance erro
 *   await expect(
 *     service.register(mockRegisterDto)
 *   ).rejects.toThrow(ConflictException);
 * });
 */
```

### 3. Copie o TEMPLATE e remova os comentários
Cole o template dentro do bloco `describe('register')` e procure por um bom lugar para colocar.

**Antes:**
```typescript
describe('register', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    // ... teste que já existe
  });

  /**
   * TODO: Escreva um teste...
   */
});
```

**Depois:**
```typescript
describe('register', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    // ... teste que já existe
  });

  it('deve lançar ConflictException se email já existe', async () => {
    (usuarioRepository.findOne as jest.Mock).mockResolvedValue(mockUsuario);
    await expect(
      service.register(mockRegisterDto)
    ).rejects.toThrow(ConflictException);
  });
});
```

### 4. Remova o bloco de comentário TODO

**Você está pronto! Rode o teste:**
```bash
npm test -- auth.service.spec.ts --watch
```

---

## 🔄 Workflow: RÁPIDO e EFICIENTE

1. **Abra editor + Terminal lado a lado**
   - À esquerda: Seu editor com o código
   - À direita: Terminal rodando `npm test -- auth --watch`

2. **Procure próximo TODO**
   - Ctrl+F no arquivo

3. **Copie template**
   - Paste no arquivo

4. **Salve (Ctrl+S)**
   - Jest vai recarregar AUTOMATICAMENTE

5. **Veja verde no terminal**
   - ✓ Teste passou!

6. **Próximo TODO**
   - Volte ao passo 2

**Total: ~5-10 minutos por TODO**

---

## 📂 Quais Arquivos Editar

### ✅ Complete ESTES testes (Em ordem)

**Arquivo 1: auth.service.spec.ts** (30 min)
```
Localização: backend/src/modules/auth/auth.service.spec.ts
TODOs: 6 testes
- describe('register'): 1 TODO
- describe('login'): 2 TODOs
- describe('refreshToken'): 2 TODOs
- describe('validateUser'): 1 TODO
```

**Arquivo 2: auth.controller.spec.ts** (30 min)
```
Localização: backend/src/modules/auth/auth.controller.spec.ts
TODOs: 8 testes
- describe('register'): 2 TODOs
- describe('login'): 2 TODOs
- describe('refresh'): 2 TODOs
- describe('logout'): 1 TODO
- describe('getProfile'): 1 TODO
```

### 📚 DEPOIS (Próximas semanas)

**Arquivo 3: produtos.service.spec.ts** (2-3 horas)
```
Primeiro: Renomeie
- De: produtos.service.spec.ts.example
- Para: produtos.service.spec.ts

Depois: Implemente 20 TODOs
```

---

## 🎓 Padrão a Seguir

Todo teste tem a mesma estrutura (AAA):

```typescript
it('descrição do que testa', async () => {
  // ARRANGE: Preparar dados de teste
  const entrada = { ... };
  const mock = { ... };

  // ACT: Executar a função
  const resultado = await service.meuMetodo(entrada);

  // ASSERT: Verificar resultado
  expect(resultado).toBe(esperado);
});
```

**Todos os 40+ TODOs seguem este padrão!**

---

## ❌ Problemas Comuns

### "Cannot find module 'jest'"
```bash
# Solução: Instale dependências
npm install
```

### "Tests are not running"
```bash
# Verifique se está na pasta backend
pwd  # deve terminar em /cookme/backend

# Se não, entre na pasta
cd backend

# Rode novamente
npm test -- auth
```

### "FAIL - Test failed"
```
Leia a mensagem de erro:
- Se disser "expect(...).toHaveBeenCalledWith(...)"
  → Você mockou errado, veja o template novamente

- Se disser "ReferenceError: NomeDaClasse is not defined"
  → Faltou importar no início do arquivo

- Se disser "TypeError: Cannot read property 'xxx' of undefined"
  → Mock retornou undefined, precisa setar .mockResolvedValue()
```

### "Test times out"
```typescript
// Aumentar timeout para 1 teste
it('teste lento', async () => {
  // ...
}, 10000); // 10 segundos

// Ou aumentar timeout global no início do arquivo
jest.setTimeout(10000);
```

---

## ✨ Como Confirmar que Está Certo

### Rodando testes
```bash
# Verde = passou ✓
# Vermelho = falhou ✗
npm test -- auth --watch
```

### Ver cobertura
```bash
npm test -- auth --coverage

# Procure por linhas como:
# AuthService | 95.5 | 92.1 | 100 | 95.5
#
# Números > 85% é BOM ✅
# Números < 70% precisa mais testes ❌
```

---

## 📋 Checklist: Primeiro TODO

- [ ] Terminal aberto em `/cookme/backend`
- [ ] Arquivo `auth.service.spec.ts` aberto
- [ ] Encontrei o primeiro TODO usando Ctrl+F
- [ ] Copiei o TEMPLATE
- [ ] Colei dentro do `describe('register')`
- [ ] Removi o bloco de comentário TODO
- [ ] Salvei o arquivo (Ctrl+S)
- [ ] Vejo ✓ verde no terminal
- [ ] Commit feito com mensagem: "test: add email already exists test"

---

## 🎉 SUCESSO!

Se você conseguiu fazer tudo isso, você:
- ✅ Entendeu a estrutura de testes Jest
- ✅ Conseguiu seguir um template e adaptar
- ✅ Rodou testes com sucesso
- ✅ Confirmou que código está correto

**Próximo: Faça TODOS os 6 TODOs do auth.service.spec.ts!**

---

## 💡 Dica de Ouro

Quando colar o template:
1. NÃO toque no AAA (Arrange, Act, Assert)
2. MUDE apenas os nomes e dados específicos
3. COPIE o padrão dos outros testes
4. RODE o teste para confirmar

**Exemplo:**

Template:
```typescript
it('deve retornar X quando Y', async () => {
  // ARRANGE
  mock.findOne.mockResolvedValue(objectoMock);

  // ACT
  const resultado = await service.meuMetodo();

  // ASSERT
  expect(resultado).toEqual(esperado);
});
```

Seu teste (copiado e adaptado):
```typescript
it('deve lançar erro quando email existe', async () => {
  // ARRANGE (adaptado para seu caso)
  usuarioRepository.findOne.mockResolvedValue(mockUsuario);

  // ACT (adaptado - agora lançando erro)
  await expect(
    service.register(mockRegisterDto)
  ).rejects.toThrow(ConflictException);

  // ASSERT (adaptado - esperando exceção)
  // Note: .rejects faz o assert automaticamente
});
```

---

## 🚀 Você está pronto!

Abra o editor e comece. Os testes têm tudo comentado, você só precisa:
1. Procurar TODO
2. Copiar template
3. Adaptar nomes
4. Salvar
5. Ver verde

**Vai dar certo! 💪**

Qualquer dúvida, revise os comentários no arquivo .spec.ts - está TUDO explicado lá!
