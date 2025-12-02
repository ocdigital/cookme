# Product Classification - Mobile Integration Guide

**For Mobile Team** - Quick start guide to integrate the intelligent product classification system into the React Native app.

---

## 📱 What the Mobile App Needs to Do

### 1. When User Adds a Product

```javascript
// Current flow:
User opens Inventory
  ↓
Clicks "Add Product" button
  ↓
Enters product name OR scans barcode
  ↓
Clicks "Add"
  ↓
Product saved to local inventory
```

### New Flow (with Classification):

```javascript
User opens Inventory
  ↓
Clicks "Add Product" button
  ↓
Enters product name OR scans barcode
  ↓
Calls: POST /api/product-classification/inventory/add
  ├─ Success + requerValidacaoUsuario = false
  │  ↓ Product added directly (food with high confidence)
  │
  ├─ Success = false + requerValidacaoUsuario = true
  │  ↓ Show ValidationModal (uncertain classification)
  │
  └─ Success = false + requerValidacaoUsuario = false
     ↓ Show error message (non-food item rejected)
```

---

## 🔌 API Endpoint to Use

### Add Product with Classification

**Endpoint**: `POST /api/product-classification/inventory/add`

**Headers**:
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body**:
```javascript
{
  "produto": "Maçã vermelha",           // Required: product name
  "quantidade": 5,                       // Optional: quantity
  "unidade": "unidades",                 // Optional: unit (unidades, kg, L, etc)
  "data_vencimento": "2025-12-31",      // Optional: expiry date (ISO 8601)
  "barcode": "123456789"                // Optional: barcode number
}
```

**Response - Successful (Food with High Confidence)**:
```javascript
{
  "sucesso": true,
  "produto": "Maçã vermelha",
  "categoria": "alimento",
  "confianca": 0.98,
  "requerValidacaoUsuario": false,
  "mensagem": "Produto 'Maçã vermelha' adicionado ao inventário como alimento"
}
```

**Response - Requires Validation (Uncertain)**:
```javascript
{
  "sucesso": false,
  "produto": "Maçã",
  "categoria": "alimento",
  "confianca": 0.72,
  "requerValidacaoUsuario": true,
  "mensagem": "Não foi possível classificar 'Maçã' automaticamente (confiança: 72%). Por favor, confirme manualmente se é um alimento ou não."
}
```

**Response - Rejected (Non-Food)**:
```javascript
{
  "sucesso": false,
  "produto": "Detergente",
  "categoria": "nao_alimento",
  "confianca": 0.99,
  "requerValidacaoUsuario": false,
  "mensagem": "Produto 'Detergente' foi classificado como 'nao_alimento' (99% confiança). Este tipo de produto não pode ser adicionado ao inventário de alimentos."
}
```

---

## 🎨 UI Components Needed

### 1. ValidationModal Component

When `requerValidacaoUsuario === true`, show this modal:

```javascript
<ValidationModal
  productName="Maçã"
  message="Não foi possível classificar 'Maçã' automaticamente (72% confiança). É um alimento?"
  onConfirm={(isFood) => {
    // Call validate endpoint
    await fetch('/api/product-classification/validate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        produto: "Maçã",
        categoria: isFood ? "alimento" : "nao_alimento",
        comentario: "User validated manually"
      })
    });
    // Close modal and add to inventory
  }}
  onCancel={() => {
    // Dismiss modal, don't add product
  }}
/>
```

**Modal Layout**:
```
┌─────────────────────────────────────┐
│  Confirme o tipo de produto         │
├─────────────────────────────────────┤
│                                     │
│  Não foi possível classificar       │
│  "Maçã" automaticamente             │
│  (72% confiança)                    │
│                                     │
│  É um alimento?                     │
│                                     │
├─────────────────────────────────────┤
│  [Não, rejeitar]  [Sim, é alimento] │
└─────────────────────────────────────┘
```

### 2. Error Message Component

For rejected products:

```javascript
<AlertBox
  type="error"
  title="Produto não permitido"
  message="Detergente foi classificado como não-alimento (99% confiança). Este tipo de produto não pode ser adicionado."
  action={{
    label: "Ok",
    onPress: () => closeAlert()
  }}
/>
```

---

## 💻 Implementation Examples

### Option 1: Class Component (if using)

