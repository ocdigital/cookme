# WebSocket Real-Time Notifications Setup

## Visão Geral

Sistema de notificações em tempo real usando Socket.io:
- **Backend**: Gateway WebSocket em `localhost:3000/notificacoes`
- **Frontend**: Hook React `useNotificacoes` para conectar e escutar eventos
- **Fallback**: Polling automático se WebSocket desconectar

---

## Backend

### Instalação
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Componentes

#### 1. Gateway (`src/modules/notificacoes/gateways/notificacao.gateway.ts`)
- Escuta conexões WebSocket
- Gerencia mapa `usuarioId -> socketIds` para organização
- Oferece métodos para emitir notificações:
  - `enviarNotificacaoParaUsuario(usuarioId, notificacao)`
  - `enviarNotificacaoParaTodos(notificacao)`
  - `enviarNotificacaoParaGrupo(grupo, notificacao)`

#### 2. Service Atualizado (`src/modules/notificacoes/services/notificacao.service.ts`)
- Injecta `NotificacaoGateway`
- Emite evento `nova-notificacao` quando `criar()` é chamado

#### 3. Module (`src/modules/notificacoes/notificacao.module.ts`)
- Exporta `NotificacaoGateway` para uso em outros módulos

#### 4. App Module (`src/app.module.ts`)
- Importa `NotificacaoModule`

---

## Frontend

### Instalação
```bash
npm install socket.io-client
```

### Hook: `useNotificacoes`

Localização: `src/hooks/useNotificacoes.ts`

#### Uso Básico

```typescript
import { useNotificacoes } from '../hooks/useNotificacoes';

export const MyComponent = () => {
  const usuarioId = localStorage.getItem('usuarioId'); // ou obter de auth context

  const {
    notifications,  // Notificações em tempo real
    isConnected,    // Status WebSocket
    addNotification,
    removeNotification,
    clearAll
  } = useNotificacoes(usuarioId);

  return (
    <div>
      {isConnected && <span>Conectado 🟢</span>}
      {!isConnected && <span>Desconectado ⚠️</span>}

      {notifications.map(notif => (
        <div key={notif.id}>{notif.titulo}</div>
      ))}
    </div>
  );
};
```

### Componentes Já Integrados

#### NotificationBell (`src/components/NotificationBell.tsx`)
- Exibe notificações não-lidas em dropdown
- Mostra status WebSocket (green = conectado, yellow = fallback)
- Polling fallback a cada 30 segundos

#### NotificationsPage (`src/pages/NotificationsPage.tsx`)
- Página completa de notificações
- Filtros por tipo e status de leitura
- Mostra status de conexão no header

---

## Fluxo de Dados

### 1. Usuário conecta ao admin
```
Frontend carrega usuarioId de localStorage
→ Hook useNotificacoes se conecta ao gateway
→ Backend adiciona usuário a room `usuario:${usuarioId}`
```

### 2. Nova notificação é criada
```
Backend cria notificacao via NotificacaoService.criar()
→ Gateway emite `nova-notificacao` para room do usuário
→ Frontend recebe evento e adiciona à lista
→ NotificationBell atualiza badge
```

### 3. Desconexão ou falha
```
WebSocket desconecta → isConnected = false
→ Fallback polling ativa (a cada 30s em NotificationBell, 15s em NotificationsPage)
→ Frontend busca notificações via API REST
→ Ao reconectar, volta a escutar WebSocket
```

---

## Como Emitir Notificações

### Exemplo 1: Receita Denunciada

```typescript
// Em receitas.service.ts
import { NotificacaoGateway } from '../notificacoes/gateways/notificacao.gateway';

constructor(
  private notificacaoGateway: NotificacaoGateway,
) {}

async denunciarReceita(receitaId: string, motivo: string) {
  // ... lógica de denuncia ...

  // Emitir notificação para todos os admins
  this.notificacaoGateway.enviarNotificacaoParaTodos({
    id: uuid(),
    tipo: 'moderacao',
    severidade: 'alta',
    titulo: 'Nova Receita Denunciada',
    mensagem: `Receita foi denunciada: ${motivo}`,
    dados: { receitaId },
    acao_label: 'Revisar',
    acao_rota: `/admin/receitas/${receitaId}`,
    usuario_admin_id: 'admin-id',
    lido: false,
    criado_em: new Date(),
  });
}
```

### Exemplo 2: Usuário Inativo

```typescript
// Em usuarios.service.ts (rodar via job scheduled)
async notificarUsuariosInativos() {
  const inativos = await this.usuariosRepository
    .createQueryBuilder()
    .where('ultimo_acesso < :data', { data: 30dias_atrás })
    .getMany();

  inativos.forEach(usuario => {
    this.notificacaoGateway.enviarNotificacaoParaTodos({
      tipo: 'usuarios',
      severidade: 'media',
      titulo: 'Usuário Inativo',
      mensagem: `${usuario.nome} não acessa há 30+ dias`,
      dados: { usuarioId: usuario.id },
      usuario_admin_id: 'admin-id',
      // ... mais campos
    });
  });
}
```

---

## Variáveis de Ambiente

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
# Socket.io vai rodar na mesma porta do app (3000) no namespace /notificacoes
```

---

## Troubleshooting

### "WebSocket desconectado - usando fallback"
- Verificar se backend está rodando
- Verificar CORS em gateway (`cors: { origin: '*' }`)
- Verificar se usuarioId está sendo enviado

### Notificações não aparecem em tempo real
- Abrir DevTools → Network → WS
- Procurar conexão em `/socket.io/`
- Verificar se mensagens estão sendo emitidas (server logs)

### Muitas reconexões
- Verificar latência de rede
- Aumentar `reconnectionDelayMax` em useNotificacoes
- Verificar firewall bloqueando WebSocket

---

## Próximas Melhorias

1. **Persistência**: Salvar notificações não-lidas se usuário ficar offline
2. **Redis**: Usar Redis para sincronizar múltiplos servidores
3. **Email**: Enviar emails para notificações críticas
4. **Preferences**: Admin escolher quais tipos de notificação receber
5. **Sound Alert**: Tocar som para notificações críticas
