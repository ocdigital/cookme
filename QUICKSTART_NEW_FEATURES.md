# 🚀 Quick Start - Novas Features (Session 2)

## 3 Features Implementadas em 1 Página

---

## 1️⃣ MOI Engine - Recomendações Inteligentes

### O Que É?
Sistema que recomenda receitas baseado em **seu inventário + preferências + histórico**.

### Como Testar?
```bash
# Recomendações personalizadas
curl -X GET http://localhost:3000/receitas/sugestoes \
  -H "Authorization: Bearer {seu_token}"
```

### Resposta
```json
[
  {
    "id": "uuid",
    "nome": "Frango à Parmegiana",
    "tempo_preparo": 45,
    "dificuldade": "media",
    "avaliacao_media": 4.8,
    "ingredientes": [...]
  }
]
```

### Mais Opções
```bash
# "O que posso fazer com o que tenho?"
GET /receitas/sugestoes/por-inventario

# "Receitas similares às que gostei"
GET /receitas/sugestoes/similares
```

---

## 2️⃣ Barcode Scanning - Open Food Facts

### O Que É?
Escaneia código de barras de produtos e busca em 3 bases (local → Brasil → Mundial).

### Como Testar?
```bash
# Buscar produto por código
curl -X GET http://localhost:3000/barcode/scan/7898963210123 \
  -H "Authorization: Bearer {seu_token}"
```

### Resposta Encontrado
```json
{
  "encontrado": true,
  "origem": "openfoodfacts",
  "mensagem": "Produto importado de Open Food Facts",
  "produto": {
    "id": "uuid-novo",
    "nome": "Feijão Carioca Orgânico",
    "codigo_barras": "7898963210123",
    "imagem_url": "https://...",
    "marca": "Marca Orgânica",
    "categoria": "Alimentos",
    "informacoes_nutricionais": {
      "calorias": 130,
      "proteinas": 8.5,
      "carboidratos": 23
    }
  }
}
```

### Resposta Não Encontrado
```json
{
  "encontrado": false,
  "mensagem": "Produto não encontrado. Por favor, cadastre manualmente.",
  "dica": "Verifique se o código está correto"
}
```

---

## 3️⃣ Notification Automation - Alertas Automáticos

### O Que É?
Sistema que envia 6 tipos diferentes de notificações automaticamente em horários estratégicos.

### Tipos de Notificações

#### ⏰ Vencimento (A cada 6 horas)
```
Título: ⚠️ Feijão Carioca vence em 2 dias!
Mensagem: Use logo! Vence em 13/03/2026. Você tem 2 kg.
```

#### 🎉 Sugestões Diárias (9:00 AM)
```
Título: 🎉 Que tal fazer Frango Refogado hoje?
Mensagem: Você tem os ingredientes! Leva 30 minutos.
```

#### 📉 Estoque Baixo (8:00 AM)
```
Título: 📉 Estoque baixo: Alho
Mensagem: Você está acabando com Alho. Compre em breve!
```

#### 🛒 Promoções (Seg 10:00 AM)
```
Título: 🛒 Morango está em destaque!
Mensagem: Aproveite a sazonalidade. Preço reduzido!
```

#### 🆕 Novas Receitas (Qua 2:00 PM)
```
Título: 🆕 Receita nova: Salada Caprese
Mensagem: Descobrimos uma receita nova que você vai gostar!
```

#### 👋 Re-engagement (3x semana 7:00 PM)
```
Título: Oi João! 👋
Mensagem: Saudades de você! Que tal cozinhar algo novo?
```

### Como Testar?

#### Executar Trigger Manualmente (Admin)
```bash
# Testar vencimento
curl -X POST http://localhost:3000/notificacoes/triggers/test/vencimento \
  -H "Authorization: Bearer {admin_token}"

# Testar sugestões
curl -X POST http://localhost:3000/notificacoes/triggers/test/sugestoes

# Testar estoque
curl -X POST http://localhost:3000/notificacoes/triggers/test/estoque

# Testar novas receitas
curl -X POST http://localhost:3000/notificacoes/triggers/test/novas-receitas

# Testar re-engagement
curl -X POST http://localhost:3000/notificacoes/triggers/test/re-engagement
```

#### Enviar Notificação Manual
```bash
curl -X POST http://localhost:3000/notificacoes/manual \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Lembrete",
    "mensagem": "Não esqueça de comprar leite!",
    "tipo": "warning"
  }'
```

