# Migração do Script Python para Modo API

## Resumo

O script `captcha_manual.py` precisa ser modificado para suportar dois modos:
1. **Modo Manual** (atual) - Execução interativa
2. **Modo API** - Execução via backend NestJS com comunicação JSON

## Mudanças Necessárias

### 1. Adicionar Argumentos de Linha de Comando

No final do arquivo, adicionar:

```python
def parse_args():
    """Parse argumentos de linha de comando"""
    parser = argparse.ArgumentParser(description='Consulta cupom fiscal SAT-SP')
    parser.add_argument('--mode', choices=['manual', 'api'], default='manual',
                       help='Modo de execução')
    parser.add_argument('--session-id', help='ID da sessão (modo API)')
    parser.add_argument('--qrcode', help='Texto do QR Code')
    return parser.parse_args()
```

### 2. Modificar Método `consultar` da Classe `ConsultaSATRobusta`

Adicionar comunicação JSON nos pontos críticos:

#### Linha ~548 - Quando aguarda CAPTCHA:

```python
# 3. Aguardar reCAPTCHA
if self.modo_api:
    # Modo API: notificar backend e aguardar sinal
    enviar_mensagem_json(
        "captcha_required",
        url=self.url,
        session_id=getattr(self, 'session_id', None)
    )
    print("🧩 Aguardando resolução do CAPTCHA...", file=sys.stderr)
    aguardar_continuar()
else:
    # Modo manual: aguardar usuario resolver
    print(f"\n🧩 3. RESOLVA O reCAPTCHA!")
    print("="*60)
    # ... código existente ...
```

#### Linha ~570 - Durante polling do CAPTCHA:

```python
while time.time() - tempo_inicio < tempo_espera_captcha:
    try:
        recaptcha_response = self.driver.execute_script(...)
        botao_habilitado = not botao_temp.get_attribute("disabled")

        if self.modo_api:
            # Em modo API, verifica se CAPTCHA foi resolvido
            if recaptcha_response and len(recaptcha_response) > 50 and botao_habilitado:
                enviar_mensagem_json("status", status="processando_dados", progress=70)
                break
            time.sleep(2)
        else:
            # Modo manual (código existente)
            if recaptcha_response and len(recaptcha_response) > 50 and botao_habilitado:
                print("\n✅ reCAPTCHA RESOLVIDO!")
                captcha_resolvido = True
                break
            # ... resto do código ...
```

#### Linha ~650 - Quando inicia processamento:

```python
if self.modo_api:
    enviar_mensagem_json("status", status="salvando_api", progress=90)
```

#### Linha ~690 - Quando conclui:

```python
if self.modo_api:
    enviar_mensagem_json(
        "compra_criada",
        compra_id=compra_criada.get('id'),
        total_produtos=len(cupom_dados['itens']),
        valor_total=cupom_dados['totais'].get('total', 0)
    )
```

#### Em caso de erro:

```python
except Exception as e:
    if self.modo_api:
        enviar_mensagem_json("erro", mensagem=str(e))
    else:
        print(f"\n❌ Erro: {e}")
    raise
```

### 3. Modificar Função `main()`

```python
def main():
    """Função principal"""
    args = parse_args()

    if args.mode == 'api':
        # Modo API: usar argumentos
        if not args.qrcode:
            enviar_mensagem_json("erro", mensagem="QR Code não fornecido")
            sys.exit(1)

        texto_qrcode = args.qrcode
        chave = LeitorQRCodeSAT.extrair_chave_de_texto(texto_qrcode)

        if not chave:
            enviar_mensagem_json("erro", mensagem="Falha ao extrair chave do QR Code")
            sys.exit(1)

        enviar_mensagem_json("status", status="consultando_sat", progress=25)

        consultor = ConsultaSATRobusta(modo_api=True)
        consultor.session_id = args.session_id
        consultor.iniciar_navegador()
        consultor.consultar(chave)

    else:
        # Modo manual (código existente)
        print("🎯 CONSULTA SAT-SP COM QR CODE")
        print("="*60)

        texto_exemplo = "35251005088303000121590006146504781051248106|20251031103830|83.09||..."

        chave = LeitorQRCodeSAT.extrair_chave_de_texto(texto_exemplo)

        if chave:
            # ... resto do código manual ...
```

### 4. Testar Modo API

```bash
# Terminal 1: Iniciar backend
cd backend
npm run start:dev

# Terminal 2: Testar script em modo API
cd lib
source venv/bin/activate
python captcha_manual.py --mode api --session-id "test-123" --qrcode "35251005..."
```

## Protocolo de Comunicação JSON

### Mensagens enviadas pelo Python (stdout):

```json
// Status atualizado
{"type": "status", "status": "consultando_sat", "progress": 25}

// CAPTCHA necessário
{"type": "captcha_required", "url": "https://...", "session_id": "abc-123"}

// Compra criada
{"type": "compra_criada", "compra_id": "xyz", "total_produtos": 3, "valor_total": 83.09}

// Erro
{"type": "erro", "mensagem": "Descrição do erro"}
```

### Mensagens recebidas pelo Python (stdin):

```
continue\n  // Continuar após CAPTCHA resolvido
```

## Checklist

- [ ] Adicionar `argparse` aos imports
- [ ] Adicionar funções `enviar_mensagem_json()` e `aguardar_continuar()`
- [ ] Modificar `__init__` da classe `ConsultaSATRobusta`
- [ ] Modificar método `consultar()` para enviar mensagens JSON
- [ ] Modificar função `main()` para aceitar argumentos
- [ ] Testar modo manual (não quebrar funcionalidade existente)
- [ ] Testar modo API com backend

## Arquivos Modificados

- `lib/captcha_manual.py` - Script principal
- `backend/src/modules/scraper/*` - Módulo scraper (já criado)

## Próximos Passos

Após essas modificações:
1. Testar modo manual para garantir que não quebrou
2. Testar modo API localmente
3. Testar integração completa com mobile (mock)
4. Documentar no README
