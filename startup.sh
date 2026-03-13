#!/bin/bash

# 🚀 Script de Startup - CookMe (com Docker Compose)
# Este script inicia todos os serviços automaticamente

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🍳 CookMe - Startup Script                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Verificar Docker
print_status "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado!"
    exit 1
fi
print_success "Docker encontrado"

# 2. Verificar Docker Compose
print_status "Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado!"
    exit 1
fi
print_success "Docker Compose encontrado"
echo ""

# 3. Verificar docker-compose.yml
print_status "Verificando docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml não encontrado no diretório atual!"
    exit 1
fi
print_success "docker-compose.yml encontrado"
echo ""

# 4. Iniciar infraestrutura com Docker Compose
print_status "Iniciando infraestrutura (PostgreSQL + Redis)..."
docker-compose up -d
print_success "Infraestrutura iniciada"
echo ""

# 5. Aguardar serviços ficarem prontos
print_status "Aguardando serviços ficarem prontos..."
sleep 5

# Verificar PostgreSQL
print_status "Verificando PostgreSQL..."
docker-compose exec -T postgres pg_isready -U cookme > /dev/null 2>&1 || {
    print_warning "PostgreSQL ainda está inicializando, aguardando..."
    sleep 5
}
print_success "PostgreSQL pronto!"

# Verificar Redis
print_status "Verificando Redis..."
docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 || {
    print_warning "Redis ainda está inicializando, aguardando..."
    sleep 3
}
print_success "Redis pronto!"
echo ""

# 6. Iniciar aplicações em backgrounds
print_status "Iniciando aplicações..."
echo ""

# Backend
print_status "Iniciando Backend..."
cd backend
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
print_success "Backend iniciado (PID: $BACKEND_PID)"
echo ""

# Aguardar backend iniciar
sleep 6

# Frontend
print_status "Iniciando Frontend..."
cd ../frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
print_success "Frontend iniciado (PID: $FRONTEND_PID)"
echo ""

# Mobile
print_status "Iniciando Mobile (Expo)..."
cd ../mobile
npx expo start 2>&1 | tee /tmp/mobile.log &
MOBILE_PID=$!
print_success "Mobile iniciado (PID: $MOBILE_PID)"
echo ""

# Exibir resumo
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ Tudo pronto!                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}URLs de Acesso:${NC}"
echo "  📱 Frontend:  ${BLUE}http://localhost:5173${NC}"
echo "  🔌 Backend:   ${BLUE}http://localhost:3000${NC}"
echo "  📚 Swagger:   ${BLUE}http://localhost:3000/api/docs${NC}"
echo "  📲 Mobile:    ${BLUE}Veja o QR code abaixo↓${NC}"
echo ""
echo -e "${GREEN}Databases (Docker):${NC}"
echo "  🗄️  PostgreSQL: localhost:5432"
echo "  🔴 Redis:      localhost:6379"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "  Ver logs do backend:   tail -f /tmp/backend.log"
echo "  Ver logs do frontend:  tail -f /tmp/frontend.log"
echo "  Ver logs do mobile:    tail -f /tmp/mobile.log"
echo "  Ver status Docker:     docker-compose ps"
echo ""
echo -e "${YELLOW}Para parar tudo:${NC}"
echo "  Pressione Ctrl+C aqui, ou execute:"
echo "  docker-compose down"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Aguardar indefinidamente
wait
