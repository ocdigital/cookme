# CookMe - Roadmap de Desenvolvimento 🚀

## 📋 Visão Geral

Este documento apresenta um plano estruturado de desenvolvimento do CookMe, dividido em fases com tarefas específicas, estimativas de tempo e prioridades.

---

## 📊 Fases de Desenvolvimento

```
FASE 1 (CONCLUÍDA)       FASE 2 (PRÓXIMA)          FASE 3 (MÉDIO PRAZO)      FASE 4 (LONGO PRAZO)
└─ Backend                └─ Mobile Integration     └─ Avançadas             └─ Escalabilidade
   ✅ API Completa           ✅ Monetização           ✅ ML/IA                ✅ Infraestrutura
   ✅ Banco de Dados         ✅ Testes              ✅ Social               ✅ Analytics
   ✅ Monetização            ✅ Performance
```

---

## 🎯 FASE 2: Integração Mobile + Testes (2-3 semanas)

### 2.1 Implementação Mobile da Monetização

#### 2.1.1 Componente de Recomendações (3-4 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 12-16 horas

```typescript
// Arquivo: mobile/src/components/RecipeRecommendationCard.tsx

Implementar:
├─ Card para receitas com "Você tem tudo!"
├─ Card para receitas com "Faltam X ingredientes"
├─ Button "Comprar no Carrefour/Ifood"
├─ Loading state + skeleton
├─ Erro handling
└─ Analytics tracking (cliques)

Tasks:
1. [ ] Criar componente base RecipeRecommendationCard
2. [ ] Estilizar com design system (cores, tipografia)
3. [ ] Integrar com API /api/affiliate/recomendacoes/*
4. [ ] Implementar registro de cliques
5. [ ] Adicionar animações
6. [ ] Testar no web + mobile
```

#### 2.1.2 Seção de Recomendações na Home (2-3 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 8-12 horas

```typescript
// Integrar em: mobile/src/screens/HomeScreenRecipes.js

Adicionar seção:
├─ "Receitas com seus ingredientes" (com seu inventário)
├─ "Ideias de novos pratos" (incentivar compra)
├─ Carousel com 5-6 receitas
├─ "Ver mais" button
└─ Refresh automático a cada 30s

Tasks:
1. [ ] Buscar recomendações com inventário do usuário
2. [ ] Buscar recomendações de compra
3. [ ] Renderizar carrosséis
4. [ ] Implementar navegação para detalhes
5. [ ] Adicionar pull-to-refresh
6. [ ] Testar performance (não travar scroll)
```

#### 2.1.3 Modal de Assinatura Premium (3-4 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 12-16 horas

```typescript
// Arquivo: mobile/src/components/SubscriptionModal.tsx

Implementar:
├─ Cards dos 3 planos (Free, Premium, Premium+)
├─ Comparação de features
├─ "Assinar Agora" button
├─ Stripe checkout flow
├─ Sucesso/erro states
├─ Cancelar anytime message
└─ FAQ collapsible

Tasks:
1. [ ] Design e layout modal
2. [ ] Listar features por plano
3. [ ] Integrar Stripe SDK
4. [ ] Implementar checkout flow
5. [ ] Handle webhook de sucesso
6. [ ] Persistir plano no AsyncStorage
7. [ ] Mostrar "Você é Premium!" em lugares relevantes
```

#### 2.1.4 Affiliate Link Tracking (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 8-12 horas

```typescript
// Arquivo: mobile/src/hooks/useAffiliateTracking.ts

Implementar hook:
├─ Registrar clique quando user toca "Comprar"
├─ Abrir URL do supermercado
├─ Capturar device_info (platform, app version)
├─ Error handling (se API cair)
└─ Analytics local (para debug)

Tasks:
1. [ ] Criar hook useAffiliateTracking
2. [ ] POST /api/affiliate/registrar-clique
3. [ ] Implementar Linking.openURL
4. [ ] Capturar device info
5. [ ] Testar com diferentes URLs
6. [ ] Validar que clique é registrado
```

### 2.2 Testes Backend

