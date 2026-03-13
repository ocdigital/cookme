# 🧪 Teste de OCR de Cupom Fiscal

## Testando o Endpoint

### 1. Obter Token de Autenticação
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste.mobile@cookme.com",
    "senha": "teste123456"
  }' | jq '.access_token' -r
```

Salve o token em uma variável:
```bash
TOKEN="seu_token_aqui"
```

### 2. Preparar uma Imagem em Base64

Converter uma imagem JPG para base64:
```bash
base64 -i /path/to/cupom.jpg > cupom_base64.txt
```

Ou use Python:
```python
import base64

with open('cupom.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')
    print(image_base64)
```

### 3. Testar o Endpoint OCR

```bash
curl -X POST http://localhost:3000/api/compras/ocr-cupom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "image_base64": "iVBORw0KGgo...",
    "image_type": "receipt"
  }' | jq '.'
```

## Esperado na Resposta

```json
{
  "estabelecimento": {
    "nome": "Supermercado XYZ",
    "cnpj": "12.345.678/0001-99",
    "endereco": "Rua Exemplo, 123"
  },
  "itens": [
    {
      "nome": "Arroz Integral 1kg",
      "quantidade": 1,
      "valor": "8.99",
      "valor_total": "8.99",
      "codigo_barras": "7891234567890"
    }
  ],
  "totais": {
    "subtotal": "8.99",
    "desconto": "0.00",
    "total": "8.99"
  },
  "informacoes_fiscais": {
    "data_hora": "2026-03-12T10:30:00.000Z"
  },
  "data_extracao": "2026-03-12T16:36:14.313Z"
}
```

## No App Mobile

1. Abra a aba **Inventário**
2. Clique em **"Foto do Cupom Fiscal"** (novo botão)
3. Escolha capturar foto ou selecionar da galeria
4. Revise os itens extraídos
5. Clique em **"Adicionar compra"**

## Troubleshooting

### "Erro ao processar cupom"
- Verifique se a imagem está clara
- A imagem precisa mostrar claramente os itens e valores
- Certifique-se de que tem GEMINI_API_KEY configurada no .env

### "Erro de autenticação"
- Verifique se o token é válido e não expirou
- Faça login novamente para obter um novo token

### Nenhum item foi detectado
- Tente com uma foto de melhor qualidade
- Verifique se todos os itens estão visíveis na foto
