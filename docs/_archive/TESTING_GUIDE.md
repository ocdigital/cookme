# 📋 Guia de Testes - CookMe

## Overview
Este projeto usa Jest para testes unitários e de integração. Os testes validam funcionalidades automaticamente.

## Testes Implementados

### ✅ Testes Unitários (compras.service.spec.ts)
- Salvar itens do cupom no inventário
- Buscar produtos existentes por código de barras
- Criar novo produto se não existir
- Continuar salvando mesmo se um item falhar

### ✅ Testes de Integração (compras.integration.spec.ts)
- Salvar itens via endpoint
- Criar produtos automaticamente
- Validar requisições (sem itens, sem auth)
- Verificar dados salvos corretamente

## Comparação: Manual vs Automático

| Teste Manual | Teste Automático |
|---|---|
| 5-10 minutos | 4 segundos |
| Abrir Expo Go | `npm run test:compras` |
| Fazer login | ✓ Automático |
| Tirar foto | ✓ Simulado |
| Revisar | ✓ Validado |
| Verificar BD | ✓ Assertivo |

**Economia: 99.3% de tempo! ⏱️**

## Comandos

```bash
npm test                    # Todos os testes
npm run test:unit          # Apenas unitários
npm run test:integration   # Apenas integração
npm run test:compras       # Módulo Compras
npm run test:watch        # Modo watch
npm run test:cov          # Com coverage
```

## Resultado
```
✓ Salvar itens do cupom no inventário (17 ms)
✓ Buscar produtos por código de barras (4 ms)
✓ Criar novo produto se não existir (3 ms)
✓ Continuar se um item falhar (37 ms)

Test Suites: 1 passed
Tests: 4 passed
Time: 4.041 s ⚡
```