#### 2.2.1 Testes Unitários (4-5 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 20-24 horas

```typescript
// Arquivo: backend/src/modules/affiliate/services/*.spec.ts

Testar:
├─ AffiliateService
│  ├─ registrarClique (sucesso, link não existe, link inativo)
│  ├─ registrarConversao (cálculo de comissão)
│  ├─ buscarLinksReceita (filtragem, ordenação)
│  └─ obterComissoesPendentes (agregações)
│
├─ RecommendationService
│  ├─ obterRecomendacoesComMeusAlimentos (filtragem)
│  ├─ obterRecomendacoesIncentivCompra (preço máximo)
│  ├─ registrarCliqueRecomendacao
│  └─ estimarPrecoIngrediente (mocking)
│
└─ SubscriptionService
   ├─ criarAssinatura (validações)
   ├─ atualizarAssinatura (diferença de preço)
   ├─ cancelarAssinatura (motivo tracking)
   ├─ verificarAcesso (features por plano)
   └─ processarWebhookRenovacao

Tools: Jest + Supertest
```

**Template de teste:**
```typescript
describe('AffiliateService', () => {
  let service: AffiliateService;
  let repository: Repository<AffiliateClick>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AffiliateService,
        { provide: 'AffiliateClickRepository', useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AffiliateService>(AffiliateService);
  });

  describe('registrarClique', () => {
    it('deve registrar clique com sucesso', async () => {
      const result = await service.registrarClique(linkId, usuarioId);
      expect(result).toBeDefined();
      expect(result.usuario_id).toBe(usuarioId);
    });

    it('deve lançar erro se link não existe', async () => {
      await expect(service.registrarClique('invalid', usuarioId))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

#### 2.2.2 Testes de Integração (3-4 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 16-20 horas

```typescript
// Arquivo: backend/test/affiliate.e2e.spec.ts

Testar fluxos completos:
├─ Registrar clique → Criar conversão → Transação criada
├─ Criar assinatura → Webhook Stripe → Status atualizado
├─ Obter recomendações → Filtrar por inventário
├─ Verificar acesso feature → Based on subscription
└─ Upgrade plano → Recalcular preço → Nova transação

