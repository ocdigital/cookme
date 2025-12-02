# Exemplo de Validação em Batch de Produtos

## 📝 Descrição

Este exemplo demonstra como o sistema valida múltiplos produtos em **UMA ÚNICA CHAMADA** à Claude API.

## 🎯 Cenário

Um usuário está fazendo uma compra com os seguintes itens:
- Maçã
- Banana
- Detergente
- Sabonete
- Pão
- Leite

## 📤 Requisição Exemplo

### Endpoint
```
POST /api/compras
Content-Type: application/json
Authorization: Bearer {token_do_usuario}
```

### Body
```json
{
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
}
```

## 🔄 Fluxo de Processamento

### 1️⃣ **Extração de Nomes de Produtos**
```
- Maçã
- Banana
- Detergente
- Sabonete
- Pão
- Leite
```

### 2️⃣ **Uma Única Chamada à Claude**

**Prompt enviado:**
```
Classifique os seguintes produtos como "alimento" ou "não-alimento".
Responda em JSON com um array, onde cada item tem o nome exato do produto e a classificação:

Produtos:
1. Maçã
2. Banana
3. Detergente
4. Sabonete
5. Pão
6. Leite

Responda APENAS com um JSON válido no formato:
[
  {"nome": "nome do produto", "categoria": "alimento" ou "nao_alimento", "confidence": 0.0-1.0, "descricao": "motivo breve"},
  ...
]
```

### 3️⃣ **Resposta do Mock (Quando API Key não está configurada)**

```json
[
  {
    "nome": "Maçã",
    "categoria": "alimento",
    "confidence": 0.99,
    "descricao": "Fruta vermelha, alimento"
  },
  {
    "nome": "Banana",
    "categoria": "alimento",
    "confidence": 0.99,
    "descricao": "Fruta amarela, alimento"
  },
  {
    "nome": "Detergente",
    "categoria": "nao_alimento",
    "confidence": 0.99,
    "descricao": "Produto de limpeza, não-alimento"
  },
  {
    "nome": "Sabonete",
    "categoria": "nao_alimento",
    "confidence": 0.99,
    "descricao": "Higiene pessoal, não-alimento"
  },
  {
    "nome": "Pão",
    "categoria": "alimento",
    "confidence": 0.98,
    "descricao": "Produto de panificação, alimento"
  },
  {
    "nome": "Leite",
    "categoria": "alimento",
    "confidence": 0.99,
    "descricao": "Bebida láctea, alimento"
  }
]
```

### 4️⃣ **Filtragem de Alimentos**

Apenas itens com `categoria === "alimento"` são salvos na compra:

✅ **Itens Salvos:**
- Maçã (confidence: 0.99)
- Banana (confidence: 0.99)
- Pão (confidence: 0.98)
- Leite (confidence: 0.99)

❌ **Itens Descartados (não-alimentos):**
- Detergente (confidence: 0.99)
- Sabonete (confidence: 0.99)

### 5️⃣ **Caching Automático**

Cada produto é salvo automaticamente na tabela `product_knowledge_base`:

```sql
INSERT INTO product_knowledge_base (product_name, normalized_name, categoria, confidence_score, ...) VALUES
('Maçã', 'maca', 'alimento', 0.99, ...),
('Banana', 'banana', 'alimento', 0.99, ...),
('Detergente', 'detergente', 'nao_alimento', 0.99, ...),
('Sabonete', 'sabonete', 'nao_alimento', 0.99, ...),
('Pão', 'pao', 'alimento', 0.98, ...),
('Leite', 'leite', 'alimento', 0.99, ...);
```

## 📊 Resposta da API

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

## 🚀 Benefícios do Batch

| Aspecto | Individual | Batch | Economia |
|---------|-----------|-------|----------|
| **Chamadas API** | 6 chamadas | 1 chamada | 83% |
| **Tokens Input** | ~600 tokens | ~200 tokens | 67% |
| **Tokens Output** | ~300 tokens | ~150 tokens | 50% |
| **Tempo Total** | ~3000ms | ~800ms | 73% |
| **Custo (Claude 3.5)** | $0.015 | $0.003 | 80% |

## 🔌 Sem API Key Configurada?

Se a variável de ambiente `CLAUDE_API_KEY` não estiver configurada, o sistema usa automaticamente a função `mockClassificacaoBatch()` que:

✅ Classifica produtos baseado em um dicionário pré-configurado
✅ Usa heurística por keywords para produtos desconhecidos
✅ Retorna no formato exato que a Claude API retornaria
✅ Permite testar o fluxo completo localmente

## 📝 Produtos no Mock

### Alimentos (25+)
maçã, banana, pão, leite, queijo, arroz, feijão, frango, carne, tomate, cebola, alho, azeite, sal, açúcar, chocolate, café, chá, suco, água, etc.

### Não-Alimentos (15+)
detergente, sabonete, shampoo, papel higiênico, desinfetante, esponja, pano, toalha, vela, vaso, prato, copo, colher, faca, etc.

### Padrão (Heurística)
Qualquer outro produto é classificado por análise de keywords
