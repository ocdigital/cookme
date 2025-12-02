# Product Classification System - Quick Reference Card

**Print this or keep it on your desk!** ⚡

---

## 🔌 API Endpoints at a Glance

### Classification
```bash
# Classify a single product
GET /api/product-classification/classify/Maçã

# Classify multiple products
POST /api/product-classification/classify-batch
Body: { "produtos": ["Maçã", "Detergente"] }
```

### Inventory
```bash
# Add product (with intelligent filtering)
POST /api/product-classification/inventory/add
Body: { "produto": "Maçã", "quantidade": 5, "unidade": "unidades" }

# Validate classification (from modal)
POST /api/product-classification/validate
Body: { "produto": "Maçã", "categoria": "alimento" }
```

### Analytics
```bash
# Get stats
GET /api/product-classification/statistics

# Get history of a product
GET /api/product-classification/history/Maçã

# Get all food products
GET /api/product-classification/alimentos

# Get all non-food products
GET /api/product-classification/nao-alimentos
```

---

## 📊 Response Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Process response normally |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check JWT token |
| 404 | Not Found | Product doesn't exist |
| 500 | Server Error | Check backend logs |

---

## 🏗️ File Structure

```
backend/src/modules/product-classification/
├── entities/
│   ├── product-knowledge-base.entity.ts     (AI Cache)
│   ├── product-validation.entity.ts         (User Feedback)
│   └── ai-classification-log.entity.ts      (Cost Tracking)
├── services/
│   ├── product-classification.service.ts    (Core Logic)
│   └── intelligent-inventory.service.ts     (Validation)
├── controllers/
│   └── product-classification.controller.ts (8 Endpoints)
└── product-classification.module.ts         (Module Config)
```

---

## 🎯 Decision Tree

```
User adds product
  ↓
API checks ProductKnowledgeBase cache
  ├─ Found with confidence ≥ 75%
  │  ├─ ALIMENTO → Add to inventory ✅
  │  └─ NAO_ALIMENTO → Reject ❌
  │
  └─ Not found OR confidence < 75%
     ├─ Call OpenAI API
     ├─ Save result to cache
     ├─ Result: ALIMENTO + high confidence → Add ✅
     ├─ Result: NAO_ALIMENTO + high confidence → Reject ❌
     └─ Result: Low confidence → Show ValidationModal ⚠️
```

---

## 💾 Database Tables

**product_knowledge_base**
- Stores AI cache with confidence scores
- Key: `product_name`, `normalized_name`
- Index: confidence_score, categoria

**product_validations**
- User feedback for each classification
- FK: product_knowledge_id, usuario_id
- Grows as users validate products

**ai_classification_logs**
- Every OpenAI API call logged
- Track: tokens, cost, response time, status
- Use for monitoring and billing

---

## ⚙️ Configuration

**Environment Variables**:
```env
OPENAI_API_KEY=sk-your-key-here
```

**Thresholds**:
```typescript
const CONFIDENCE_THRESHOLD = 0.75  // 75% confidence needed for cache hit
```

**OpenAI Model**:
```typescript
const MODEL = 'gpt-4-turbo'        // Fast and accurate
const TEMPERATURE = 0.3             // Low randomness
```

---

## 🧪 Quick Test

```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Test endpoint
curl -X GET http://localhost:3000/api/product-classification/classify/Maçã \
  -H "Authorization: Bearer YOUR_JWT"

# Expected response
{
  "categoria": "alimento",
  "confidence": 0.98,
  "fromCache": true,
  "descricao": "Fruta vermelha comestível"
}
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Cannot connect to backend" | Check if `npm run start:dev` is running |
| "401 Unauthorized" | Add JWT token to Authorization header |
| "Product rejected" | It was classified as non-food (detergente, etc) |
| "Slow response" | First classification calls OpenAI (~500ms) |
| "High costs" | Cache hit rate is low; more usage = better caching |

---

## 📈 Key Metrics to Monitor

```sql
-- Cache hit rate (target > 80%)
SELECT
  COUNT(*) total,
  SUM(CASE WHEN from_cache THEN 1 ELSE 0 END) hits,
  ROUND(SUM(CASE WHEN from_cache THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) hit_rate
FROM ai_classification_logs

-- Total API cost
SELECT SUM(custo_estimado_usd) FROM ai_classification_logs

-- Average confidence
SELECT AVG(confidence_score) FROM product_knowledge_base

-- Most validated products
SELECT product_name, total_validacoes
FROM product_knowledge_base
ORDER BY total_validacoes DESC
LIMIT 10
```

---

## 🚀 Performance Tips

1. **Cache locally** (mobile) - Store results in AsyncStorage
2. **Batch requests** - Use batch endpoint for multiple products
3. **Show loading state** - API takes time on first call
4. **Retry failed calls** - Network may be flaky

---

## 🔐 Security Checklist

- [x] JWT authentication on all endpoints
- [x] Input validation on all requests
- [x] Error messages don't leak secrets
- [x] Database constraints prevent invalid data
- [ ] Rate limiting (coming in Phase 2)
- [ ] HTTPS enforced (production only)

---

## 📚 Documentation Map

| Document | Purpose | Who |
|----------|---------|-----|
| [PHASE_1_IMPLEMENTATION_SUMMARY.md](./PHASE_1_IMPLEMENTATION_SUMMARY.md) | Overview | Everyone |
| [IMPLEMENTATION_REPORT.md](./backend/src/modules/product-classification/IMPLEMENTATION_REPORT.md) | Technical details | Developers |
| [PRODUCT_CLASSIFICATION_MOBILE_INTEGRATION.md](./PRODUCT_CLASSIFICATION_MOBILE_INTEGRATION.md) | Mobile examples | Mobile team |
| [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) | Task tracking | Project manager |
| [STRATEGY_PRODUCT_CLASSIFICATION.md](./backend/src/modules/product-classification/STRATEGY_PRODUCT_CLASSIFICATION.md) | Design rationale | Architects |

---

## 🎓 Key Concepts

**Classification**: AI determines if product is food or non-food
**Confidence**: How sure the AI is (0.0 to 1.0)
**Cache**: Stores known products to avoid API calls
**Validation**: User confirms/corrects AI classification
**Learning**: System improves confidence from validations
**Cost**: Tracks OpenAI API spending per product

---

## 📞 Support

**Questions about code?**
→ See [IMPLEMENTATION_REPORT.md](./backend/src/modules/product-classification/IMPLEMENTATION_REPORT.md)

**Questions about integration?**
→ See [PRODUCT_CLASSIFICATION_MOBILE_INTEGRATION.md](./PRODUCT_CLASSIFICATION_MOBILE_INTEGRATION.md)

**Questions about strategy?**
→ See [STRATEGY_PRODUCT_CLASSIFICATION.md](./backend/src/modules/product-classification/STRATEGY_PRODUCT_CLASSIFICATION.md)

**Want to see progress?**
→ See [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)

---

## 🎯 Next Phase

**Mobile Integration** (2-3 weeks):
1. Create AddProductScreen
2. Show ValidationModal for uncertain products
3. Integrate with inventory system
4. Test end-to-end

---

**Status**: ✅ PRODUCTION READY
**Last Updated**: November 11, 2025
**Questions?** Check the documentation map above!