```javascript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';

export default class AddProductScreen extends React.Component {
  state = {
    productName: '',
    loading: false,
    showValidationModal: false,
    pendingProduct: null
  };

  addProduct = async () => {
    const { productName } = this.state;

    if (!productName.trim()) {
      Alert.alert('Erro', 'Digite o nome do produto');
      return;
    }

    this.setState({ loading: true });

    try {
      const response = await fetch(
        'http://localhost:3000/api/product-classification/inventory/add',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.props.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            produto: productName,
            quantidade: 1,
            unidade: 'unidades'
          })
        }
      );

      const data = await response.json();

      if (data.requerValidacaoUsuario) {
        // Show validation modal
        this.setState({
          showValidationModal: true,
          pendingProduct: data
        });
      } else if (data.sucesso) {
        // Product added successfully
        Alert.alert('Sucesso', data.mensagem);
        this.setState({ productName: '' });
        this.props.onProductAdded(data.produto);
      } else {
        // Product rejected (non-food)
        Alert.alert('Produto não permitido', data.mensagem);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao classificar produto');
      console.error(error);
    } finally {
      this.setState({ loading: false });
    }
  };

  validateProduct = async (isFood) => {
    const { pendingProduct } = this.state;

    try {
      const response = await fetch(
        'http://localhost:3000/api/product-classification/validate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.props.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            produto: pendingProduct.produto,
            categoria: isFood ? 'alimento' : 'nao_alimento',
            comentario: 'User validated via mobile app'
          })
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        Alert.alert('Sucesso', data.mensagem);
        this.props.onProductAdded(data.produto);
      } else {
        Alert.alert('Aviso', data.mensagem);
      }

      this.setState({
        showValidationModal: false,
        pendingProduct: null,
        productName: ''
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao validar produto');
      console.error(error);
    }
  };

  render() {
    const { productName, loading, showValidationModal, pendingProduct } = this.state;

    return (
      <View style={{ padding: 20 }}>
        <TextInput
          placeholder="Nome do produto"
          value={productName}
          onChangeText={(text) => this.setState({ productName: text })}
          editable={!loading}
        />

        <TouchableOpacity
          onPress={this.addProduct}
          disabled={loading}
          style={{ marginTop: 20, padding: 10, backgroundColor: '#007AFF' }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {loading ? 'Classificando...' : 'Adicionar Produto'}
          </Text>
        </TouchableOpacity>

        <Modal visible={showValidationModal} transparent>
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
                Confirme o tipo de produto
              </Text>

              <Text style={{ fontSize: 14, marginBottom: 20 }}>
                Não foi possível classificar "{pendingProduct?.produto}" automaticamente
                ({Math.round(pendingProduct?.confianca * 100)}% confiança).
              </Text>

              <Text style={{ fontSize: 14, marginBottom: 20, fontWeight: 'bold' }}>
                É um alimento?
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => this.validateProduct(false)}
                  style={{ flex: 1, padding: 12, backgroundColor: '#FF3B30', borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', textAlign: 'center' }}>Não, rejeitar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => this.validateProduct(true)}
                  style={{ flex: 1, padding: 12, backgroundColor: '#34C759', borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', textAlign: 'center' }}>Sim, é alimento</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}
```

### Option 2: Functional Component (React Hooks)

```javascript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';

export default function AddProductScreen({ token, onProductAdded }) {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const addProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Erro', 'Digite o nome do produto');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:3000/api/product-classification/inventory/add',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            produto: productName,
            quantidade: 1,
            unidade: 'unidades'
          })
        }
      );

      const data = await response.json();

      if (data.requerValidacaoUsuario) {
        setPendingProduct(data);
        setShowValidationModal(true);
      } else if (data.sucesso) {
        Alert.alert('Sucesso', data.mensagem);
        setProductName('');
        onProductAdded(data.produto);
      } else {
        Alert.alert('Produto não permitido', data.mensagem);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao classificar produto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateProduct = async (isFood) => {
    try {
      const response = await fetch(
        'http://localhost:3000/api/product-classification/validate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            produto: pendingProduct.produto,
            categoria: isFood ? 'alimento' : 'nao_alimento',
            comentario: 'User validated via mobile app'
          })
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        Alert.alert('Sucesso', data.mensagem);
        onProductAdded(data.produto);
      } else {
        Alert.alert('Aviso', data.mensagem);
      }

      setShowValidationModal(false);
      setPendingProduct(null);
      setProductName('');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao validar produto');
      console.error(error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Nome do produto"
        value={productName}
        onChangeText={setProductName}
        editable={!loading}
      />

      <TouchableOpacity
        onPress={addProduct}
        disabled={loading}
        style={{ marginTop: 20, padding: 10, backgroundColor: '#007AFF' }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Classificando...' : 'Adicionar Produto'}
        </Text>
      </TouchableOpacity>

      <Modal visible={showValidationModal} transparent>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Confirme o tipo de produto
            </Text>

            {pendingProduct && (
              <>
                <Text style={{ fontSize: 14, marginBottom: 20 }}>
                  Não foi possível classificar "{pendingProduct.produto}" automaticamente
                  ({Math.round(pendingProduct.confianca * 100)}% confiança).
                </Text>

                <Text style={{ fontSize: 14, marginBottom: 20, fontWeight: 'bold' }}>
                  É um alimento?
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => validateProduct(false)}
                    style={{ flex: 1, padding: 12, backgroundColor: '#FF3B30', borderRadius: 8 }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center' }}>Não, rejeitar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => validateProduct(true)}
                    style={{ flex: 1, padding: 12, backgroundColor: '#34C759', borderRadius: 8 }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center' }}>Sim, é alimento</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
```

