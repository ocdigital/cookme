# 🧪 Receipt OCR - Modo Teste

## Problema
Tesseract nativo pode não compilar corretamente em todos os ambientes. Solução: **Modo Teste com dados mockados**.

---

## ✅ Como Testar Sem Fotos Reais

### 1. **Abrir o App**
```bash
cd mobile
npm start
# Escanear com Expo Go
```

### 2. **Navegar para Capturar Cupom**
- Inventory Screen → "Foto do Cupom Fiscal"
- Ou direto: `navigation.navigate('ReceiptMultiPhoto')`

### 3. **Clique em "Teste com 3 cupons"**
- Botão azul: 🧪 Modo Teste (sem fotos)
- Não precisa capturar fotos reais
- Sistema usa dados mockados

### 4. **Observe o Fluxo**
```
"Teste com 3 cupons"
         ↓
Processing (simula OCR)
         ↓
Review (mostra deduplicação)
         ↓
Success (confirma itens)
```

---

## 📊 Dados de Teste

Três cupons mockados são usados:

### Cupom 1 (Grande) - 22 itens
```
BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
AGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76
... (19 itens mais)
```

### Cupom 2 (Médio) - 14 itens
```
BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
... (12 itens mais)
```

### Cupom 3 (Pequeno) - 8 itens
```
BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
AGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76
... (5 itens mais)
```

---

## 🎯 Esperar na Tela de Review

**Resultado esperado:**
- ✅ ~20-22 itens únicos
- ✅ ~6-8 duplicatas detectadas
- ✅ ~28 itens processados
- ✅ Alguns itens duplicados (CAFE, AGUA, etc)

**Por que há duplicatas?**
- Cupom 1 (22 itens) + Cupom 2 (14 itens) + Cupom 3 (8 itens)
- Itens iguais aparecem em múltiplos cupons
- Sistema deduplica automaticamente

---

## 🔌 Backend Necessário

Modo teste precisa do **backend rodando**:

```bash
cd backend
npm run start:dev
# Deve estar em http://localhost:3000
```

Se backend não estiver rodando, erro na API:
```
[API] 📤 Enviando para deduplicação...
ERROR [API] ❌ Erro: Network request failed
```

---

## 📱 Modo Real (com Tesseract)

Se Tesseract compilar corretamente:

1. Adicionar fotos reais (câmera ou galeria)
2. Clicar "Processar (N)"
3. Sistema extrai OCR de cada foto
4. Backend deduplica
5. Review + Confirm

**Diferença:**
- Teste: OCR mockado (sempre funciona)
- Real: OCR Tesseract (precisa compilar native)

---

## 🐛 Troubleshooting

### Erro: "Network request failed"
- ✅ Backend não está rodando
- Solução: `cd backend && npm run start:dev`

### Erro: "Cannot read property 'recognizeImage' of null"
- ✅ Tesseract não está disponível (esperado)
- Use modo teste: clique em "Teste com 3 cupons"

### Nenhum botão "Teste com 3 cupons" aparecer
- Atualize o código: `git pull`
- Reinicie expo: `npm start` → `r`

### Erro na Review Screen
- Verificar logs do backend
- Conferir se `/api/receitas/ocr/process` existe
- Testar via curl:
  ```bash
  curl -X POST http://localhost:3000/api/receitas/ocr/process \
    -H "Content-Type: application/json" \
    -d '{
      "photos": [{
        "ocrText": "BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98",
        "photoNumber": 1
      }],
      "ignoreWarnings": false
    }'
  ```

---

## 📈 Próximos Passos

### Quando Tesseract Funcionar
1. Remover modo teste (ou deixar como fallback)
2. Usar OCR real com fotos reais
3. Testar deduplicação com cupons autênticos

### Integração Final
1. Salvar itens no inventário
2. Criar receita com itens extraídos
3. Histórico de cupons processados

---

## 💡 Dica

**Modo teste é perfeito para:**
- ✅ Desenvolver a UI
- ✅ Testar deduplicação
- ✅ Testar validação híbrida
- ✅ Testar backend
- ✅ Demonstrar funcionalidade
- ✅ CI/CD testing

**Modo real é para:**
- ✅ Usuários finais
- ✅ Dados reais
- ✅ Validação final

---

## 🚀 Resumo

1. **Sem fotos:** Clique "Teste com 3 cupons"
2. **Com fotos:** Capture + "Processar"
3. **Backend:** Deve estar rodando
4. **Result:** Review + Confirm + Success

**Status:** Pronto para testar! 🎉

