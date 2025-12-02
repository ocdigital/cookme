# 🎭 Mock API - Exemplos de Testes

## ✨ Status Atual

**MODO MOCK ATIVADO** - O sistema está validando produtos usando o arquivo mock, SEM chamar a Claude API real.

### Alternar entre Mock e API Real

No arquivo [src/modules/product-classification/services/product-classification.service.ts](src/modules/product-classification/services/product-classification.service.ts):

**Para usar a API Real (quando tiver API key):**
```typescript
const USE_MOCK_CLASSIFICATION = false; // Mude para false
```

**Para usar o Mock (padrão agora):**
```typescript
const USE_MOCK_CLASSIFICATION = true; // Mantém o mock
```

---

## 📋 Exemplo 1: Validação em Batch (Múltiplos Produtos)

### Requisição

```bash
curl -X POST http://localhost:3000/api/product-classification/classify-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "produtos": ["Maçã", "Banana", "Detergente", "Sabonete", "Pão", "Leite"]
  }'
```

### Resposta Esperada

```json
[
  {
    "produto": "Maçã",
    "categoria": "alimento",
    "confidence": 0.99,
    "fromCache": false,
    "descricao": "Fruta vermelha, alimento"
  },
  {
    "produto": "Banana",
    "categoria": "alimento",
    "confidence": 0.99,
    "fromCache": false,
    "descricao": "Fruta amarela, alimento"
  },
  {
    "produto": "Detergente",
    "categoria": "nao_alimento",
    "confidence": 0.99,
    "fromCache": false,
    "descricao": "Produto de limpeza, não-alimento"
  },
  {
    "produto": "Sabonete",
    "categoria": "nao_alimento",
    "confidence": 0.99,
    "fromCache": false,
    "descricao": "Higiene pessoal, não-alimento"
  },
  {
    "produto": "Pão",
    "categoria": "alimento",
    "confidence": 0.98,
    "fromCache": false,
    "descricao": "Produto de panificação, alimento"
  },
  {
    "produto": "Leite",
    "categoria": "alimento",
    "confidence": 0.99,
    "fromCache": false,
    "descricao": "Bebida láctea, alimento"
  }
]
```

### Log Esperado no Backend

```
🎭 MODO MOCK: Validando produtos com simulação de Claude API
Batch de 6 produtos classificados via Claude em 5ms
```

---

## 📋 Exemplo 2: Validação Individual

### Requisição

```bash
curl -X GET http://localhost:3000/api/product-classification/classify/Maçã \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Resposta Esperada

```json
{
  "categoria": "alimento",
  "confidence": 0.99,
  "fromCache": false,
  "descricao": "Fruta vermelha, alimento natural"
}
```

### Log Esperado no Backend

```
🎭 MODO MOCK: Validando produto "Maçã"
Produto classificado via Claude: Maçã → alimento
```

---

## 📋 Exemplo 3: Criar Compra com Validação em Batch

### Requisição

```bash
curl -X POST http://localhost:3000/api/compras \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "data_compra": "2024-11-12T10:30:00Z",
    "local_compra": "Supermercado XYZ",
    "valor_total": 85.50,
    "metodo_cadastro": "ocr",
    "tempo_cadastro_segundos": 45,
    "itens": [
      {
        "produto_id": "uuid-1",
        "quantidade": 3,
        "unidade": "un",
        "preco_unitario": 5.50,
        "validade_final": "2024-12-15",
        "lote": "2024001"
      },
      {
        "produto_id": "uuid-2",
        "quantidade": 2,
        "unidade": "un",
        "preco_unitario": 7.50,
        "validade_final": "2024-12-10",
        "lote": "2024002"
      },
      {
        "produto_id": "uuid-3",
        "quantidade": 1,
        "unidade": "un",
        "preco_unitario": 15.00,
        "validade_final": null,
        "lote": null
      },
      {
        "produto_id": "uuid-4",
        "quantidade": 2,
        "unidade": "un",
        "preco_unitario": 8.50,
        "validade_final": null,
        "lote": null
      },
      {
        "produto_id": "uuid-5",
        "quantidade": 1,
        "unidade": "un",
        "preco_unitario": 10.00,
        "validade_final": "2024-12-20",
        "lote": "2024003"
      },
      {
        "produto_id": "uuid-6",
        "quantidade": 1,
        "unidade": "lt",
        "preco_unitario": 5.50,
        "validade_final": "2024-12-01",
        "lote": "2024004"
      }
    ]
  }'
