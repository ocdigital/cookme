# Header Components

## HeaderWithProfile

Componente reutilizável para renderizar um header com ícone de perfil, opcionalmente com um alerta/badge.

### Props

| Prop | Type | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `onProfilePress` | Function | Sim | Callback ao clicar no ícone de perfil |
| `onAlertPress` | Function | Não | Callback ao clicar no alerta |
| `alertCount` | Number | Não | Número para exibir no badge (só mostra se > 0) |
| `alertColor` | String | Não | Cor do ícone de alerta (padrão: colors.primary) |

### Exemplos

#### Apenas perfil
```javascript
import { HeaderWithProfile } from '../components/HeaderWithProfile';

<HeaderWithProfile
  onProfilePress={() => navigation.navigate('Profile')}
/>
```

#### Perfil + Alerta (como na tela Home)
```javascript
<HeaderWithProfile
  onProfilePress={() => navigation.navigate('Profile')}
  onAlertPress={() => setShowModal(true)}
  alertCount={expiringProducts.length}
  alertColor={colors.primary}
/>
```

### Visualmente

```
┌─────────────────────────────────────┐
│                              ⏰  👤 │  <- Alerta + Perfil
└─────────────────────────────────────┘
       (alertCount=2 quando hover)
```

---

## Uso em screens

Veja exemplos em:
- `HomeScreenRecipes.js` - Implementação com alerta
- Outras telas também podem usar este componente

## Padrão no App

O header padrão em todas as telas do tab navigator já inclui o ícone de perfil automaticamente.
Se você precisa customizar (adicionar alerta, etc), use este componente.
