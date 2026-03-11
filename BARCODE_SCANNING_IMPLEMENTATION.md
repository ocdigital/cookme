# Barcode Scanning com Open Food Facts - Implementação Completa

## 📋 Resumo Executivo

O sistema de código de barras do CookMe foi completamente implementado com suporte a **Open Food Facts**, permitindo:

- ✅ Busca rápida em banco de dados local
- ✅ Fallback automático para Open Food Facts Brasil
- ✅ Fallback para Open Food Facts Mundial
- ✅ Auto-importação de produtos da API para cache local
- ✅ Extração automática de informações nutricionais
- ✅ Detecção de tags (vegano, sem-gluten, etc)
- ✅ Tratamento elegante de erros de conexão

---

## 🏗️ Arquitetura

### Serviço Principal: BarcodeService

**Localização**: `/backend/src/modules/barcode/barcode.service.ts`

#### Fluxo de Busca (3 Camadas)

```
┌─────────────────────────────────────┐
│  Usuario escaneia código de barras   │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  Camada 1: Banco Local   │
    │  (Rápido - Cache)        │
    └──────┬───────────────────┘
           │
      ┌────┴─────┐
      │           │
     SIM        NÃO
      │           │
      ▼           ▼
   Retornar  ┌──────────────────────────────────┐
   Produto   │  Camada 2: Open Food Facts Brasil│
   Local     │  (Timeout: 5 segundos)           │
             └──────┬───────────────────────────┘
                    │
               ┌────┴─────┐
               │           │
              SIM        NÃO
               │           │
               ▼           ▼
            Salvar    ┌──────────────────────────────┐
            Local e   │ Camada 3: Open Food Facts    │
            Retornar  │ Mundial (Timeout: 5s)        │
                      └──────┬───────────────────────┘
                             │
                        ┌────┴─────┐
                        │           │
                       SIM        NÃO
                        │           │
                        ▼           ▼
                     Salvar      Retornar
                     Local e    "Não encontrado"
                     Retornar
```

---

## 🔌 Endpoint da API

### **GET /barcode/scan/:codigo**

Busca produto por código de barras com fallback automático

**Autenticação**: Opcional (recomendado)

**Parâmetros**:
- `codigo` (string, obrigatório): Código de barras (EAN-13, UPC, etc)

**Exemplos de Resposta**:

#### ✅ Encontrado no Banco Local (Cache)
```json
{
  "encontrado": true,
  "origem": "local",
  "cache": true,
  "produto": {
    "id": "uuid-produto",
    "nome": "Feijão Carioca",
    "codigo_barras": "7898963210123",
    "imagem_url": "https://...",
    "marca": "Marca Local",
    "categoria": "Alimentos",
    "informacoes_nutricionais": {
      "calorias": 130,
      "proteinas": 8.5,
      "carboidratos": 23,
      "gorduras": 0.5
    },
    "tags": ["sem-gluten", "organico"]
  }
}
```

#### ✅ Encontrado em Open Food Facts (Importado)
```json
{
  "encontrado": true,
  "origem": "openfoodfacts",
  "cache": false,
  "mensagem": "Produto importado de Open Food Facts",
  "produto": {
    "id": "uuid-novo-produto",
    "nome": "Arroz Integral Orgânico",
    "codigo_barras": "7891234567890",
    "imagem_url": "https://images.openfoodfacts.org/...",
    "marca": "Marca Importada",
    "categoria": "Cereais",
    "informacoes_nutricionais": {
      "calorias": 112,
      "proteinas": 2.6,
      "carboidratos": 24.9,
      "gorduras": 0.9,
      "fibras": 1.8,
      "sodio": 5
    },
    "tags": ["organico", "vegano", "sem-gluten", "nutriscore-a"]
  }
}
```

#### ❌ Não Encontrado
```json
{
  "encontrado": false,
  "origem": "none",
  "codigo": "9999999999999",
  "mensagem": "Produto não encontrado em nossas bases. Por favor, cadastre manualmente.",
  "dica": "Verifique se o código está correto"
}
```

#### ⚠️ Erro de Conexão (Com Cache Local)
```json
{
  "encontrado": true,
  "origem": "local",
  "aviso": "APIs externas indisponíveis, usando cache local",
  "produto": {
    "id": "uuid-local",
    "nome": "Feijão Carioca",
    "codigo_barras": "7898963210123"
  }
}
```

#### 🔧 Erro (Sem Cache)
```json
{
  "encontrado": false,
  "origem": "error",
  "codigo": "1234567890123",
  "mensagem": "Erro ao consultar base de dados. Tente novamente em alguns instantes.",
  "erro": "[Apenas em desenvolvimento]"
}
```

---

## 📊 Fluxo Detalhado

### 1️⃣ Validação e Normalização

```typescript
// Entrada
codigo = "  7898963210123  "

// Normalização
codigoNormalizado = "7898963210123"
```

### 2️⃣ Busca no Banco Local

