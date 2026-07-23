# CookMe - Plano Técnico de Monetização 🛠️

## Arquitetura Técnica para Monetização

### 1. Estrutura de Banco de Dados Expandida

```sql
-- Tabela de Recomendações Monetizadas
CREATE TABLE receita_recomendacoes (
    id UUID PRIMARY KEY,
    receita_id UUID REFERENCES receitas(id),
    usuario_id UUID REFERENCES usuarios(id),
    ingredientes_faltantes JSON, -- Lista de ingredientes que faltam
    preco_estimado DECIMAL(10,2),
    categoria_recomendacao VARCHAR(50), -- 'com_seus_alimentos', 'incentivar_compra'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Afiliados
CREATE TABLE affiliate_links (
    id UUID PRIMARY KEY,
    receita_id UUID REFERENCES receitas(id),
    supermarket_id UUID,
    supermarket_name VARCHAR(255),
    affiliate_url TEXT,
    comissao_percentual DECIMAL(5,2), -- 2%, 5%, etc
    comissao_por_clique DECIMAL(10,2), -- R$ 0,20, R$ 0,50
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);

-- Tabela de Cliques em Links de Afiliados
CREATE TABLE affiliate_clicks (
    id UUID PRIMARY KEY,
    affiliate_link_id UUID REFERENCES affiliate_links(id),
    usuario_id UUID REFERENCES usuarios(id),
    receita_id UUID REFERENCES receitas(id),
    clicked_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    device_info JSON
);

-- Tabela de Conversões (Compras realizadas)
CREATE TABLE affiliate_conversions (
    id UUID PRIMARY KEY,
    affiliate_click_id UUID REFERENCES affiliate_clicks(id),
    pedido_id VARCHAR(255),
    valor_pedido DECIMAL(10,2),
    comissao_ganha DECIMAL(10,2),
    status VARCHAR(50), -- 'pending', 'confirmed', 'paid'
    converted_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Assinaturas
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    plano VARCHAR(50), -- 'free', 'premium', 'premium_plus'
    preco_mensal DECIMAL(10,2),
    data_inicio TIMESTAMP DEFAULT NOW(),
    data_proximo_pagamento TIMESTAMP,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50), -- 'active', 'cancelled', 'expired'
    created_at TIMESTAMP
);

-- Tabela de Transações
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    tipo VARCHAR(50), -- 'affiliate_commission', 'subscription_payment'
    valor DECIMAL(10,2),
    descricao TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP
);

-- Tabela de Usuários Expandida
ALTER TABLE usuarios ADD COLUMN (
    plano_subscription VARCHAR(50) DEFAULT 'free',
    data_assinatura_premium TIMESTAMP,
    total_gasto_em_compras DECIMAL(10,2) DEFAULT 0,
    total_economizado DECIMAL(10,2) DEFAULT 0
);
```

---

### 2. API Endpoints para Monetização

#### 2.1 Endpoints de Recomendações

```
GET /api/receitas/recomendacoes/com-meus-alimentos
├─ Query params:
│  ├─ usuario_id (obrigatório)
│  ├─ limite_ingredientes_faltantes = 2 (até 2 ingredientes)
│  └─ ordenar_por = 'porcentagem_alimentos' | 'avaliacoes'
│
└─ Response:
   [
     {
       id: "rec-123",
       receita: { id, nome, imagem, avaliacoes },
       percentual_alimentos_disponiveis: 85,
       alimentos_que_tem: ["Ovos", "Leite"],
       status: "COMPLETA" | "FALTA_1_ITEM"
     }
   ]

GET /api/receitas/recomendacoes/incentivo-compra
├─ Query params:
│  ├─ usuario_id (obrigatório)
│  └─ preco_maximo = 50 (até R$ 50 em ingredientes)
│
└─ Response:
   [
     {
       id: "rec-124",
       receita: { id, nome, imagem },
       ingredientes_faltantes: [
         { nome: "Frango", preco_estimado: 15.90 },
         { nome: "Parmesão", preco_estimado: 8.50 }
       ],
       preco_total_ingredientes: 24.40,
       links_para_comprar: [
         { supermarket: "Carrefour", url: "https://...", comissao_app: "2%" },
         { supermarket: "Ifood", url: "https://...", comissao_app: "5%" }
       ]
     }
   ]

POST /api/receitas/{id}/registrar-interesse-compra
├─ Body: { usuario_id, supermarket_id }
└─ Registra clique em link de afiliado
```