Tools: Jest + TypeORM Test Database (PostgreSQL)
```

#### 2.2.3 Testes de Performance (2-3 dias)
**Prioridade**: 🟡 BAIXA
**Estimativa**: 12-16 horas

```
Medir:
├─ Tempo de resposta /api/affiliate/recomendacoes/* (<500ms)
├─ Query performance (índices corretos)
├─ Memory leak (long-running services)
├─ Concurrent requests (10-50 simultâneos)
└─ Database connection pooling

Tools: Apache JMeter + New Relic / DataDog
```

---

## 🎯 FASE 3: Features Avançadas (2-4 semanas)

### 3.1 Sistema de Avaliações e Ratings

#### 3.1.1 Backend - Endpoints de Ratings (3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```typescript
// Arquivo: backend/src/modules/receitas/entities/receita-avaliacao.entity.ts

Entity:
├─ id: UUID
├─ receita_id: UUID
├─ usuario_id: UUID
├─ nota: 1-5
├─ comentario: text
├─ criado_em: timestamp
└─ helpful_count: int (pessoas que acharam útil)

Endpoints:
├─ POST /api/receitas/:id/avaliar (criar/atualizar)
├─ GET /api/receitas/:id/avaliacoes (listar com paginação)
├─ POST /api/receitas/:id/avaliacoes/:avId/util (marcar como útil)
└─ DELETE /api/receitas/:id/avaliacoes/:avId (deletar própria)

Tasks:
1. [ ] Criar entity ReceitaAvaliacao
2. [ ] Criar endpoints CRUD
3. [ ] Validar nota 1-5
4. [ ] Recalcular avaliação média da receita
5. [ ] Testes unitários + integração
```

#### 3.1.2 Mobile - UI de Ratings (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 10-14 horas

```typescript
// Arquivo: mobile/src/components/RatingModal.tsx

Implementar:
├─ Modal com 5 stars (touch-friendly)
├─ Campo de texto para comentário
├─ "Enviar avaliação" button
├─ Validações (nota obrigatória)
├─ Loading state
├─ Sucesso toast message
└─ Integração com RecipeDetailsScreen

Tasks:
1. [ ] Design modal
2. [ ] Star rating component
3. [ ] Chamar POST /api/receitas/:id/avaliar
4. [ ] Atualizar lista de avaliacões
5. [ ] Error handling
```

### 3.2 Sistema de Histórico e Recomendações Personalizadas

#### 3.2.1 Recipe History Tracking (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```typescript
// Arquivo: backend/src/modules/receitas/entities/receita-historico.entity.ts

Entity:
├─ id: UUID
├─ usuario_id: UUID
├─ receita_id: UUID
├─ tipo: 'visualizada' | 'cozinhada' | 'compartilhada'
├─ data_hora: timestamp
├─ tempo_permanencia_segundos: int
└─ fonte: 'home' | 'busca' | 'recomendacao'

Endpoints:
├─ POST /api/receitas/:id/registrar-visualizacao
├─ POST /api/receitas/:id/registrar-cozinhada (com porções)
├─ GET /api/users/me/historico (com filtros)
└─ GET /api/analytics/receitas-populares

Tasks:
1. [ ] Criar entity ReceitaHistorico
2. [ ] Endpoints para registrar eventos
3. [ ] Registrar automaticamente na RecipeDetailsScreen
4. [ ] Endpoint de histórico do usuário
5. [ ] Analytics de receitas populares
```

#### 3.2.2 ML-Based Recommendations (Básico) (4-5 dias)
**Prioridade**: 🟡 BAIXA
**Estimativa**: 20-24 horas

```python
# Arquivo: backend/ml_service/recommendation_engine.py

Algoritmo simples (sem ML pesado):
├─ Analisar histórico do usuário
├─ Receitas similares (mesma categoria/ingredientes)
├─ Receitas populares que user ainda não viu
├─ Baseado em preferências (rating 4+ stars)
└─ Pontuação + ordenação

Python Service:
1. [ ] Criar FastAPI service separado (ou como módulo NestJS)
2. [ ] Endpoint GET /recommend/:usuarioId?limite=5
3. [ ] Cache de recomendações (Redis, TTL 1 hora)
4. [ ] Integrar com RecommendationService existente
5. [ ] Monitorar latência

Alternativa: Usar bibliotecas simples:
- scikit-learn (cosine_similarity)
- pandas (para aggregações)
- numpy (para cálculos)
```

### 3.3 Compartilhamento e Social Features

#### 3.3.1 Share Recipes (2 dias)
**Prioridade**: 🟡 BAIXA
**Estimativa**: 8-10 horas

```typescript
// Mobile: mobile/src/utils/shareRecipe.ts

Implementar:
├─ Share via WhatsApp com link + descrição
├─ Share via Email
├─ Share via Social Media
├─ Deep link para receita (recipe://app/:id)
└─ Analytics (rastrear compartilhamentos)

Tasks:
1. [ ] Criar deep link handler
2. [ ] Usar React Native Share API
3. [ ] Formatar mensagem customizada
4. [ ] Registrar compartilhamento no backend
5. [ ] Testar cada plataforma
```

#### 3.3.2 Comments/Discussion (3-4 dias)
**Prioridade**: 🟡 BAIXA
**Estimativa**: 12-16 horas

```typescript
// Backend: receita-comentario.entity.ts

Entity:
├─ id: UUID
├─ receita_id: UUID
├─ usuario_id: UUID
├─ comentario: text
├─ parent_id: UUID (para respostas)
├─ likes_count: int
├─ criado_em: timestamp
└─ atualizado_em: timestamp

Endpoints:
├─ POST /api/receitas/:id/comentarios
├─ GET /api/receitas/:id/comentarios?pagina=1
├─ PATCH /api/receitas/:id/comentarios/:comId
├─ DELETE /api/receitas/:id/comentarios/:comId
├─ POST /api/receitas/:id/comentarios/:comId/like
└─ GET /api/receitas/:id/comentarios/:comId/respostas

Mobile: Comment thread UI com nested replies
```

---

## 🎯 FASE 4: Escalabilidade e Produção (3-4 semanas)

### 4.1 DevOps e Infraestrutura

#### 4.1.1 Docker + CI/CD (3-4 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 16-20 horas

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run tests
        run: npm run test

      - name: Build Docker image
        run: docker build -t cookme:latest .

      - name: Push to Docker Hub
        run: docker push your-registry/cookme:latest

      - name: Deploy to production
        run: kubectl set image deployment/cookme ...
```

Tasks:
1. [ ] Criar Dockerfile para backend
2. [ ] Criar docker-compose.yml (para desenvolvimento)
3. [ ] Setup GitHub Actions
4. [ ] Testes automáticos antes de deploy
5. [ ] Staging environment
6. [ ] Production environment
7. [ ] Database migrations automáticas

#### 4.1.2 Monitoramento e Logging (3 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 12-16 horas

```typescript
// Integrar logging estruturado
├─ Winston (logging)
├─ Sentry (error tracking)
├─ DataDog/New Relic (APM)
├─ Prometheus (métricas)
└─ Grafana (dashboards)

Backend changes:
1. [ ] Setup Winston logger
2. [ ] Integrar Sentry para production
3. [ ] Adicionar métricas Prometheus
4. [ ] Custom dashboards Grafana
5. [ ] Alertas para erros críticos
```

### 4.2 Performance e Otimizações

#### 4.2.1 Caching Strategy (3-4 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```typescript
// backend/src/config/cache.config.ts

Implementar:
├─ Redis para cache distribuído
├─ Recomendações (TTL: 1 hora)
├─ Receitas (TTL: 24 horas)
├─ Usuário (TTL: 30 minutos)
├─ Invalidação automática
└─ Cache warming na inicialização

Tasks:
1. [ ] Setup Redis (Docker)
2. [ ] Integrar cache-manager NestJS
3. [ ] Decorador @Cacheable
4. [ ] Cache invalidation strategy
5. [ ] Medir hit rate e impacto
```

#### 4.2.2 Database Query Optimization (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```sql
-- Análise de queries lentas
1. [ ] EXPLAIN ANALYZE em queries pesadas
2. [ ] Adicionar índices faltantes
3. [ ] Evitar N+1 queries (usar relations)
4. [ ] Paginação em listas grandes
5. [ ] Particionamento de tabelas grandes
6. [ ] Denormalização estratégica
```

#### 4.2.3 Image Optimization (2 dias)
**Prioridade**: 🟡 BAIXA
**Estimativa**: 8-10 horas

```typescript
// Otimizar imagens
├─ Compressão automática (Sharp)
├─ WebP format
├─ Thumbnails para lista
├─ CDN (CloudFlare/AWS)
└─ Lazy loading mobile

Tasks:
1. [ ] Setup image processor service
2. [ ] Armazenar diferentes resoluções
3. [ ] Integrar com CDN
4. [ ] Update mobile para lazy load
```

### 4.3 Segurança Aprofundada

#### 4.3.1 Security Audit (2-3 dias)
**Prioridade**: 🔴 ALTA
**Estimativa**: 12-16 horas

```
Verificar:
├─ SQL Injection (Prepared statements ✅)
├─ XSS (Sanitization)
├─ CSRF (CSRF tokens)
├─ Rate limiting
├─ JWT expiration
├─ Password hashing (bcrypt)
├─ Data encryption at rest
├─ HTTPS/TLS everywhere
├─ API rate limiting
└─ Input validation

Tools:
- OWASP ZAP
- Snyk (dependency scan)
- SonarQube (code quality)
```

#### 4.3.2 Compliance e LGPD (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```
Implementar:
├─ GDPR compliance
├─ LGPD (Brazil) compliance
├─ Data retention policies
├─ Right to be forgotten (deletar usuário)
├─ Data export (GDPR requirement)
├─ Privacy policy
└─ Terms of Service

Tasks:
1. [ ] Implementar soft delete para usuários
2. [ ] Endpoint de exportação de dados
3. [ ] Endpoint de deleção completa
4. [ ] Audit trail para mudanças sensíveis
5. [ ] Documentar políticas
```

---

## 📱 FASE 2.5: Mobile Refinements

### 2.5.1 Performance Mobile (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```typescript
// Otimizações mobile
├─ FlatList optimization (removeClippedSubviews)
├─ Memoization (React.memo)
├─ Code splitting (lazy loading screens)
├─ Image caching
├─ Reduce bundle size
├─ Profiling com Flipper
└─ Monitor performance metrics

Tasks:
1. [ ] Usar React DevTools Profiler
2. [ ] Medir frame rate (60 FPS target)
3. [ ] Benchmark inicialização app
4. [ ] Otimizar listas grandes
5. [ ] Testar em dispositivos low-end
```

### 2.5.2 Offline Support Melhorado (2-3 dias)
**Prioridade**: 🟠 MÉDIA
**Estimativa**: 12-16 horas

```typescript
// Implementar sync local-first
├─ WatermelonDB (local database)
├─ Queue de ações offline
├─ Sincronização automática
├─ Conflicto resolution
└─ Analytics offline

Tasks:
1. [ ] Setup WatermelonDB
2. [ ] Replicar schema local
3. [ ] Queue system para ações
4. [ ] Background sync
5. [ ] Testar sincronização
```

---

## 📊 Cronograma Sugerido

```
SEMANA 1-2: Componentes Mobile + Recomendações
├─ RecipeRecommendationCard
├─ Home screen integration
├─ Affiliate tracking
└─ Testes básicos

SEMANA 3: Premium Subscription Modal
├─ Design e implementação
├─ Stripe integration
├─ Tests

SEMANA 4: Testes Backend (Metade)
├─ Unit tests
├─ Integration tests basics

SEMANA 5: Testes Backend (Resto) + Performance
├─ Completar testes
├─ Performance testing
├─ Bug fixes

SEMANA 6-7: Features Avançadas Iniciais
├─ Rating system
├─ History tracking
├─ Recomendações básicas

SEMANA 8+: Fase 4 (DevOps, Segurança, Escalabilidade)
```

---

## 🎯 Quick Wins (Rápido e Impacto)

Se quiser começar AGORA e fazer impacto:

### 1. **Testes Unitários para AffiliateService** (1-2 dias)
```
Tempo: 8-12 horas
Impacto: Alto (confiabilidade)
Dificuldade: Média
```

### 2. **RecipeRecommendationCard Component** (2-3 dias)
```
Tempo: 12-16 horas
Impacto: Alto (monetização visível)
Dificuldade: Média
```

### 3. **Subscribe Modal com Stripe** (2-3 dias)
```
Tempo: 12-16 horas
Impacto: Muito Alto (receita)
Dificuldade: Média-Alta
```

### 4. **E2E Test - Affiliate Flow Completo** (1-2 dias)
```
Tempo: 8-12 horas
Impacto: Alto (confiabilidade)
Dificuldade: Média
```

---

## ✅ Checklist para Começar

- [ ] Escolher 1-2 tasks da Fase 2
- [ ] Criar branches Git para cada feature
- [ ] Setup de testes (Jest + testing-library)
- [ ] Code review process
- [ ] Documentation updates
- [ ] QA testing before merge

---

## 📞 Próximos Passos

**Qual desses você gostaria de começar?**

1. ✅ Componentes Mobile (recomendação visível)
2. ✅ Testes Backend (confiabilidade)
3. ✅ Stripe Integration (monetização)
4. ✅ Tudo acima ao mesmo tempo

**Tempo disponível?**
- 5-10 horas/semana → Foco em 1 task
- 20-30 horas/semana → 2-3 tasks paralelas
- 40+ horas/semana → 4-5 tasks paralelas

---

*Documento criado em: 11 de Novembro de 2025*
*Status: Pronto para implementação*
