# Guia de OCR e Processamento de Cupom Fiscal

## 📋 Visão Geral

O sistema de OCR processa múltiplas fotos de cupom fiscal com **deduplicação inteligente** e **validação híbrida**.

### Problema Resolvido
- ✅ Cupons grandes precisam de múltiplas fotos
- ✅ Risco de itens duplicados entre fotos
- ✅ Solução: Deduplicação automática + review manual

---

## 🏗️ Arquitetura

### Backend: `ReceiptOcrService`

**Responsabilidades:**
1. Extrair itens de texto OCR (parsing)
2. Gerar assinatura única para cada item (MD5)
3. Detectar duplicatas (assinatura exata + similaridade)
4. Extrair número e data do cupom
5. Validação híbrida (automática com opção de review)

**Fluxo:**
```
[Foto 1 OCR] → Extract Items → Signatures
[Foto 2 OCR] → Extract Items → Signatures
[Foto 3 OCR] → Extract Items → Signatures
                     ↓
            Deduplicate (comparar signatures)
                     ↓
            Flag duplicatas para review (se houver)
                     ↓
            Retornar itens únicos + alertas
```

---

## 🔌 API Endpoints

### 1. Processar Cupom (com múltiplas fotos)

**POST** `/api/receitas/ocr/process`

**Request:**
```json
{
  "photos": [
    {
      "ocrText": "BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98\nCAFE MORGES VACUO 500G 1 UN x 25,98 25,98\nAGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76",
      "photoNumber": 1,
      "totalPhotos": 3
    },
    {
      "ocrText": "CAFE MORGES VACUO 500G 1 UN x 25,98 25,98\nAGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76\nCEBOLA NACIONAL KG 0,870 KG x 4,69 4,08",
      "photoNumber": 2,
      "totalPhotos": 3
    },
    {
      "ocrText": "MANI ITALAC C/SOL 500G 2 UN x 22,90 47,80\nBISABUGINHA PANCO PREM 3 2 UN x 7,79 15,58",
      "photoNumber": 3,
      "totalPhotos": 3
    }
  ],
  "ignoreWarnings": false
}
```

**Response (Sem duplicatas):**
```json
{
  "status": "success",
  "items": [
    {
      "nome": "BOLO PANCO ABACAXI 300G",
      "quantidade": 1,
      "preco_unitario": 9.98,
      "preco_total": 9.98
    },
    // ... outros itens
  ],
  "receiptNumber": "11308_176",
  "receiptDate": "18/03/2026 13:50",
  "statistics": {
    "totalItemsProcessed": 28,
    "duplicatesRemoved": 8,
    "itemsNeedingReview": 0
  },
  "message": "Cupom processado com sucesso! 20 itens extraídos."
}
```

**Response (Com duplicatas - REVIEW REQUIRED):**
```json
{
  "status": "review_required",
  "items": [
    // ... itens únicos
  ],
  "duplicatesFlagged": [
    {
      "nome": "CAFE MORGES VACUO 500G",
      "quantidade": 1,
      "preco_unitario": 25.98,
      "preco_total": 25.98,
      "occurrences": 2
    }
  ],
  "receiptNumber": "11308_176",
  "receiptDate": "18/03/2026 13:50",
  "statistics": {
    "totalItemsProcessed": 28,
    "duplicatesRemoved": 6,
    "itemsNeedingReview": 2
  },
  "message": "2 item(ns) aparecem em múltiplas fotos. Revise e confirme se deve remover duplicatas."
}
```

---

### 2. Validar e Confirmar (após review manual)

**POST** `/api/receitas/ocr/validate`

**Request:**
```json
{
  "items": [
    {
      "nome": "BOLO PANCO ABACAXI 300G",
      "quantidade": 1,
      "preco_unitario": 9.98,
      "preco_total": 9.98
    },
    // ... itens confirmados
  ],
  "approvedDuplicates": ["0"], // índices dos duplicados aprovados
  "receiptNumber": "11308_176"
}
```

**Response:**
```json
{
  "status": "confirmed",
  "items": [
    // ... itens finais confirmados
  ],
  "receiptNumber": "11308_176",
  "message": "Itens confirmados e prontos para serem adicionados à receita."
}
```

---

## 🧪 Testes

Todos os 8 testes estão passando:

```bash
npm test -- receipt-ocr.service.spec.ts
```