#### 2.2 Endpoints de Afiliados

```
GET /api/affiliates/meus-links
├─ Headers: Authorization
└─ Response: Lista de links ativos do usuário/app

POST /api/affiliates/registrar-clique
├─ Body: {
│    affiliate_link_id,
│    receita_id,
│    device_info
│  }
└─ Registra clique para rastreamento

GET /api/affiliates/minhas-comissoes
├─ Headers: Authorization
└─ Response:
   {
     comissoes_pendentes: R$ 150.50,
     comissoes_confirmadas: R$ 1.250.00,
     comissoes_pagas: R$ 5.000.00,
     proxima_transferencia: "2025-12-15"
   }
```

#### 2.3 Endpoints de Assinatura

```
POST /api/subscriptions/checkout
├─ Body: { usuario_id, plano_selecionado: 'premium' }
└─ Retorna: { stripe_session_id, url_checkout }

POST /api/subscriptions/webhook
├─ Webhook do Stripe
├─ Atualiza status de assinatura
└─ Desbloqueiam features premium

GET /api/subscriptions/status
├─ Headers: Authorization
└─ Response:
   {
     plano_atual: "premium",
     data_renovacao: "2025-12-11",
     features_desbloqueadas: [
       "videos_hd",
       "receitas_ilimitadas",
       "meal_plans"
     ]
   }

POST /api/subscriptions/cancelar
├─ Headers: Authorization
└─ Cancela assinatura ativa
```

#### 2.4 Endpoints de Analytics

```
GET /api/analytics/cliques-afiliados
├─ Query: { data_inicio, data_fim, supermarket_id }
└─ Response: { total_cliques, cliques_por_dia[], taxa_conversao }

GET /api/analytics/receitas-mais-recomendadas
├─ Query: { periodo: 'semana' | 'mes' }
└─ Response: Top 10 receitas recomendadas

GET /api/analytics/economia-usuario
├─ Headers: Authorization
└─ Response:
   {
     economia_total: R$ 1.250,
     receitas_realizadas: 45,
     alimentos_economizados: 23,
     co2_nao_gerado_kg: 15.5
   }
```

---

### 3. Componentes React Native para Monetização

#### 3.1 ReceitaRecomendadaCard.js

```jsx
// Componente para exibir receitas recomendadas com links de compra
export default function ReceitaRecomendadaCard({ receita, tipo }) {
  // tipo: 'com_alimentos' | 'incentivar_compra'

  return (
    <View style={styles.card}>
      {tipo === 'com_alimentos' && (
        <Badge status="COMPLETA">✓ Você tem tudo!</Badge>
      )}

      {tipo === 'incentivar_compra' && (
        <View>
          <PriceTag>
            Faltam apenas {ingredientesCount} ingredientes
          </PriceTag>
          <PriceEstimate>
            Total: R$ {preco_total.toFixed(2)}
          </PriceEstimate>
        </View>
      )}

      <RecipeName>{receita.nome}</RecipeName>

      {tipo === 'incentivar_compra' && (
        <IngredientsNeeded>
          {ingredientes.map(ing => (
            <IngredientItem key={ing.id}>
              {ing.nome} - R$ {ing.preco}
            </IngredientItem>
          ))}
        </IngredientsNeeded>
      )}

      {tipo === 'com_alimentos' && (
        <ActionButton onPress={() => verReceita()}>
          Ver Receita
        </ActionButton>
      )}

      {tipo === 'incentivar_compra' && (
        <ShoppingLinks>
          {links_compra.map(link => (
            <ShoppingButton
              key={link.id}
              onPress={() => registrarCliqueEAbrir(link.url)}
            >
              Comprar no {link.supermarket}
            </ShoppingButton>
          ))}
        </ShoppingLinks>
      )}
    </View>
  );
}
```

#### 3.2 PremiumFeatureScreen.js

