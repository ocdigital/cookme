# 🐛 Guia de Debug - Erros ao Processar QR Code

## O Problema

Quando você escaneia um QR code de cupom fiscal, pode ocorrer um erro e não aparece uma mensagem clara do que aconteceu.

## ✅ Solução Implementada

Agora o app mostra:
1. **Mensagens de erro melhoradas** - Exibe o erro da API no Alert
2. **Detalhes adicionais** - Se houver detalhes do erro, mostra junto
3. **Logs no console** - Todos os erros são logados para debug

## 📱 Como Ver os Logs

### Opção 1: Usando Expo CLI (Recomendado)

```bash
# Se estiver rodando o Expo no terminal
# Os logs aparecerão no próprio terminal onde você executou "npx expo start"

# Procure por:
# - "Erro ao iniciar consulta:"
# - "Erro completo:"
# - "Mensagem de erro:"
```

### Opção 2: Usando o Expo Go App

No celular/emulador:
1. Abra o Expo Go
2. Vá para Developer Menu (agitar o celular ou CTRL+M no emulador)
3. Clique em "View logs"

### Opção 3: Usando Android Studio (Android Emulator)

```bash
# Abra o Android Studio e vá em:
# View → Tool Windows → Logcat

# Procure por:
# - "ReactNativeJS"
# - "Erro"
```

## 🔍 O Que o Debug Mostra

Quando há erro ao processar QR code, você verá no console:

```
Erro ao iniciar consulta: [Error object]
Erro completo: { ... JSON do erro completo ... }
Mensagem de erro: [Mensagem legível]
Detalhes: [Informações adicionais]
```

## 🛠️ Causas Comuns de Erro

| Erro | Causa | Solução |
|------|-------|---------|
| `QR Code Inválido` | QR code com menos de 100 caracteres | Verifique se o QR code é válido e completo |
| `Resposta inválida do servidor` | Backend não retornou sessionId | Verifique se o backend está rodando |
| `Erro de conexão` | Mobile não consegue conectar ao backend | Verifique o IP em `/mobile/src/config/api.js` |
| `Erro 400` | Limite de consultas simultâneas atingido | Aguarde alguns minutos e tente novamente |
| `Erro 500` | Erro interno do servidor | Verifique os logs do backend |

## 🚀 Melhorias Feitas

1. **QRScannerScreen.js**
   - ✅ Melhor detecção de erros de resposta
   - ✅ Logs detalhados no console
   - ✅ Mensagens de erro amigáveis no Alert

2. **ProcessingScreen.js**
   - ✅ Captura de erros durante polling
   - ✅ Exibição de detalhes do erro
   - ✅ Logs completos para debug

## 🔧 Como Reportar Erro

Se encontrar um erro, verifique o console e colha:

1. A mensagem exata do erro (do Alert na tela)
2. Os logs do console (use as Opções 1-3 acima)
3. O QR code que está usando (ou parte dele)
4. Os logs do backend (`cd backend && npm run start:dev`)

## 📝 Próximas Melhorias Sugeridas

- [ ] Adicionar retry automático com backoff exponencial
- [ ] Armazenar histórico de erros localmente
- [ ] Adicionar suporte para diferentes tipos de cupom fiscal
- [ ] Criar tela específica para erros de configuração

---

**Última atualização**: 2026-01-17
**Versão**: 1.0