```typescript
const produtoLocal = await produtosService.findByBarcode(codigoNormalizado);

// Se encontrado → Retorna imediatamente (mais rápido)
// Se não encontrado → Continua para API
```

### 3️⃣ Busca em Open Food Facts Brasil

```typescript
const url = 'https://br.openfoodfacts.org/api/v0/product/7898963210123.json'

// Resposta esperada:
{
  "status": 1,  // 1 = encontrado, 0 = não encontrado
  "product": {
    "id": "7898963210123",
    "name": "Feijão Carioca Orgânico",
    "brands": "Marca do Brasil",
    "categories": "Legumes, Alimentos de origem vegetal",
    "nutriments": {
      "energy-kcal": 130,
      "proteins": 8.5,
      "carbohydrates": 23.4,
      "fat": 0.5,
      "fiber": 5.2,
      "sodium": 4
    },
    "image_front_url": "https://images.openfoodfacts.org/...",
    "allergens": "Pode conter traços de glúten"
  }
}
```

### 4️⃣ Extração de Dados

Para cada campo do Open Food Facts, aplicar transformação:

| Origem | Destino | Transformação |
|--------|---------|---------------|
| `name` | `nome` | Direto |
| `generic_name` | `descricao` | Se `name` vazio |
| `brands` | `marca` | Pegar primeira marca |
| `categories` | `categoria` | Pegar primeira categoria |
| `image_front_url` | `imagem_url` | Priorizar imagem frontal |
| `nutriments.*` | `informacoes_nutricionais` | Mapear campos nutricionais |
| `allergens_tags` | `tags` | Adicionar como tags |
| `nutriscore_grade` | `tags` | Adicionar como `nutriscore-{grade}` |

### 5️⃣ Detecção Automática de Tags

```typescript
// Analisar nome do produto para detectar características
const nome = "Pasta Integral Vegana Sem Glúten"

// Tags detectadas automaticamente:
- "vegano" (contém "vegan")
- "sem-gluten" (contém "gluten-free")
- "integral" (padrão customizado)
```

### 6️⃣ Salvamento no Banco Local

```typescript
// Criar marca se não existir
const marca = await findOrCreateMarca("Marca do Brasil")

// Criar categoria se não existir
const categoria = await findOrCreateCategoria("Legumes")

// Salvar produto
const produtoSalvo = await produtosService.create({
  nome: "Feijão Carioca Orgânico",
  codigo_barras: "7898963210123",
  marca_id: marca.id,
  categoria_id: categoria.id,
  origem: "api_openfoodfacts",
  verificado: false,  // Produtos de API precisam revisão
  ...outrosCampos
})
```

---

## 💡 Implementação no Frontend

### Mobile (React Native)

```typescript
import { api } from '@/services';

async function scanarProduto(codigo: string) {
  try {
    const response = await api.get(`/barcode/scan/${codigo}`);

    const { encontrado, produto, origem, mensagem } = response.data;

    if (encontrado) {
      // Adicionar ao inventário
      await inventarioService.create({
        produto_id: produto.id,
        quantidade: 1,
        unidade: 'un',
        data_validade: calcularDataValidade(produto),
      });

      // Mostrar notificação
      Alert.alert('Sucesso!', `${produto.nome} adicionado ao inventário`);

      // Se veio de API, avisar que foi importado
      if (origem === 'openfoodfacts') {
        Alert.alert(
          'Produto Importado',
          'Este produto foi importado de Open Food Facts e pode precisar revisão'
        );
      }
    } else {
      // Mostrar opção de cadastro manual
      Alert.alert(
        'Produto não encontrado',
        mensagem,
        [
          { text: 'Cadastrar Manualmente', onPress: () => openAddProductModal() },
          { text: 'Cancelar' }
        ]
      );
    }
  } catch (error) {
    Alert.alert('Erro', 'Falha ao processar código de barras');
  }
}
```

### Tela de Adicionar Produtos

```typescript
function QRScannerScreen() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBarcodeScan = async (scannedCode: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/barcode/scan/${scannedCode}`);

      if (response.data.encontrado) {
        // Mostrar produto encontrado
        showProductDetails(response.data.produto);
      } else {
        // Mostrar formulário de cadastro manual
        showManualForm(scannedCode);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BarCodeScanner
      onBarCodeScanned={({ data }) => handleBarcodeScan(data)}
      style={{ flex: 1 }}
    />
  );
}
```

---

## 🔐 Recursos de Segurança

### 1. Validação de Entrada
```typescript
if (!codigo || codigo.trim().length === 0) {
  throw new BadRequestException('Código de barras inválido');
}
```

### 2. Timeout em APIs Externas
```typescript
timeout: 5000  // 5 segundos máximo
```

### 3. Fallback Gracioso
- Se API externa cair → Usar cache local
- Se cache vazio → Retornar "Não encontrado"
- Nunca lançar exceção ao usuário

### 4. Mascaramento de Erros em Produção
```typescript
erro: process.env.NODE_ENV === 'development' ? error.message : undefined
```

### 5. Logging Detalhado
```typescript
this.logger.log(`Código ${codigoNormalizado} encontrado no banco local`);
this.logger.warn(`Código ${codigoNormalizado} não encontrado em nenhuma API`);
this.logger.error(`Erro ao buscar código ${codigoNormalizado}:`, error.message);
```

---

## 🎯 Casos de Uso

### Caso 1: Produto Popular (Cache Hit)
```
┌─────────────────────────────┐
│ Usuário escaneia "789..."   │
└────────────────┬────────────┘
                 │
                 ▼
         ✅ Encontrado localmente
                 │
                 ▼
         ⚡ Retorna em < 100ms
