# Notification Automation - Implementação Completa

## 📋 Resumo Executivo

O sistema de **automação de notificações** do CookMe foi completamente implementado com 5 triggers automáticos que enviam notificações contextualizadas aos usuários em momentos estratégicos.

**Status**: ✅ **PRODUÇÃO - v1.0**

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ **Vencimento de Inventário** (a cada 6 horas)
```
⏰ Frequência: A cada 6 horas (4x por dia)
🎯 Público: Usuários com itens vencendo
📊 Categorias de Alerta:
  - URGENTE: Vence em < 3 dias (Erro 🔴)
  - AVISO: Vence em 3-7 dias (Warning 🟡)
```

**O que faz:**
- Verifica inventário do usuário diariamente
- Busca itens com data de validade próxima
- Envia notificação com dias restantes
- Inclui quantidade disponível e data de vencimento
- Diferencia avisos urgentes de preventivos

**Exemplo de Notificação:**
```
Título: ⚠️ Feijão Carioca vence em 2 dias!
Mensagem: Use logo! Este produto vence em 13/03/2026.
          Você tem 2 kg disponível.
```

---

### 2️⃣ **Sugestões Diárias de Receitas** (9:00 AM todos os dias)
```
⏰ Frequência: Diariamente às 9:00 AM
🎯 Público: Todos os usuários com inventário
📊 Base: Produtos que o usuário tem disponíveis
```

**O que faz:**
- Busca produtos no inventário do usuário (quantidade > 0)
- Encontra receitas que usam esses produtos
- Seleciona a mais bem avaliada
- Envia sugestão personalizada com tempo de preparo
- Incentiva o usuário a cozinhar

**Exemplo de Notificação:**
```
Título: 🎉 Que tal fazer Frango à Parmegiana hoje?
Mensagem: Você tem os ingredientes! Esta receita leva 45 minutos
          e é média.
```

---

### 3️⃣ **Promoções e Produtos em Destaque** (Seg 10:00 AM)
```
⏰ Frequência: Semanalmente às segundas-feiras 10:00 AM
🎯 Público: Todos os usuários
📊 Estratégia: Produtos sazonais por mês
```

**O que faz:**
- Identifica produtos sazonais (mês atual)
- Notifica sobre produtos em destaque
- Incentiva uso de ingredientes frescos
- Melhora engajamento semanal
- Integração futura com sistemas de preços

**Mapeamento de Sazonalidade:**
```
Janeiro     → Maçã, Laranja
Fevereiro   → Morango, Banana
Março       → Abacaxi, Melancia
...
Dezembro    → Melancia, Morango
```

**Exemplo de Notificação:**
```
Título: 🛒 Morango está em destaque!
Mensagem: Aproveite a sazonalidade para usar Morango em suas
          receitas. Preço reduzido em muitas lojas.
```

---

### 4️⃣ **Estoque Baixo** (8:00 AM todos os dias)
```
⏰ Frequência: Diariamente às 8:00 AM
🎯 Público: Usuários com itens em falta
📊 Critério: Quantidade < 1 unidade + uso frequente
```

**O que faz:**
- Detecta produtos com estoque muito baixo
- Verifica se o usuário usa frequentemente (últimas 2 semanas)
- Envia alerta lembrando de comprar
- Evita notificações de produtos não usados
- Inteligência: Só notifica se uso recente

**Lógica de Decisão:**
```
┌─────────────────────────┐
│ Quantidade < 1 unidade? │
├───────────┬─────────────┤
│   NÃO     │     SIM     │
│           │             │
│ (Skip)    ▼             │
│   Usado nos últimos 2 semanas?
│           │ NÃO / SIM
│         (Skip) / Notificar
└─────────────────────────┘
```

**Exemplo de Notificação:**
```
Título: 📉 Estoque baixo: Alho
Mensagem: Você está acabando com Alho. Considera comprar em
          breve para não ficar sem.
```

---

### 5️⃣ **Novas Receitas Adicionadas** (Quarta 14:00)
```
⏰ Frequência: Semanalmente às quartas-feiras 14:00
🎯 Público: Todos os usuários
📊 Critério: Receitas adicionadas na última semana
```

**O que faz:**
- Busca receitas criadas na última semana
- Seleciona as melhor avaliadas
- Envia sugestão de descoberta
- Incentiva exploração de novas receitas
- Mantém usuário engajado com conteúdo novo

**Exemplo de Notificação:**
```
Título: 🆕 Receita nova: Salada Caprese
Mensagem: Descobrimos uma receita nova que você pode gostar!
          Uma delícia!
```

