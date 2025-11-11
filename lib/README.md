# CookMe - Scraper de Cupons Fiscais SAT-SP

Script automatizado em Python para extrair dados de cupons fiscais eletrônicos SAT-SP e integrá-los automaticamente com a API CookMe.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Como Funciona](#como-funciona)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura de Dados](#estrutura-de-dados)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Este script automatiza todo o processo de:
1. Ler QR Code de cupons fiscais SAT (São Paulo)
2. Acessar o site da Fazenda de SP
3. Resolver reCAPTCHA manualmente
4. Extrair todos os produtos e informações do cupom
5. Salvar automaticamente na API CookMe
6. Gerar backup em JSON local

## 🔄 Como Funciona

### Fluxo do Script

```
QR Code → Extração da Chave → Consulta SAT-SP → Resolver reCAPTCHA
    ↓
Extração de Dados (produtos, estabelecimento, valores)
    ↓
Autenticação na API CookMe
    ↓
Para cada produto:
    ├─ Buscar se já existe (por código de barras)
    ├─ Se não existe → Criar novo produto
    └─ Mapear para a compra
    ↓
Registrar compra completa na API
    ↓
Salvar backup JSON local
```

### Classes Principais

#### `CookMeAPIClient`
Cliente HTTP para integração com a API CookMe.

**Métodos:**
- `autenticar()` - Faz login e obtém token JWT
- `buscar_produto_por_codigo(codigo)` - Busca produto por código de barras
- `criar_produto(produto_data)` - Cria novo produto
- `criar_compra(compra_data)` - Registra compra completa
- `salvar_cupom_fiscal(cupom_dados)` - Método principal que orquestra todo o processo

#### `LeitorQRCodeSAT`
Extrai a chave de acesso do texto do QR Code.

**Métodos:**
- `extrair_chave_de_texto(texto)` - Extrai chave de 44 dígitos do QR Code

#### `ConsultaSATRobusta`
Controla a automação do navegador e extração de dados.

**Métodos:**
- `iniciar_navegador()` - Inicia Chrome com Selenium
- `encontrar_campo_chave()` - Localiza campo de entrada no site
- `extrair_dados_cupom(html)` - Extrai produtos e informações do HTML
- `consultar(chave)` - Executa todo o processo de consulta

## 📦 Instalação

### Pré-requisitos

- Python 3.12+
- Google Chrome instalado
- Conexão com internet

### Passo a Passo

```bash
# Navegar até a pasta lib
cd /home/eduardo/projetos/cookme/lib

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt
```

### Dependências

```
selenium          # Automação do navegador
webdriver-manager # Gerenciamento automático do ChromeDriver
requests          # Cliente HTTP para API
```

## ⚙️ Configuração

### 1. Criar arquivo de configuração

Crie o arquivo `config.json` na pasta `lib/`:

```json
{
  "api": {
    "base_url": "http://localhost:3000/api",
    "email": "seu@email.com",
    "senha": "suaSenha"
  },
  "scraper": {
    "timeout_captcha": 120,
    "headless": false
  }
}
```

### 2. Variáveis de Configuração

#### API
- `base_url` - URL base da API CookMe (padrão: http://localhost:3000/api)
- `email` - Email do usuário cadastrado na API
- `senha` - Senha do usuário

#### Scraper
- `timeout_captcha` - Tempo limite para resolver reCAPTCHA em segundos (padrão: 120)
- `headless` - Executar Chrome em modo headless (true/false)

### 3. Configuração Atual (Hardcoded)

Atualmente, as credenciais estão no código ([captcha_manual.py:494-498](captcha_manual.py#L494-L498)):

```python
api_client = CookMeAPIClient(
    base_url="http://localhost:3000/api",
    email="eduardo@ocdigital.com.br",
    senha="3221#Edu"
)
```

## 🚀 Uso

### Execução Básica

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Executar script
python captcha_manual.py
```

### Passo a Passo de Uso

1. **Execute o script**
   ```bash
   python captcha_manual.py
   ```

2. **Cole o texto do QR Code**
   - O script mostra um exemplo de QR Code
   - Confirme se deseja usar o exemplo ou cole outro QR Code

3. **Aguarde abertura do navegador**
   - Chrome abrirá automaticamente
   - Aguarde o carregamento da página da Fazenda

4. **Resolva o reCAPTCHA**
   - Clique no checkbox "Não sou um robô"
   - Resolva o desafio se aparecer
   - Aguarde até o botão "Consultar" ficar habilitado

5. **Aguarde o processamento**
   - Script clicará automaticamente no botão
   - Aguarde extração dos dados
   - Produtos serão salvos na API automaticamente

6. **Verifique os resultados**
   - Console mostrará produtos criados
   - Compra registrada com sucesso
   - Arquivos gerados localmente

### Exemplo de QR Code

```
35251005088303000121590006146504781051248106|20251031103830|83.09||JewGEhBbHavStPy3r6DIDCK...
```

## 📊 Estrutura de Dados

### Dados Extraídos do Cupom

```json
{
  "estabelecimento": {
    "nome": "SUPERMERCADO LISA",
    "cnpj": "05.088.303/0001-21",
    "endereco": "AVENIDA ARMANDO MARIO TOZZI, Nº 676",
    "bairro": "JARDIM LISA - CAMPINAS - SP"
  },
  "itens": [
    {
      "numero": 1,
      "codigo": "8516",
      "descricao": "Linguica Fina De Frango",
      "quantidade": 0.85,
      "unidade": "KG",
      "valor_unitario": 47.99,
      "valor_total": 40.79
    }
  ],
  "totais": {
    "total": 83.09,
    "cartao_debito": 83.09
  },
  "informacoes_fiscais": {
    "numero_extrato": "478105",
    "numero_sat": "000614650-38",
    "data": "31/10/2025",
    "hora": "10:38:30",
    "chave_acesso": "35251005088303000121590006146504781051248106"
  }
}
```

### Mapeamento para API

#### Produto
```json
{
  "nome": "Linguica Fina De Frango",
  "codigo_barras": "8516",
  "unidade_padrao": "kg"
}
```

#### Compra
```json
{
  "data_compra": "2025-10-31",
  "local_compra": "SUPERMERCADO LISA",
  "valor_total": 83.09,
  "metodo_cadastro": "cupom_sat",
  "itens": [
    {
      "produto_id": "uuid-do-produto",
      "quantidade": 0.85,
      "unidade": "kg",
      "preco_unitario": 47.99
    }
  ]
}
```

## 📁 Arquivos Gerados

Para cada execução, são gerados:

- `cupom_dados_TIMESTAMP.json` - Dados extraídos do cupom
- `cupom_screenshot_TIMESTAMP.png` - Screenshot do cupom no navegador
- `debug_cupom_TIMESTAMP.html` - HTML completo da página
- `debug_texto_pagina_TIMESTAMP.txt` - Texto visível da página

**Exemplo:**
```
cupom_dados_1762127189.json
cupom_screenshot_1762127189.png
debug_cupom_1762127189.html
debug_texto_pagina_1762127189.txt
```

## 🔧 Troubleshooting

### Erro: "Chrome não encontrado"

**Solução:**
```bash
# Ubuntu/Debian
sudo apt install google-chrome-stable

# Ou baixe manualmente
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

### Erro: "Timeout ao resolver reCAPTCHA"

**Causas possíveis:**
- Tempo esgotado (padrão: 120 segundos)
- reCAPTCHA não foi resolvido corretamente

**Solução:**
- Aumente o timeout no código
- Certifique-se de clicar no checkbox e resolver o desafio completamente

### Erro: "Falha na autenticação"

**Causas possíveis:**
- API não está rodando
- Credenciais incorretas
- URL da API incorreta

**Solução:**
```bash
# Verificar se API está rodando
curl http://localhost:3000/api/auth/login

# Verificar credenciais no código ou config.json
```

### Erro: "Produto não foi criado"

**Causas possíveis:**
- Campos obrigatórios faltando
- Erro de validação na API

**Solução:**
- Verifique os logs no console
- Verifique a resposta da API (campo `Resposta:`)
- Certifique-se que a API aceita os dados enviados

### Erro: "Compra não foi registrada - metodo_cadastro inválido"

**Solução:**
Certifique-se que o código usa `"cupom_sat"`:
```python
"metodo_cadastro": "cupom_sat"  # Correto
# Não use: "nota_fiscal", "manual", etc.
```

## 📝 Notas Importantes

### Limitações
- ⚠️ Apenas cupons SAT-SP (São Paulo)
- ⚠️ Requer resolução manual do reCAPTCHA
- ⚠️ Depende da estrutura do site da Fazenda (pode quebrar se mudarem)
- ⚠️ Código de barras pode não ser o EAN-13 real do produto

### Boas Práticas
- ✅ Mantenha backup dos arquivos JSON gerados
- ✅ Verifique se a API está rodando antes de executar
- ✅ Não compartilhe suas credenciais
- ✅ Use ambiente virtual Python
- ✅ Atualize as dependências regularmente

### Segurança
- 🔒 Credenciais devem estar em `config.json` (não no código)
- 🔒 Adicione `config.json` ao `.gitignore`
- 🔒 Não compartilhe o arquivo `config.json`

## 🔄 Próximas Melhorias

- [ ] Suporte para outros tipos de cupons fiscais (NFC-e, NF-e)
- [ ] Resolução automática de reCAPTCHA (serviços de terceiros)
- [ ] Interface gráfica (GUI)
- [ ] Modo headless (sem abrir navegador)
- [ ] Upload de imagem do QR Code
- [ ] Detecção automática de categorias dos produtos
- [ ] Sincronização com Open Food Facts para dados nutricionais

## 📞 Suporte

Em caso de problemas:
1. Verifique a seção [Troubleshooting](#troubleshooting)
2. Consulte os logs gerados
3. Verifique os arquivos debug_*.txt e debug_*.html

---

**Desenvolvido com Python + Selenium + CookMe API**
