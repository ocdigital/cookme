---
name: Test-Driven Development Adoption
description: Jest test suite implemented and TDD methodology to be used for all new features
type: project
---

## Status

Test-Driven Development (TDD) has been adopted as the standard methodology for feature development.

**Why:** Previous testing approach was manual and time-consuming (5-10 minutes per test). Automated Jest test suite reduces validation time to 4 seconds. TDD ensures better code quality and faster development cycles.

**How to apply:** Before implementing any new feature, write the test first. This ensures requirements are clear and implementation matches spec. Tests should be written for:
- Unit tests (service logic, utilities)
- Integration tests (API endpoints, database operations)

## Test Infrastructure

All test scripts are available in `/backend/package.json`:

```bash
npm test                 # All tests (unit + e2e)
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:compras    # Compras module tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage report
```

## Completed Tests

1. **ComprasService Unit Tests** (`compras.service.spec.ts`)
   - Salvar itens do cupom no inventário
   - Buscar produtos por código de barras
   - Criar novo produto se não existir
   - Continuar salvando mesmo se um item falhar
   - Status: ✅ 4/4 tests passing (~4 seconds)

2. **ComprasIntegration Tests** (in progress)
   - Full HTTP endpoint validation
   - Database verification
   - Status: Requires NestJS full module setup

## Next Steps

When implementing new features:
1. Write tests first (describe what the feature should do)
2. Run tests (they'll fail initially)
3. Implement the feature to make tests pass
4. Refactor while keeping tests passing
