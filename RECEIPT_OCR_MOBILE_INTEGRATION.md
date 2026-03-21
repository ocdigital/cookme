# Integração Receipt OCR - Mobile

## 🎯 Objetivo
Integrar a nova tela `ReceiptMultiPhotoScreen` ao fluxo móvel para capturar múltiplas fotos de cupom com OCR.

---

## 📝 O Que Foi Criado

### Backend (Pronto para usar)
- `ReceiptOcrService` - Lógica de deduplicação inteligente
- `ReceiptOcrController` - Endpoints `/api/receitas/ocr/*`
- Suporta até 10 fotos com deduplicação automática

### Mobile (Pronto para integrar)
- `receiptOcrService.js` - Client para API + Tesseract
- `useReceiptOcr` hook - Gerencia estado completo
- `ReceiptMultiPhotoScreen.js` - UI com 5 etapas

---

## 🔗 Integração no App

### 1. Adicionar Rota ao Navigator

No seu arquivo de navegação (ex: `src/navigation/RootNavigator.js`):

```javascript
import ReceiptMultiPhotoScreen from '../screens/ReceiptMultiPhotoScreen';

// Dentro do Stack Navigator:
<Stack.Screen
  name="ReceiptMultiPhoto"
  component={ReceiptMultiPhotoScreen}
  options={{
    title: 'Capturar Cupom',
    headerBackVisible: true,
  }}
/>
```

### 2. Chamar da Tela Desejada

Exemplo: De `InventoryScreen.js` para abrir a captura de cupom:

**Atual:**
```javascript
onPress={() => navigation.navigate('ReceiptPhoto')}
```

**Novo (com múltiplas fotos):**
```javascript
onPress={() => navigation.navigate('ReceiptMultiPhoto')}
```

---

## 📱 Fluxo de Uso

### Passo 1: Usuário navega para capturar cupom
```javascript
navigation.navigate('ReceiptMultiPhoto');
```

### Passo 2: Tela abre em modo de captura
- Câmera ou Galeria
- Até 10 fotos
- Preview de fotos capturadas

### Passo 3: Processamento automático
- Tesseract extrai OCR de cada foto
- Backend deduplica automaticamente
- Retorna itens únicos + duplicatas

### Passo 4: Review (se necessário)
- Mostra duplicatas detectadas
- Usuário aprova/rejeita
- Confirma itens finais

### Passo 5: Sucesso
- Resumo de itens extraídos
- Número do cupom (se detectado)
- Estatísticas

---

## 🔧 Como Funciona Internamente

### receiptOcrService.js

```javascript
// 1. Converter imagem para base64
await receiptOcrService.imageToBase64(imageUri);

// 2. Extrair OCR usando Tesseract
await receiptOcrService.extractOcrFromImage(imageUri);

// 3. Processar múltiplas fotos com backend
const result = await receiptOcrService.processMultiplePhotos([uri1, uri2, uri3]);
// Retorna: { status, items, duplicatesFlagged, statistics, ... }

// 4. Validar após review manual
const confirmed = await receiptOcrService.validateAndConfirm(items, []);
```

### useReceiptOcr Hook

```javascript
const {
  photos,           // Array de URIs capturadas
  isLoading,        // Boolean (processando?)
  error,            // String com erro (se houver)
  result,           // Resultado da API
  reviewMode,       // Boolean (precisa review?)

  // Funções
  addPhoto,         // Adiciona uma foto
  removePhoto,      // Remove por índice
  clearPhotos,      // Limpa tudo
  processPhotos,    // Inicia processamento
  confirmItems,     // Confirma após review

  // Stats
  photoCount,       // Número de fotos
  itemCount,        // Número de itens extraídos
  duplicateCount,   // Número de duplicatas
} = useReceiptOcr();
```

---

## 📊 Exemplo: Resultado após processamento

### Sucesso (sem duplicatas):
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
    // ... mais itens
  ],
  "receiptNumber": "11308_176",
  "receiptDate": "18/03/2026 13:50",
  "statistics": {
    "totalItemsProcessed": 28,
    "duplicatesRemoved": 8,
    "itemsNeedingReview": 0
  }
}
```

### Review necessário (com duplicatas):
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
      "preco_total": 25.98,
      "occurrences": 2
    }
  ],
  "statistics": {
    "totalItemsProcessed": 28,
    "duplicatesRemoved": 6,
    "itemsNeedingReview": 2
  }
}
```

---

## 🚀 Próximos Passos

### Após capturar e processar:

1. **Salvar em Inventário:**
```javascript
const handleAddRecipe = async () => {
  const items = result.items;
  await api.post('/inventario/adicionar-itens', {
    itens: items.map(item => ({
      nome: item.nome,
      quantidade: item.quantidade,
      preco: item.preco_total,
    })),
  });
};
```

2. **Criar Receita:**
```javascript
const handleCreateRecipe = async () => {
  const items = result.items;
  await api.post('/receitas', {
    nome: `Cupom ${result.receiptNumber}`,
    ingredientes: items,
    data_compra: result.receiptDate,
  });
};
```

3. **Adicionar a Compra:**
```javascript
const handleAddPurchase = async () => {
  await api.post('/compras', {
    itens: result.items,
    data: result.receiptDate,
    total: result.items.reduce((sum, item) => sum + item.preco_total, 0),
  });
};
```

---

## 🐛 Troubleshooting

### "OCR não está funcionando"
- Verificar se Tesseract foi instalado: `npm list react-native-tesseract-ocr`
- Tentar foto mais clara/próxima
- Ver logs: `console.log('[Tesseract]...')`

### "Muitas duplicatas detectadas"
- OCR pode estar errando no nome
- Aumentar qualidade da foto
- Verificar se cupom tem itens realmente duplicados

### "API retorna erro 400"
- Verificar se `photos` array está preenchido
- Ver se OCR extraiu texto (não vazio)
- Checar resposta no console: `console.error()`

### "Timeout no processamento"
- Tesseract pode ser lento em fotos de baixa qualidade
- Máximo 10 fotos por cupom
- Considerar usar câmera de melhor qualidade

---

## 📚 Referência Rápida

### Estados da Tela

| Estado | O que acontece | Botões |
|--------|-----------------|--------|
| **capture** | Usuário captura/seleciona fotos | Câmera, Galeria, Processar |
| **processing** | OCR + API deduplica | (loading) |
| **review** | Mostra duplicatas para validação | Voltar, Confirmar |
| **success** | Mostra resultado final | Usar itens, OK |

### Requisitos

- ✅ Câmera + permissão
- ✅ Tesseract instalado
- ✅ API backend rodando
- ✅ Conexão com internet (para API)

### Tamanho de Arquivo

- Cada imagem: ~2-5MB (após compressão 0.8)
- 10 fotos: ~20-50MB no máximo
- Recomendado: ≤5 fotos para melhor performance

---

## 💡 Dicas

1. **Foto de qualidade:** Boa luz, ângulo reto, texto legível
2. **Múltiplas fotos:** Útil para cupons longos (cortar em partes)
3. **Deduplicação:** Automática mas com validação híbrida (usuário aprova)
4. **Processamento:** ~5-10 segundos por foto (depende do dispositivo)

---

## 📞 Suporte

Se der erro:
1. Checar console logs (`[Tesseract]`, `[OCR]`, `[API]`)
2. Verificar conexão com API
3. Tentar foto diferente se OCR falhar
4. Reiniciar app se ficar travado