```jsx
export default function PremiumFeatureScreen({ feature }) {
  const { user } = useAuth();
  const isSubscribed = user.subscription_plan !== 'free';

  if (isSubscribed) {
    // Mostra conteúdo premium
    return <VideoHDContent video={feature} />;
  }

  return (
    <View style={styles.container}>
      <PremiumIcon />
      <Text>Desbloqueie esta receita em vídeo HD</Text>

      <PremiumPlans>
        <PlanCard
          name="Premium"
          price="R$ 9,90/mês"
          features={[
            "Vídeos HD",
            "Receitas ilimitadas",
            "500+ receitas exclusivas"
          ]}
          onPress={() => iniciarAssinatura('premium')}
        />
        <PlanCard
          name="Premium+"
          price="R$ 19,90/mês"
          features={[
            "Tudo do Premium +",
            "Consultoria nutricionista",
            "Plano personalizado"
          ]}
          onPress={() => iniciarAssinatura('premium_plus')}
        />
      </PremiumPlans>
    </View>
  );
}
```

#### 3.3 SubscriptionPaymentModal.js

```jsx
// Integração com Stripe
export default function SubscriptionPaymentModal({ plano, onClose }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const iniciarCheckout = async () => {
    setLoading(true);

    // Chama API para criar sessão de checkout
    const response = await api.post('/subscriptions/checkout', {
      usuario_id: user.id,
      plano_selecionado: plano
    });

    // Abre Stripe Checkout
    const result = await Stripe.redirectToCheckout({
      sessionId: response.data.stripe_session_id
    });

    setLoading(false);
  };

  return (
    <Modal visible onRequestClose={onClose}>
      <ScrollView style={styles.container}>
        <CloseButton onPress={onClose} />

        <Header>Assine e Desbloqueie Tudo</Header>

        <FeatureList
          features={getPlanFeatures(plano)}
        />

        <PriceDisplay>
          R$ {getPlanPrice(plano)}/mês
        </PriceDisplay>

        <SubscribeButton
          loading={loading}
          onPress={iniciarCheckout}
        >
          Assinar Agora
        </SubscribeButton>

        <Disclaimer>
          Você pode cancelar a qualquer momento
        </Disclaimer>
      </ScrollView>
    </Modal>
  );
}
```

#### 3.4 AffiliateTracker.js (Hook)

```jsx
export const useAffiliateTracker = () => {
  const { user } = useAuth();

  const registrarClique = async (affiliateLinkId, receitaId) => {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        app_version: DeviceInfo.getVersion(),
        device_name: DeviceInfo.getDeviceName()
      };

      await api.post('/affiliates/registrar-clique', {
        affiliate_link_id: affiliateLinkId,
        receita_id: receitaId,
        usuario_id: user.id,
        device_info: deviceInfo
      });
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
  };

  const abrirLinkDeCompra = async (url, affiliateLinkId, receitaId) => {
    // Registra clique
    await registrarClique(affiliateLinkId, receitaId);

    // Abre link
    await Linking.openURL(url);
  };

  return { abrirLinkDeCompra, registrarClique };
};
```

---

### 4. Integração com Stripe

#### 4.1 Backend - Configuração Stripe

```javascript
// backend/src/modules/subscriptions/stripe.service.ts

import Stripe from 'stripe';

export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  async createCheckoutSession(userId: string, plano: 'premium' | 'premium_plus') {
    const precos = {
      'premium': process.env.STRIPE_PREMIUM_PRICE_ID,
      'premium_plus': process.env.STRIPE_PREMIUM_PLUS_PRICE_ID
    };

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: precos[plano],
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/subscription/cancel`,
      metadata: {
        userId: userId,
        plano: plano
      }
    });

    return session;
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onSubscriptionCreated(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.onInvoicePaid(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.onSubscriptionCancelled(event.data.object);
        break;
    }
  }

  private async onSubscriptionCreated(session: any) {
    // Atualiza banco de dados
    await Subscription.create({
      usuario_id: session.metadata.userId,
      plano: session.metadata.plano,
      stripe_subscription_id: session.subscription,
      status: 'active'
    });
  }
}
```

---

### 5. Implementação de Features Premium

#### 5.1 Verificação de Acesso Premium

```jsx
// utils/premiumChecker.ts