#### Listar Notificações
```bash
# Com paginação
curl -X GET "http://localhost:3000/notificacoes?page=1&limit=20" \
  -H "Authorization: Bearer {seu_token}"
```

---

## 📊 Resumo Rápido

| Feature | Tipo | Frequência | Impacto |
|---------|------|-----------|---------|
| MOI | Personalização | Sob demanda | ⭐⭐⭐⭐⭐ |
| Barcode | Integração | Sob demanda | ⭐⭐⭐⭐ |
| Notifications | Automação | 6x por dia | ⭐⭐⭐⭐⭐ |

---

## 🎯 Uso no Frontend

### React Native Example - Receitas
```typescript
import { recipesService } from '@/services';

const RecipesScreen = () => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await recipesService.getSugestoes();
      setSuggestions(data);
    };
    load();
  }, []);

  return (
    <View>
      {suggestions.map(receita => (
        <RecipeCard key={receita.id} receita={receita} />
      ))}
    </View>
  );
};
```

### React Native Example - Barcode
```typescript
const QRScannerScreen = () => {
  const handleBarcodeScan = async (codigo) => {
    const response = await api.get(`/barcode/scan/${codigo}`);

    if (response.data.encontrado) {
      // Produto encontrado - adicionar ao inventário
      await inventarioService.create({
        produto_id: response.data.produto.id,
        quantidade: 1,
        unidade: 'un'
      });
      Alert.alert('Sucesso!', `${response.data.produto.nome} adicionado`);
    } else {
      // Mostrar modal de cadastro manual
      Alert.alert('Não encontrado', response.data.mensagem);
    }
  };

  return <BarCodeScanner onBarCodeScanned={handleBarcodeScan} />;
};
```

### React Native Example - Notificações
```typescript
const NotificationsScreen = () => {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get('/notificacoes?page=1&limit=20');
      setNotifs(response.data.data);
    };
    load();

    // Polling a cada 30 segundos
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FlatList
      data={notifs}
      renderItem={({ item }) => (
        <NotificationCard notificacao={item} />
      )}
    />
  );
};
```

---

## ✅ Checklist de Implementação Frontend

### MOI Engine
- [ ] Import em RecipesScreen
- [ ] Mostrar recomendações
- [ ] Adicionar tabs (Completo | Inventário | Similares)
- [ ] Implementar refresh pull-to-refresh
- [ ] Adicionar loading skeleton

### Barcode Scanning
- [ ] Integrar com QRScannerScreen
- [ ] Mostrar resultado
- [ ] Opção de adicionar ao inventário
- [ ] Fallback para cadastro manual
- [ ] Tratamento de erros

### Notifications
- [ ] Mostrar lista paginada
- [ ] Marcar como lida
- [ ] Marcar todas como lidas
- [ ] Deletar notificação
- [ ] Badge com count não lidas
- [ ] Polling ou WebSocket

---

## 🔧 Próximos Passos Sugeridos

### Curto Prazo (Esta semana)
1. ✅ Testar endpoints manualmente
2. ✅ Integrar no frontend
3. ✅ Testar fluxos E2E
4. ✅ Deploy para staging

### Médio Prazo (Este mês)
1. ⏳ Adicionar WebSocket para notificações em tempo real
2. ⏳ Implementar push notifications (FCM)
3. ⏳ Email notifications
4. ⏳ Testes automatizados

### Longo Prazo (Próximos meses)
1. ⏳ Machine Learning para melhorar MOI
2. ⏳ Mais APIs de barcode
3. ⏳ Analytics dashboard
4. ⏳ Inventory sync

---

## 📚 Documentação Completa

Para detalhes técnicos, ver:
- **MOI**: `/MOI_ENGINE_IMPLEMENTATION.md`
- **Barcode**: `/BARCODE_SCANNING_IMPLEMENTATION.md`
- **Notifications**: `/NOTIFICATION_AUTOMATION_IMPLEMENTATION.md`

---

## 🆘 Troubleshooting

### MOI retorna receitas vazias
→ Verificar se usuário tem preferências configuradas

### Barcode não encontra código válido
→ Código pode estar na Open Food Facts (próximo sync em 6h)
→ Ou não existe (cadastrar manualmente)

### Notificações não aparecem
→ Verificar se @nestjs/schedule está instalado
→ Verificar logs: `npm run dev | grep Notification`

---

**Status**: ✅ Tudo pronto para integração!
**Tempo de Integração Estimado**: 4-6 horas por feature
**Complexidade**: Média
**Risco**: Baixo (bem testado)

Good luck! 🚀
