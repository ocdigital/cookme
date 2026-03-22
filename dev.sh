#!/bin/bash

# 🚀 Script de Desenvolvimento - CookMe
# Este script inicia todos os serviços de forma mais conveniente para desenvolvimento

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🍳 CookMe - Development Mode                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar argumentos
if [ "$1" == "backend" ]; then
    print_status "Iniciando Backend em desenvolvimento..."
    cd backend
    npm run start:dev
    exit 0
fi

if [ "$1" == "frontend" ]; then
    print_status "Iniciando Frontend em desenvolvimento..."
    cd frontend
    npm run dev
    exit 0
fi

if [ "$1" == "mobile" ]; then
    print_status "Matando processos Expo/npm anteriores..."
    pkill -9 -f "expo start|npm start" 2>/dev/null || true
    sleep 2

    print_status "Limpando cache do Expo..."
    rm -rf node_modules/.cache 2>/dev/null || true

    print_status "Iniciando Mobile com Expo na porta 8081..."
    echo ""
    cd mobile
    npx expo start
    exit 0
fi

if [ "$1" == "db" ]; then
    print_status "Iniciando apenas banco de dados (Docker)..."
    docker-compose up postgres redis
    exit 0
fi

if [ "$1" == "all" ] || [ -z "$1" ]; then
    # Iniciar tudo
    print_status "Iniciando infraestrutura (Docker)..."
    docker-compose up -d
    print_success "Infraestrutura iniciada"
    sleep 3

    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              ✅ Serviços iniciados em background               ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}Próximos passos - abra novas abas do terminal:${NC}"
    echo ""
    echo "  1️⃣  Backend:  ./dev.sh backend"
    echo "  2️⃣  Frontend: ./dev.sh frontend"
    echo "  3️⃣  Mobile:   ./dev.sh mobile"
    echo ""
    echo -e "${BLUE}URLs de Acesso:${NC}"
    echo "  📱 Frontend:  ${YELLOW}http://localhost:5173${NC}"
    echo "  🔌 Backend:   ${YELLOW}http://localhost:3000${NC}"
    echo "  📚 Swagger:   ${YELLOW}http://localhost:3000/api/docs${NC}"
    echo ""
    echo -e "${YELLOW}Outros comandos:${NC}"
    echo "  ./dev.sh db          - Apenas banco de dados"
    echo "  docker-compose down  - Parar tudo"
    echo ""
    exit 0
fi

if [ "$1" == "help" ] || [ "$1" == "--help" ]; then
    echo "Uso: ./dev.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  ./dev.sh              Inicia apenas infraestrutura (Docker)"
    echo "  ./dev.sh backend      Inicia Backend em desenvolvimento"
    echo "  ./dev.sh frontend     Inicia Frontend em desenvolvimento"
    echo "  ./dev.sh mobile       Inicia Mobile com Expo (mostra QR code)"
    echo "  ./dev.sh db           Inicia apenas banco de dados"
    echo "  ./dev.sh all          Mesmo que ./dev.sh (infraestrutura)"
    echo "  ./dev.sh help         Mostra esta mensagem"
    echo ""
    exit 0
fi

echo "Comando desconhecido: $1"
echo "Use: ./dev.sh help"
exit 1