```

### Fluxo de Execução

1. **Extrai produtos**: [uuid-1, uuid-2, uuid-3, uuid-4, uuid-5, uuid-6]
2. **Faz 1 chamada batch ao mock** com os 6 nomes de produtos
3. **Mock retorna classificações** em ~5ms
4. **Filtra produtos**: Apenas alimentos são salvos
5. **Descarta**: Detergente, Sabonete (não-alimentos)
6. **Salva na compra**: Maçã, Banana, Pão, Leite

### Resposta Esperada

```json
{
  "id": "compra-uuid",
  "usuario_id": "usuario-uuid",
  "data_compra": "2024-11-12T10:30:00Z",
  "local_compra": "Supermercado XYZ",
  "valor_total": 85.50,
  "metodo_cadastro": "ocr",
  "tempo_cadastro_segundos": 45,
  "criado_em": "2024-11-12T10:35:00Z",
  "itens": [
    {
      "id": "item-1",
      "produto_id": "uuid-1",
      "compra_id": "compra-uuid",
      "quantidade": 3,
      "unidade": "un",
      "preco_unitario": 5.50,
      "validade_final": "2024-12-15",
      "lote": "2024001",
      "produto": {
        "id": "uuid-1",
        "nome": "Maçã",
        "marca": null
      }
    },
    {
      "id": "item-2",
      "produto_id": "uuid-2",
      "compra_id": "compra-uuid",
      "quantidade": 2,
      "unidade": "un",
      "preco_unitario": 7.50,
      "validade_final": "2024-12-10",
      "lote": "2024002",
      "produto": {
        "id": "uuid-2",
        "nome": "Banana",
        "marca": null
      }
    },
    {
      "id": "item-3",
      "produto_id": "uuid-5",
      "compra_id": "compra-uuid",
      "quantidade": 1,
      "unidade": "un",
      "preco_unitario": 10.00,
      "validade_final": "2024-12-20",
      "lote": "2024003",
      "produto": {
        "id": "uuid-5",
        "nome": "Pão",
        "marca": null
      }
    },
    {
      "id": "item-4",
      "produto_id": "uuid-6",
      "compra_id": "compra-uuid",
      "quantidade": 1,
      "unidade": "lt",
      "preco_unitario": 5.50,
      "validade_final": "2024-12-01",
      "lote": "2024004",
      "produto": {
        "id": "uuid-6",
        "nome": "Leite",
        "marca": null
      }
    }
  ]
}
```

### Log Esperado no Backend

```
🎭 MODO MOCK: Validando produtos com simulação de Claude API
Batch de 6 produtos classificados via Claude em 3ms
Compra criada com 4 itens válidos (2 não-alimentos filtrados automaticamente)
```

---

## 🎲 Produtos Pré-Cadastrados no Mock

### Alimentos (100% Reconhecidos)
- maçã, banana, pão, leite, queijo, arroz, feijão, frango, carne
- tomate, cebola, alho, azeite, sal, açúcar, chocolate
- café, chá, suco, água

### Não-Alimentos (100% Reconhecidos)
- detergente, sabonete, shampoo, papel higiênico, desinfetante
- esponja, pano, toalha, vela, vaso, prato, copo, colher, faca

### Produtos Desconhecidos (Heurística)

Se o produto não estiver no dicionário, o mock usa heurística:

**Será classificado como ALIMENTO se contiver:**
- fruta, verdura, legume, carne, peixe, frango, arroz, feijão, alimento, comida, bebida, suco, leite, queijo, pão, macarrão, biscoito, chocolate, doce

**Será classificado como NÃO-ALIMENTO se contiver:**
- detergente, sabão, sabonete, shampoo, limpeza, higiene, desinfetante, papel, toalha, pano, esponja, vela, utensílio, prato, copo, colher, faca

**Será INDEFINIDO se não encaixar em nenhuma categoria:**
- confidence: 0.5
- descricao: "Classificação incerta - requer validação manual"

---

## 🧪 Teste com Produtos Desconhecidos

### Requisição

```bash
curl -X GET http://localhost:3000/api/product-classification/classify/Uva%20Roxa \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Resposta Esperada (Heurística)

```json
{
  "categoria": "alimento",
  "confidence": 0.75,
  "fromCache": false,
  "descricao": "Classificado como alimento por heurística de palavras-chave"
}
```

---

## ✅ Como Validar que o Mock Está Funcionando

1. **Verifique os logs**: Procure por `🎭 MODO MOCK:`
2. **Verifique o tempo**: Deve ser < 10ms (muito rápido)
3. **Verifique os resultados**: Produtos conhecidos têm confidence 0.98-0.99
4. **Verifique o cache**: Após primeira classificação, a segunda é ainda mais rápida

---

## 📊 Informações sobre o Mock

| Aspecto | Valor |
|---------|-------|
| **Tempo de resposta** | < 5ms |
| **Produtos pré-cadastrados** | 40+ |
| **Heurística com keywords** | Sim |
| **Caching** | Sim (banco de dados) |
| **Chamadas à API real** | 0 (completamente offline) |
| **Custo** | $0 |

---

## 🚀 Próximos Passos

Quando a Claude API estiver disponível:

1. Mude `USE_MOCK_CLASSIFICATION = false` na [service](src/modules/product-classification/services/product-classification.service.ts)
2. Configure a variável de ambiente `CLAUDE_API_KEY`
3. Reinicie o backend
4. O resto do código funciona **identicamente**