```

### Caso 2: Produto Novo (API)
```
┌─────────────────────────────┐
│ Usuário escaneia "999..."   │
└────────────────┬────────────┘
                 │
                 ▼
         ❌ Não está localmente
                 │
                 ▼
         🌐 Consulta Open Food Facts Brasil
                 │
                 ▼
         ✅ Encontrado! "Arroz Tipo 1"
                 │
                 ▼
         💾 Salva no banco local
                 │
                 ▼
         ⚡ Retorna em ~2-3 segundos
```

### Caso 3: Produto Desconhecido (Not Found)
```
┌─────────────────────────────┐
│ Usuário escaneia "111..."   │
└────────────────┬────────────┘
                 │
                 ▼
         ❌ Não está localmente
                 │
                 ▼
         🌐 Consulta Open Food Facts Brasil
                 │
                 ▼
         ❌ Não encontrado
                 │
                 ▼
         🌐 Consulta Open Food Facts Mundial
                 │
                 ▼
         ❌ Não encontrado
                 │
                 ▼
         📝 Retorna "Não encontrado"
         💡 Sugere cadastro manual
```

### Caso 4: Sem Conexão de Internet
```
┌─────────────────────────────┐
│ Usuário escaneia "789..."   │
│ (Mas sem internet)          │
└────────────────┬────────────┘
                 │
                 ▼
         ✅ Encontrado localmente
                 │
                 ▼
         ⚠️ Aviso: "Usando cache local"
                 │
                 ▼
         ⚡ Retorna dados em cache
```

---

## 📈 Métricas de Performance

| Cenário | Tempo Esperado | Status |
|---------|---|---|
| Cache Hit (Local) | < 100ms | ✅ |
| API Hit (Brasil) | 1-2s | ✅ |
| API Hit (Mundial) | 2-3s | ✅ |
| Timeout | 5s | ✅ |
| Sem conexão + Cache | < 100ms | ✅ |
| Sem conexão + Sem Cache | 5s | ✅ |

---

## 🐛 Troubleshooting

### Problema: Código não encontrado em local, mas deveria estar
**Causa**: Produto foi importado com `origem: 'api_openfoodfacts'`
**Solução**: Verificar no banco se `codigo_barras` está correto e único

### Problema: API lenta ou timeout
**Causa**: Open Food Facts pode estar lento ou indisponível
**Solução**: Sistema automáticamente usa cache local ou retorna "Não encontrado"

### Problema: Produto importado com informações incompletas
**Causa**: Open Food Facts não tem todos os dados
**Solução**: Usuário pode editar produto manualmente após importação

### Problema: Marca ou categoria duplicada
**Causa**: `findOrCreateMarca` não funcionando corretamente
**Solução**: Verificar índices únicos no banco de dados

---

## 🚀 Próximas Melhorias

### Fase 2
- [ ] Cache em Redis para melhor performance
- [ ] Batch processing de códigos
- [ ] Histórico de buscas do usuário
- [ ] Produtos salvos como favoritos

### Fase 3
- [ ] Integração com outras APIs (UPC Database, EPC, etc)
- [ ] Machine Learning para classificação automática
- [ ] Sugestões de alternativas mais baratas
- [ ] Preços históricos por código

### Fase 4
- [ ] OCR para leitura de dados nutricionais de imagens
- [ ] Integração com lojas locais para preços reais
- [ ] Alertas de recall de produtos
- [ ] Sincronização com redes de farmácias

---

## 📚 Referências

### Open Food Facts
- **Site**: https://openfoodfacts.org
- **API Brasil**: https://br.openfoodfacts.org/api/v0/product
- **API Mundial**: https://world.openfoodfacts.org/api/v0/product
- **Documentação**: https://wiki.openfoodfacts.org/API
- **Licença**: ODbL (Open Data Commons)

### Formatos de Código de Barras Suportados
- **EAN-13**: 13 dígitos (padrão Europa)
- **EAN-8**: 8 dígitos (compactado)
- **UPC-A**: 12 dígitos (padrão USA)
- **UPC-E**: 6-8 dígitos (compactado USA)
- **GS1-128**: Código 128 com prefixo GS1
- **ISBN-13**: 13 dígitos (livros)

---

**Status**: ✅ **PRODUÇÃO - v1.0**
**Data de Implementação**: Março 2026
**Desenvolvedor**: Eduardo Ferreira
**Última Atualização**: Março 11, 2026
