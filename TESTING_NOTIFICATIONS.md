# Testando Notificações em Tempo Real

## Setup Rápido

### 1. Iniciar Backend
```bash
cd backend
npm run start:dev
```

Você deve ver:
```
[NestFactory] Starting Nest application...
[InstanceLoader] NotificacaoModule dependencies initialized...
WebSocketServer started on port 3000
```

### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
```

Acesse: `http://localhost:5173`

### 3. Fazer Login como Admin
1. Clique em "Admin"
2. Use credenciais de teste (se houver)
3. Observe o sino de notificações no header

---

## Testar Notificações em Tempo Real

### Método 1: Via cURL (Rápido)

#### Receita Denunciada
```bash
curl -X POST http://localhost:3000/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"receita_denunciada"}'
```

#### Novo Usuário
```bash
curl -X POST http://localhost:3000/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"novo_usuario"}'
```

#### Usuário Inativo
```bash
curl -X POST http://localhost:3000/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"usuario_inativo"}'
```

#### Produto Incompleto
```bash
curl -X POST http://localhost:3000/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"produto_incompleto"}'
```

#### Erro de Sistema
```bash
curl -X POST http://localhost:3000/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"erro_sistema"}'
```

#### Limite de Recursos
```bash
curl -X POST http://localhost:3000/notificacoes/test/trigger \
  -H "Content-Type: application/json" \
  -d '{"tipo":"limite_recursos"}'
```

### Método 2: Via Postman

1. New Request
2. URL: `POST http://localhost:3000/notificacoes/test/trigger`
3. Body (raw JSON):
```json
{"tipo":"receita_denunciada"}
```
4. Send

---

## Observar Notificações no Frontend

### Sino de Notificações (NotificationBell)
- Fica no header superior
- Mostra badge com número de não-lidas
- Clique para abrir dropdown
- Veja status WebSocket (🟢 verde = conectado)

### Página de Notificações
- Navegue para `/admin/notificacoes` (ou similar)
- Veja todas as notificações com filtros
- Cada notificação mostra:
  - Ícone de severidade (🔴🟠🟡🔵)
  - Tipo (Moderação, Qualidade, Usuários, Sistema)
  - Título e mensagem
  - Horário de criação
  - Botões de ação (marcar como lido, deletar, link de ação)

---

## Verificar Conexão WebSocket

### DevTools → Network → WS
1. Abrir DevTools do navegador (F12)
2. Ir para aba "Network"
3. Filtro: "WS"
4. Procure por conexão em `socket.io/`
5. Clique nela e abra aba "Messages"
6. Dispare um trigger e observe mensagens em tempo real

Exemplo de mensagem recebida:
```json
{
  "id": "uuid-123",
  "tipo": "moderacao",
  "severidade": "alta",
  "titulo": "Receita Denunciada",
  "mensagem": "\"Bolo de Chocolate\" foi denunciada 3x. Requer revisão.",
  "dados": {
    "receitaId": "test-123",
    "quantidadeDenuncias": 3
  },
  "acao_label": "Revisar Receita",
  "acao_rota": "/admin/receitas/test-123",
  "lido": false,
  "criado_em": "2026-03-15T..."
}
```

---

## Checklist de Testes

- [ ] Backend compila sem erros
- [ ] Frontend compila sem erros
- [ ] Sino de notificações aparece no header
- [ ] Status WebSocket aparece (verde ou amarelo)
- [ ] Disparar notificação via cURL
- [ ] Notificação aparece no sino em < 1 segundo
- [ ] Notificação aparece na página de notificações
- [ ] Badge de número de não-lidas atualiza
- [ ] Clicar em "Revisar" navega para URL correta
- [ ] Marcar como lido remove dot vermelho
- [ ] Deletar remove notificação da lista
- [ ] Filtros funcionam (tipo, lida/não-lida)
- [ ] Fallback polling funciona (desligar WebSocket manual)

---

## Troubleshooting

### Notificação não aparece
1. Verificar logs do backend:
   ```
   [NotificacaoGateway] Notificação enviada para usuário: ...
   ```
2. Verificar console do frontend para erros
3. Verificar se `usuarioId` está em `localStorage`
4. Verificar DevTools → Network → WS se há conexão

### WebSocket desconectado
1. Verificar se backend está rodando
2. Verificar firewall (pode bloquear WebSocket)
3. Se tiver proxy, verificar se suporta upgrade WebSocket
4. Frontend cai para fallback polling automaticamente

### Usuario_admin_id inválido
- No endpoint de teste, usamos `'system'` como usuarioId
- Em produção, usar ID real do admin autenticado
- Modificar `notificacao-triggers.service.ts` conforme necessário

---

## Próximas Etapas (Removendo Testes)

### 1. Remover Endpoint de Teste
Delete o endpoint `POST /notificacoes/test/trigger` do controller:
```typescript
// Remover este bloco antes de produção
@Post('test/trigger')
async testarTrigger(...) { ... }
```

### 2. Implementar Triggers Reais
Integrar `NotificacaoTriggersService` em cada módulo:
- `UsuariosService` → nova conta
- `ReceitasService` → denuncias
- `ProdutosService` → campos faltando
- Job agendado → usuários inativos

### 3. Persistência em Produção
Se usar múltiplos servidores:
```bash
npm install redis
```
Configurar Redis no Socket.io para sincronizar conexões entre servidores.

---

## Código de Referência

### Usar em Seu Service
```typescript
import { NotificacaoTriggersService } from '../notificacoes/services/notificacao-triggers.service';

@Injectable()
export class MeuService {
  constructor(
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {}

  async meuEvento() {
    // ... lógica ...

    // Emitir notificação
    await this.notificacaoTriggers.custom(
      'moderacao',
      'alta',
      'Título',
      'Mensagem',
      { dados: 'custom' },
      { label: 'Ação', rota: '/link', id: 'id' },
    );
  }
}
```

---

## Performance

- **WebSocket**: ~50ms latência local
- **Polling fallback**: 15-30s delay
- **Database**: Notificações indexadas por `(usuario_admin_id, lido)`
- **Memory**: Mapa de usuários em gateway descartado ao desconectar

Observar padrões de latência em produção via DevTools.