---

### 6️⃣ **Re-engagement para Usuários Inativos** (A cada 3 dias, 19:00)
```
⏰ Frequência: A cada 3 dias às 19:00 (noite)
🎯 Público: Usuários sem atividade há 3+ dias
📊 Objetivo: Aumentar retenção e engajamento
```

**O que faz:**
- Detecta usuários sem executar receitas há 3+ dias
- Envia mensagens motivacionais variadas
- Personalizadas com nome do usuário
- Incentiva voltar ao app
- Estratégia anti-churn

**Mensagens Variadas (Aleatória):**
```
1. 👨‍🍳 Saudades de você! Que tal cozinhar algo novo hoje?
2. 🍽️ Há quanto tempo não usa a gente! Vem conferir as novas receitas.
3. ✨ A gente tem sugestões especiais esperando por você!
4. 🎉 Aproveita e experimenta receitas diferentes que adicionamos.
```

**Exemplo de Notificação:**
```
Título: Oi João! 👋
Mensagem: 👨‍🍳 Saudades de você! Que tal cozinhar algo novo hoje?
```

---

## 🏗️ Arquitetura

### Serviço Principal: NotificationTriggersService

**Localização**: `/backend/src/modules/notificacoes/services/notification-triggers.service.ts`

**Características**:
- ✅ 6 métodos com decoradores `@Cron()`
- ✅ Injeção de 5 repositories
- ✅ Logging detalhado de execução
- ✅ Error handling robusto
- ✅ Métodos helper privados
- ✅ Suporte a triggers manuais

**Métodos Implementados:**
```typescript
@Cron(EVERY_6_HOURS)      verificarItensVencendo()
@Cron('0 9 * * *')         notificarSugestoesDiarias()
@Cron('0 10 * * 1')        notificarPromocoes()
@Cron('0 8 * * *')         notificarEstoqueBaixo()
@Cron('0 14 * * 3')        notificarNovasReceitas()
@Cron('0 19 */3 * *')      notificarUsuariosInativos()

notificarSobreProduto()    // Manual
notificarEvento()          // Manual
```

---

## 🔌 Endpoints da API

### Endpoints de Usuário

#### **GET /notificacoes** (Atualizado - Paginado)
```bash
GET /notificacoes?page=1&limit=20
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "usuario_id": "uuid",
      "tipo": "warning",
      "titulo": "Feijão vence em 3 dias!",
      "mensagem": "Use logo! Vence em 13/03/2026...",
      "lida": false,
      "icone": "⏰",
      "criado_em": "2026-03-11T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

#### **POST /notificacoes/manual**
Enviar notificação manual (de usuário para si mesmo)

```bash
POST /notificacoes/manual
Authorization: Bearer {token}

Body:
{
  "titulo": "Lembrete importante",
  "mensagem": "Não esqueça de comprar leite!",
  "tipo": "warning"  // opcional: info|success|warning|error
}
```

### Endpoints Admin (Testes)

#### **POST /notificacoes/triggers/test/vencimento**
Executa trigger de vencimento manualmente

```bash
POST /notificacoes/triggers/test/vencimento
Authorization: Bearer {admin_token}
```

**Resposta:**
```json
{
  "mensagem": "Trigger de vencimento executado com sucesso"
}
```

#### Outros Triggers de Teste:
```bash
POST /notificacoes/triggers/test/sugestoes
POST /notificacoes/triggers/test/estoque
POST /notificacoes/triggers/test/novas-receitas
POST /notificacoes/triggers/test/re-engagement
```

---

## 📊 Fluxo de Execução

### Exemplo: Trigger de Vencimento

```
┌──────────────────────────────────────────────┐
│     NestJS Schedule Trigger                  │
│     A cada 6 horas                          │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
     ┌───────────────────────────────┐
     │ verificarItensVencendo()      │
     │ Busca itens vencendo          │
     └────────────┬──────────────────┘
                  │
          ┌───────┴────────┐
          │                │
      URGENTE          AVISO
      (< 3 dias)      (3-7 dias)
          │                │
          ▼                ▼
    Tipo: ERROR      Tipo: WARNING
    Cores: 🔴        Cores: 🟡

    Ambos: Salvar em notificacoes table
           ▼
    Usuário vê no app
    Frontend faz polling ou WebSocket