**Testes cobrem:**
- ✅ Extração de itens do OCR
- ✅ Deduplica ção por assinatura exata
- ✅ Deduplicação por similaridade (85%+)
- ✅ Detecção de duplicatas para review
- ✅ Geração de assinatura consistente

---

## 🎯 Deduplicação: Como Funciona

### 1. **Assinatura Exata (MD5)**

Gera hash baseado em:
- Nome do produto (normalizado)
- Preço total (mais confiável)

```typescript
// Exemplo:
item: { nome: "BOLO PANCO ABACAXI 300G", preco_total: 9.98 }
signature: "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5"
```

### 2. **Similaridade (Levenshtein Distance)**

Se assinatura exata não bate, compara **similaridade de nome**:
- Calcula distância (quantos caracteres diferentes)
- Normaliza para 0-1 (1 = idêntico)
- Threshold: 85% similar + preço idêntico = duplicata

```typescript
// Exemplo:
"BOLO PANCO ABACAXI 300G" (foto 1)
"BOLO PANCO ABACAXI 3006" (foto 2 - OCR errou último dígito)
→ Similaridade: 95% + Preço = 9.98 (mesmo)
→ Resultado: DUPLICATA DETECTADA
```

### 3. **Validação Híbrida**

**Automática:**
- Remove duplicatas com assinatura exata
- Remove muito similares (85%+) com mesmo preço

**Manual (User Review):**
- Flag itens que aparecem 2+ vezes em fotos diferentes
- Usuário pode aprovar/rejeitar cada um
- Se usuario confirma (ignoreWarnings), finaliza

---

## 📱 Frontend: Hook para Upload

Exemplo React (próximo passo):

```typescript
const ReceiptUpload = () => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    // 1. Fazer OCR de cada foto (Tesseract)
    const ocrResults = await Promise.all(
      photos.map(async (photo, index) => ({
        ocrText: await extractOcrText(photo),
        photoNumber: index + 1,
        totalPhotos: photos.length,
      }))
    );

    // 2. Enviar para backend
    const response = await fetch('/api/receitas/ocr/process', {
      method: 'POST',
      body: JSON.stringify({
        photos: ocrResults,
        ignoreWarnings: false,
      }),
    });

    const data = await response.json();
    setResult(data);

    // 3. Se review_required, mostrar confirmação
    if (data.status === 'review_required') {
      showReviewDialog(data.duplicatesFlagged);
    } else {
      // Sucesso direto
      createReceipt(data.items);
    }
  };

  return (
    <div>
      <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} />
      <button onClick={handleUpload}>Processar Cupom</button>
    </div>
  );
};
```

---

## 🚀 Próximos Passos

1. **Frontend Upload Component**
   - Integrar Tesseract.js (já existe no mobile)
   - UI para upload múltiplas fotos
   - Mostrar resultado + dialog de review

2. **Integração com Receitas**
   - Endpoint que cria receita a partir dos itens extraídos
   - Mapear itens extraídos → ingredientes da receita

3. **Melhorias**
   - Salvar histórico de cupons processados
   - Aprender com correções do usuário
   - Treinar modelo customizado de OCR

---

## 🔧 Configurações

### Threshold de Similaridade
Default: **85%** (em `receipt-ocr.service.ts`)

```typescript
const similarityThreshold = 0.85; // Alterar se necessário
```

### Máximo de Fotos
Default: **10 fotos por cupom**

```typescript
if (request.photos.length > 10) {
  throw new BadRequestException('Máximo de 10 fotos permitidas');
}
```

---

## 📊 Exemplo Real: Suas 3 Fotos

**Entrada:**
- Foto 1: 14 linhas de itens
- Foto 2: 15 linhas (com algumas repetidas)
- Foto 3: 12 linhas (com algumas repetidas)
- **Total:** 41 linhas extraídas

**Após Deduplicação:**
- Itens únicos: ~27
- Duplicatas removidas: ~14
- Itens para review: 0 (ou 1-2 se OCR errou ligeiramente)

---

## 💡 Troubleshooting

### "Muitas fotos"
- Máximo 10 fotos por cupom
- Dividir cupom muito grande em 2+ cupons

### "OCR ruim, muitos erros"
- Melhorar qualidade da foto (luz, ângulo)
- Usar Tesseract v5+ (mais preciso)
- Considerar API externa (Google Vision)

### "Duplic atas não foram detectadas"
- Verificar se preço é idêntico
- Aumentar similarityThreshold se muito liberal
- Revisar OCR (pode ter alterado nome/preço)

