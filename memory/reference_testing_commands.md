---
name: Testing Commands and Locations
description: Quick reference for running tests and test file locations
type: reference
---

## Running Tests

From `/backend` directory:

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all tests (both unit and integration)
npm run test:all

# Run compras module tests specifically
npm run test:compras

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:cov
```

## Test File Locations

**Unit Tests:**
- `/backend/src/modules/compras/compras.service.spec.ts` - Tests for ComprasService
- `/backend/src/modules/auth/auth.service.spec.ts` - Tests for AuthService
- Other `*.spec.ts` files throughout `/backend/src`

**Integration Tests:**
- `/backend/src/modules/compras/compras.integration.spec.ts` - Full API endpoint tests

**Documentation:**
- `/TESTING_GUIDE.md` - Complete testing guide with examples and results

## Test Metrics

- **Speed:** 4 seconds for unit tests vs 5-10 minutes manual testing
- **Savings:** 99.3% time reduction per validation cycle
- **Current Status:** 52 unit tests passing