```

---

## ⚙️ Configuração

### Dependências Necessárias

```bash
npm install @nestjs/schedule
```

### Variáveis de Ambiente

```env
# Notificações já têm timezone suportado por @nestjs/schedule
# Usar timezone do servidor (padrão: UTC)
TZ=America/Sao_Paulo  # Para horários em São Paulo
```

### Habilitar Schedule no App Module

```typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... outros imports
  ],
})
export class AppModule {}
```

---

## 💡 Exemplos de Uso

### Frontend - Receber Notificações

```typescript
import { api } from '@/services';

function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadNotifications = async () => {
      const response = await api.get('/notificacoes', {
        params: { page, limit: 20 }
      });
      setNotifications(response.data.data);
    };

    loadNotifications();

    // Polling a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [page]);

  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => (
        <NotificationCard
          titulo={item.titulo}
          mensagem={item.mensagem}
          icone={item.icone}
          tipo={item.tipo}
          lida={item.lida}
        />
      )}
    />
  );
}
```

### Testar Triggers (Admin)

```bash
# Testar vencimento
curl -X POST http://localhost:3000/notificacoes/triggers/test/vencimento \
  -H "Authorization: Bearer {admin_token}"

# Testar estoque baixo
curl -X POST http://localhost:3000/notificacoes/triggers/test/estoque \
  -H "Authorization: Bearer {admin_token}"
```

---

## 🎯 Cronograma de Execução

### Por Dia
```
08:00 AM  → Notificar estoque baixo
09:00 AM  → Sugestões diárias de receitas
14:00     → [QUA] Novas receitas semanais
19:00     → [3x/semana] Re-engagement
10:00 AM  → [SEG] Promoções semanais
```

### Verificação 24/7
```
A cada 6h → Verificar vencimento
```

---

## 📈 Métricas Esperadas

### Performance
| Operação | Tempo | Status |
|----------|-------|--------|
| Verificar vencimento | < 2s | ✅ |
| Enviar 1000 notif. | < 5s | ✅ |
| Buscar receitas match | < 1s | ✅ |

### Impacto
| Métrica | Target | Esperado |
|---------|--------|----------|
| Taxa de abertura | > 40% | 50% |
| Re-engagement | > 30% | 45% |
| Retenção 7 dias | > 70% | 80% |

---

## 🐛 Troubleshooting

### Problema: Triggers não executando
**Causa**: ScheduleModule não importado em AppModule
**Solução**: Adicionar `ScheduleModule.forRoot()` em imports

### Problema: Notificações duplicadas
**Causa**: Service rodando múltiplas vezes
**Solução**: Usar lock/mutex (Redis) para evitar execuções paralelas

### Problema: Horários incorretos
**Causa**: Timezone não configurado
**Solução**: Definir `TZ` em `.env` ou usar `@nestjs/config`

### Problema: Sem notificações de estoque
**Causa**: `verificarUsoFrequente()` filtrando agressivamente
**Solução**: Reduzir threshold de 2 usos em 2 semanas para 1 uso

---

## 🚀 Próximas Melhorias

### Fase 2
- [ ] Implementar fila de notificações (Bull/RabbitMQ)
- [ ] Adicionar preferências de notificação por tipo
- [ ] Integração com push notifications (FCM)
- [ ] Integração com email
- [ ] WebSocket para notificações em tempo real

### Fase 3
- [ ] Machine Learning para melhor timing
- [ ] A/B testing de mensagens
- [ ] Integração com analytics
- [ ] Deep linking em notificações
- [ ] Rate limiting por usuário

### Fase 4
- [ ] SMS para eventos críticos
- [ ] Telegram/WhatsApp integration
- [ ] Notificações voice
- [ ] Customização avançada por usuário

---

## 📚 Documentação Relacionada

- MOI_ENGINE_IMPLEMENTATION.md - Motor de recomendação
- BARCODE_SCANNING_IMPLEMENTATION.md - Leitura de códigos
- BACKEND_STATUS.md - Estado geral do backend

---

## 🔐 Notas de Segurança

- ✅ Todas notificações vinculadas ao usuário autenticado
- ✅ Triggers rodam internamente (sem input externo)
- ✅ Endpoints de teste restritos a ADMIN
- ✅ Logging detalhado de erros
- ✅ Sem exposição de informações sensíveis

---

## 📊 Schema de Dados

```sql
-- Table: notificacoes
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  tipo ENUM('info', 'success', 'warning', 'error'),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  icone VARCHAR(50),
  criado_em TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_lida (usuario_id, lida),
  INDEX idx_criado_em (criado_em)
);
```

---

**Status**: ✅ **PRODUÇÃO - v1.0**
**Data de Implementação**: Março 2026
**Desenvolvedor**: Eduardo Ferreira
**Última Atualização**: Março 11, 2026
