# 🚀 Quick Start - Receipt OCR

## 1️⃣ Backend

```bash
cd backend
npm run start:dev
# Deve estar em http://localhost:3000
```

## 2️⃣ Mobile

```bash
cd mobile
npm start
# Escanear com Expo Go
```

## 3️⃣ Navegar para Teste

- **InventoryScreen** → "Foto do Cupom Fiscal"
- Ou direto: `navigation.navigate('ReceiptMultiPhoto')`

## 4️⃣ Clicar "Teste com 3 cupons"

```
🧪 Modo Teste (sem fotos)
 └─ [Teste com 3 cupons]
```

## 5️⃣ Observar Fluxo

```
Processing  (simula OCR de 3 cupons)
    ↓
Review      (mostra deduplicação - 6-8 duplicatas)
    ↓
Success     (confirma itens extraídos)
```

---

## ✅ Resultado Esperado

**Stats:**
- 📊 28 itens processados
- ✂️ 6-8 duplicatas removidas
- 📋 20-22 itens únicos

**Duplicatas detectadas:**
- CAFE MORGES VACUO 500G (2x)
- AGUA MIN BIOLEUE PRIME (2x)
- BOLO PANCO ABACAXI 300G (3x)

---

## 🐛 Troubleshooting

### Backend 404
```
ERROR: Request failed with status code 404
```
✅ Solução: Backend não está rodando
```bash
cd backend && npm run start:dev
```

### Syntax Error
```
SyntaxError: Identifier has already been declared
```
✅ Solução: Atualize o código
```bash
git pull origin main
npm install
```

### Tesseract null
```
ERROR: [Tesseract] Module not properly loaded: null
WARN: [Tesseract] Usando fallback com texto mockado
```
✅ Esperado! Use modo teste (não precisa Tesseract nativo)

---

## 📱 Com Fotos Reais

Quando Tesseract funcionar:

1. **Capture fotos** (câmera ou galeria)
2. **Clique "Processar"**
3. **Sistema extrai OCR** (Tesseract)
4. **Backend deduplica**
5. **Review + Confirm**

---

## 🎯 Próximos Passos

- [ ] Testar modo teste (3 cupons)
- [ ] Testar com fotos reais (se Tesseract funcionar)
- [ ] Salvar itens em inventário
- [ ] Integrar com receitas
- [ ] Histórico de cupons

---

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| `RECEIPT_OCR_TEST_MODE.md` | Como testar sem fotos |
| `RECEIPT_OCR_COMPLETE_SETUP.md` | Sistema completo |
| `RECEIPT_OCR_GUIDE.md` | API endpoints |
| `RECEIPT_OCR_MOBILE_INTEGRATION.md` | Integração mobile |

---

## 💡 Dica

**Modo teste é perfeito para:**
- ✅ Desenvolver
- ✅ Testar deduplicação
- ✅ Demonstrar funcionalidade
- ✅ CI/CD

**Pronto para usar!** 🎉