---

## ⚙️ Configuration

### Backend URL
Replace `http://localhost:3000` with your actual backend URL:

**Development**: `http://192.168.1.xxx:3000` (your machine IP)
**Production**: `https://your-domain.com`

### JWT Token
Get the token from the login response and store it:

```javascript
// After login
const loginResponse = await fetch('/api/auth/login', {...});
const { access_token } = await loginResponse.json();
await AsyncStorage.setItem('userToken', access_token);

// In AddProductScreen
const token = await AsyncStorage.getItem('userToken');
```

---

## 🧪 Testing the Integration

### 1. Test with Known Products

```
Try these products:
- "Maçã" → Should be accepted (alimento)
- "Frango" → Should be accepted (alimento)
- "Detergente" → Should be rejected (nao_alimento)
- "Sabonete" → Should be rejected (nao_alimento)
- "Produto desconhecido XYZ" → Might need validation
```

### 2. Monitor Backend Logs

```bash
# In backend terminal
npm run start:dev

# Should see:
[22:30:15] Produto classificado via OpenAI: Maçã → alimento
[22:30:16] Validação registrada: Maçã - Usuário: xxx - Validação: alimento
```

### 3. Check Database

```sql
-- See all classified products
SELECT product_name, categoria, confidence_score, total_validacoes
FROM product_knowledge_base
ORDER BY criado_em DESC;

-- See API usage and costs
SELECT
  COUNT(*) as total_calls,
  SUM(CASE WHEN from_cache THEN 1 ELSE 0 END) as cache_hits,
  SUM(custo_estimado_usd) as total_cost
FROM ai_classification_logs
WHERE criado_em > NOW() - INTERVAL '24 hours';
```

---

## 🔍 Troubleshooting

### "Cannot connect to backend"
- Check that backend is running: `npm run start:dev`
- Use correct URL (192.168.1.xxx for local testing)
- Check CORS configuration in backend

### "401 Unauthorized"
- Ensure JWT token is included in Authorization header
- Token format: `Bearer eyJhbGciOiJIUzI1NiIs...`
- Check that token is not expired

### "Classification takes too long"
- First classification (not cached): ~200-500ms
- Repeat classifications (cached): <50ms
- If slow, might be API throttling - add retry logic

### Product keeps getting rejected
- Might be misclassified by AI
- User can provide feedback to improve confidence
- Wait for more validations to build confidence

---

## 📊 Monitoring Dashboard (Future)

You'll be able to monitor:
- Total products classified
- Cache hit rate
- API costs
- Classification accuracy
- Most disputed products
- User validation trends

See [IMPLEMENTATION_REPORT.md](./backend/src/modules/product-classification/IMPLEMENTATION_REPORT.md) for details.

---

## 🚀 Performance Tips

1. **Cache Results Locally** - Store classification results in AsyncStorage to avoid API calls
2. **Batch Upload** - If importing from receipt, use batch endpoint: `POST /api/product-classification/classify-batch`
3. **Show Loading State** - Use spinner while classifying
4. **Debounce Requests** - Don't call API for every keystroke

---

## 📞 Questions?

See the full documentation:
- [PHASE_1_IMPLEMENTATION_SUMMARY.md](./PHASE_1_IMPLEMENTATION_SUMMARY.md)
- [IMPLEMENTATION_REPORT.md](./backend/src/modules/product-classification/IMPLEMENTATION_REPORT.md)
- [STRATEGY_PRODUCT_CLASSIFICATION.md](./backend/src/modules/product-classification/STRATEGY_PRODUCT_CLASSIFICATION.md)

---

**Ready to integrate!** 🎉