export const checkPremiumAccess = (usuario: Usuario): boolean => {
  if (usuario.plano_subscription === 'free') {
    return false;
  }

  if (usuario.plano_subscription === 'premium' ||
      usuario.plano_subscription === 'premium_plus') {
    return true;
  }

  return false;
};

export const checkFeatureAccess = (usuario: Usuario, feature: string): boolean => {
  const freeFeatures = ['receitas_basicas', 'inventario'];
  const premiumFeatures = ['videos_hd', 'receitas_ilimitadas'];
  const premiumPlusFeatures = [...premiumFeatures, 'consultoria', 'plano_personalizado'];

  if (freeFeatures.includes(feature)) return true;

  if (usuario.plano_subscription === 'premium') {
    return premiumFeatures.includes(feature);
  }

  if (usuario.plano_subscription === 'premium_plus') {
    return premiumPlusFeatures.includes(feature);
  }

  return false;
};
```

#### 5.2 Conteúdo Premium - Videos HD

```jsx
// screens/RecipeVideoScreen.js

export default function RecipeVideoScreen({ recipeId }) {
  const { user } = useAuth();
  const hasPremium = checkPremiumAccess(user);

  if (!hasPremium) {
    return <PremiumFeatureScreen feature="video_hd" />;
  }

  return (
    <View style={styles.container}>
      <VideoPlayer
        url={recipe.video_url_hd}
        title={recipe.nome}
      />
      <RecipeDetails recipe={recipe} />
      <StepByStepInstructions steps={recipe.passos} />
    </View>
  );
}
```

---

### 6. Dashboard de Analytics

```
GET /api/admin/analytics/dashboard
└─ Response:
   {
     receita: {
       usuarios_totais: 10000,
       usuarios_ativos_diarios: 3500,
       taxa_retencao: 0.65,
       tempo_medio_sessao: "12m34s"
     },
     monetizacao: {
       receita_total_mes: R$ 8.500,
       breakdown: {
         assinaturas_premium: R$ 5.200,
         afiliados: R$ 2.100,
         publicidade: R$ 400,
         b2b_dados: R$ 800
       }
     },
     afiliados: {
       cliques_totais: 15000,
       taxa_conversao: 0.08,
       comissao_media_por_conversao: R$ 3.50,
       supermercados_ativos: 8
     },
     subscriptions: {
       usuarios_premium: 500,
       usuarios_premium_plus: 200,
       churn_rate: 0.05,
       ltv_medio: R$ 119
     }
   }
```

---

### 7. Environment Variables

```bash
# .env

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PREMIUM_PLUS_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Afiliados
AFFILIATE_API_KEY=...
AWIN_PUBLISHER_ID=...
IMPACT_ACCOUNT_ID=...

# Supermercados
CARREFOUR_API_KEY=...
EXTRA_API_KEY=...
IFOOD_API_KEY=...

# Publicidade
GOOGLE_ADSENSE_KEY=...
FACEBOOK_AUDIENCE_NETWORK_KEY=...

# URLs
APP_URL=https://cookme.app
API_URL=https://api.cookme.app
STRIPE_SUCCESS_URL=https://cookme.app/premium
STRIPE_CANCEL_URL=https://cookme.app/cancel
```

---

### 8. Roadmap de Implementação (Técnico)

**Semana 1-2:** Setup Stripe + BD

- [ ] Criar tabelas no banco
- [ ] Integrar Stripe SDK
- [ ] Implementar webhook do Stripe

**Semana 3-4:** APIs de Monetização

- [ ] Endpoints de recomendações
- [ ] Endpoints de afiliados
- [ ] Endpoints de assinatura

**Semana 5-6:** Frontend Premium

- [ ] Modal de assinatura
- [ ] Verificação de acesso
- [ ] Bloqueio de features

**Semana 7-8:** Testes + Launch

- [ ] Testes E2E
- [ ] Testes de conversão
- [ ] Deploy em produção

---

*Documento técnico v1.0 - 2025-11-11*
