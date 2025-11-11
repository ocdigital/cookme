#!/bin/bash

echo "=========================================="
echo "CookMe Scraper - Script de Instalação"
echo "=========================================="
echo ""

# Verificar Python
echo "🐍 Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3.12+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✅ Python $PYTHON_VERSION encontrado"

# Criar ambiente virtual
echo ""
echo "📦 Criando ambiente virtual..."
if [ -d "venv" ]; then
    echo "⚠️  Ambiente virtual já existe. Removendo..."
    rm -rf venv
fi

python3 -m venv venv
echo "✅ Ambiente virtual criado"

# Ativar ambiente virtual
echo ""
echo "🔄 Ativando ambiente virtual..."
source venv/bin/activate

# Atualizar pip
echo ""
echo "⬆️  Atualizando pip..."
pip install --upgrade pip

# Instalar dependências
echo ""
echo "📥 Instalando dependências..."
pip install -r requirements.txt

echo ""
echo "✅ Dependências instaladas:"
pip list | grep -E "selenium|requests|webdriver-manager"

# Criar arquivo de configuração
echo ""
echo "⚙️  Configurando arquivo config.json..."
if [ ! -f "config.json" ]; then
    cp config.example.json config.json
    echo "✅ config.json criado a partir do exemplo"
    echo "⚠️  IMPORTANTE: Edite config.json com suas credenciais!"
else
    echo "⚠️  config.json já existe, não foi sobrescrito"
fi

echo ""
echo "=========================================="
echo "✅ Instalação concluída!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Edite config.json com suas credenciais da API"
echo "2. Certifique-se que a API está rodando"
echo "3. Execute: source venv/bin/activate"
echo "4. Execute: python captcha_manual.py"
echo ""
echo "Documentação completa em: README.md"
echo ""
