#!/bin/bash

###############################################################################
# 🚀 CookMe - Script de Inicialização Completa
#
# Este script inicia todos os serviços do projeto:
# ✅ Docker (PostgreSQL + Redis)
# ✅ Backend (NestJS)
# ✅ Frontend (Vite React)
# ✅ Mobile (Expo React Native)
#
# Uso:
#   ./startup.sh              # Inicia todos os serviços
#   ./startup.sh --stop       # Para todos os serviços
#   ./startup.sh --clean      # Remove containers e volumes
#   ./startup.sh --logs       # Mostra logs de todos os serviços
#   ./startup.sh --backend    # Inicia apenas backend
#   ./startup.sh --frontend   # Inicia apenas frontend
#   ./startup.sh --mobile     # Inicia apenas mobile
#
###############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
MOBILE_DIR="$PROJECT_ROOT/mobile"

# PID files
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"
MOBILE_PID_FILE="$PROJECT_ROOT/.mobile.pid"

###############################################################################
# FUNÇÕES AUXILIARES
###############################################################################

print_header() {
  echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verifica se um comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verifica se um serviço está rodando
is_running() {
  if [ -f "$1" ]; then
    pid=$(cat "$1" 2>/dev/null)
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

###############################################################################
# DOCKER
###############################################################################

docker_up() {
  print_header "🐳 Iniciando Docker (PostgreSQL + Redis)"

  if ! command_exists docker; then
    print_error "Docker não está instalado"
    return 1
  fi

  if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon não está rodando"
    return 1
  fi

  # Verifica se containers já estão rodando
  if docker ps --format '{{.Names}}' | grep -q "postgres-cookme"; then
    print_warning "PostgreSQL já está rodando"
  else
    print_info "Iniciando PostgreSQL..."
    docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d postgres || {
      print_error "Falha ao iniciar PostgreSQL"
      return 1
    }
    print_success "PostgreSQL iniciado"
    sleep 3
  fi

  if docker ps --format '{{.Names}}' | grep -q "redis-cookme"; then
    print_warning "Redis já está rodando"
  else
    print_info "Iniciando Redis..."
    docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d redis || {
      print_error "Falha ao iniciar Redis"
      return 1
    }
    print_success "Redis iniciado"
  fi

  print_success "Docker pronto! (PostgreSQL: 5432, Redis: 6379)"
  return 0
}

docker_stop() {
  print_header "🛑 Parando Docker"

  if ! command_exists docker; then
    print_warning "Docker não está instalado"
    return 0
  fi

  docker compose -f "$PROJECT_ROOT/docker-compose.yml" down 2>/dev/null || true
  print_success "Docker parado"
  return 0
}

docker_clean() {
  print_header "🧹 Limpando Docker (remove containers e volumes)"

  if ! command_exists docker; then
    print_warning "Docker não está instalado"
    return 0
  fi

  read -p "Tem certeza que deseja remover todos os containers e volumes? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    docker compose -f "$PROJECT_ROOT/docker-compose.yml" down -v 2>/dev/null || true
    print_success "Docker limpo"
  else
    print_warning "Operação cancelada"
  fi
  return 0
}

###############################################################################
# BACKEND
###############################################################################

backend_check() {
  if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Diretório backend não encontrado: $BACKEND_DIR"
    return 1
  fi

  if [ ! -f "$BACKEND_DIR/package.json" ]; then
    print_error "package.json não encontrado em backend"
    return 1
  fi

  return 0
}

backend_install() {
  print_info "Instalando dependências do backend..."
  cd "$BACKEND_DIR"
  npm install >/dev/null 2>&1 || {
    print_error "Falha ao instalar dependências do backend"
    return 1
  }
  print_success "Dependências do backend instaladas"
  return 0
}

backend_start() {
  print_header "🔧 Iniciando Backend (NestJS)"

  if ! backend_check; then
    return 1
  fi

  if is_running "$BACKEND_PID_FILE"; then
    print_warning "Backend já está rodando (PID: $(cat $BACKEND_PID_FILE))"
    return 0
  fi

  # Verifica se existem dependências
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    backend_install || return 1
  fi

  cd "$BACKEND_DIR"
  print_info "Iniciando servidor... (logs em: .backend.log)"
  nohup npm run start:dev >>"$PROJECT_ROOT/.backend.log" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"

  # Aguarda servidor ficar pronto
  print_info "Aguardando backend ficar pronto..."
  for i in {1..30}; do
    if curl -s http://localhost:3000/api/docs >/dev/null 2>&1; then
      print_success "Backend rodando em http://localhost:3000 (PID: $(cat $BACKEND_PID_FILE))"
      print_info "Swagger Docs: http://localhost:3000/api/docs"
      return 0
    fi
    sleep 1
  done

  print_warning "Backend iniciado, mas ainda aquecendo... (pode levar alguns segundos)"
  print_info "Logs: tail -f $PROJECT_ROOT/.backend.log"
  return 0
}

backend_stop() {
  if is_running "$BACKEND_PID_FILE"; then
    print_info "Parando backend (PID: $(cat $BACKEND_PID_FILE))..."
    kill $(cat "$BACKEND_PID_FILE") 2>/dev/null || true
    rm "$BACKEND_PID_FILE" 2>/dev/null || true
    print_success "Backend parado"
  else
    print_warning "Backend não está rodando"
  fi
  return 0
}

###############################################################################
# FRONTEND
###############################################################################

frontend_check() {
  if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Diretório frontend não encontrado: $FRONTEND_DIR"
    return 1
  fi

  if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    print_error "package.json não encontrado em frontend"
    return 1
  fi

  return 0
}

frontend_install() {
  print_info "Instalando dependências do frontend..."
  cd "$FRONTEND_DIR"
  npm install >/dev/null 2>&1 || {
    print_error "Falha ao instalar dependências do frontend"
    return 1
  }
  print_success "Dependências do frontend instaladas"
  return 0
}

frontend_start() {
  print_header "⚛️  Iniciando Frontend (Vite React)"

  if ! frontend_check; then
    return 1
  fi

  if is_running "$FRONTEND_PID_FILE"; then
    print_warning "Frontend já está rodando (PID: $(cat $FRONTEND_PID_FILE))"
    return 0
  fi

  # Verifica se existem dependências
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    frontend_install || return 1
  fi

  cd "$FRONTEND_DIR"
  print_info "Iniciando servidor... (logs em: .frontend.log)"
  nohup npm run dev >>"$PROJECT_ROOT/.frontend.log" 2>&1 &
  echo $! > "$FRONTEND_PID_FILE"

  # Aguarda servidor ficar pronto
  print_info "Aguardando frontend ficar pronto..."
  for i in {1..30}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
      print_success "Frontend rodando em http://localhost:5173 (PID: $(cat $FRONTEND_PID_FILE))"
      return 0
    fi
    sleep 1
  done

  print_warning "Frontend iniciado, mas ainda aquecendo..."
  print_info "Logs: tail -f $PROJECT_ROOT/.frontend.log"
  return 0
}

frontend_stop() {
  if is_running "$FRONTEND_PID_FILE"; then
    print_info "Parando frontend (PID: $(cat $FRONTEND_PID_FILE))..."
    kill $(cat "$FRONTEND_PID_FILE") 2>/dev/null || true
    rm "$FRONTEND_PID_FILE" 2>/dev/null || true
    print_success "Frontend parado"
  else
    print_warning "Frontend não está rodando"
  fi
  return 0
}

###############################################################################
# MOBILE
###############################################################################

mobile_check() {
  if [ ! -d "$MOBILE_DIR" ]; then
    print_error "Diretório mobile não encontrado: $MOBILE_DIR"
    return 1
  fi

  if [ ! -f "$MOBILE_DIR/package.json" ]; then
    print_error "package.json não encontrado em mobile"
    return 1
  fi

  return 0
}

mobile_install() {
  print_info "Instalando dependências do mobile..."
  cd "$MOBILE_DIR"
  npm install >/dev/null 2>&1 || {
    print_error "Falha ao instalar dependências do mobile"
    return 1
  }
  print_success "Dependências do mobile instaladas"
  return 0
}

mobile_start() {
  print_header "📱 Iniciando Mobile (Expo React Native)"

  if ! mobile_check; then
    return 1
  fi

  if is_running "$MOBILE_PID_FILE"; then
    print_warning "Mobile já está rodando (PID: $(cat $MOBILE_PID_FILE))"
    return 0
  fi

  # Verifica se existem dependências
  if [ ! -d "$MOBILE_DIR/node_modules" ]; then
    mobile_install || return 1
  fi

  cd "$MOBILE_DIR"
  print_info "Iniciando Expo dev server... (logs em: .mobile.log)"
  nohup npx expo start --clear >>"$PROJECT_ROOT/.mobile.log" 2>&1 &
  echo $! > "$MOBILE_PID_FILE"

  print_success "Mobile rodando (PID: $(cat $MOBILE_PID_FILE))"
  print_info "Escaneie o QR code com Expo Go ou pressione 'a' para Android/iOS"
  print_info "Logs: tail -f $PROJECT_ROOT/.mobile.log"
  return 0
}

mobile_stop() {
  if is_running "$MOBILE_PID_FILE"; then
    print_info "Parando mobile (PID: $(cat $MOBILE_PID_FILE))..."
    kill $(cat "$MOBILE_PID_FILE") 2>/dev/null || true
    rm "$MOBILE_PID_FILE" 2>/dev/null || true
    print_success "Mobile parado"
  else
    print_warning "Mobile não está rodando"
  fi
  return 0
}

###############################################################################
# STATUS
###############################################################################

show_status() {
  print_header "📊 Status dos Serviços"

  # Docker
  if docker info >/dev/null 2>&1; then
    echo -n "Docker:    "
    if docker ps --format '{{.Names}}' | grep -q "postgres-cookme"; then
      print_success "PostgreSQL rodando (5432)"
    else
      print_error "PostgreSQL parado"
    fi
    echo -n "           "
    if docker ps --format '{{.Names}}' | grep -q "redis-cookme"; then
      print_success "Redis rodando (6379)"
    else
      print_error "Redis parado"
    fi
  else
    echo -n "Docker:    "
    print_error "Docker não está acessível"
  fi

  # Backend
  echo -n "Backend:   "
  if is_running "$BACKEND_PID_FILE"; then
    print_success "Rodando em http://localhost:3000 (PID: $(cat $BACKEND_PID_FILE))"
  else
    print_error "Parado"
  fi

  # Frontend
  echo -n "Frontend:  "
  if is_running "$FRONTEND_PID_FILE"; then
    print_success "Rodando em http://localhost:5173 (PID: $(cat $FRONTEND_PID_FILE))"
  else
    print_error "Parado"
  fi

  # Mobile
  echo -n "Mobile:    "
  if is_running "$MOBILE_PID_FILE"; then
    print_success "Rodando (PID: $(cat $MOBILE_PID_FILE))"
  else
    print_error "Parado"
  fi

  echo ""
}

###############################################################################
# HELP
###############################################################################

show_help() {
  cat << 'EOF'

🚀 CookMe - Script de Inicialização

OPÇÕES:

  ./startup.sh              Inicia todos os serviços (Docker + Backend + Frontend + Mobile)
  ./startup.sh --status     Mostra status de todos os serviços
  ./startup.sh --stop       Para todos os serviços
  ./startup.sh --clean      Remove containers e volumes Docker
  ./startup.sh --help       Mostra esta mensagem

SERVIÇOS INDIVIDUAIS:

  ./startup.sh --backend    Inicia apenas Backend (NestJS)
  ./startup.sh --frontend   Inicia apenas Frontend (Vite React)
  ./startup.sh --mobile     Inicia apenas Mobile (Expo React Native)

PARAR SERVIÇOS:

  ./startup.sh --stop-backend    Para apenas Backend
  ./startup.sh --stop-frontend   Para apenas Frontend
  ./startup.sh --stop-mobile     Para apenas Mobile

EXEMPLOS:

  # Iniciar tudo
  ./startup.sh

  # Iniciar apenas backend
  ./startup.sh --backend

  # Ver status
  ./startup.sh --status

  # Ver logs
  tail -f .backend.log
  tail -f .frontend.log
  tail -f .mobile.log

ACESSOS:

  Backend API:       http://localhost:3000
  Swagger Docs:      http://localhost:3000/api/docs
  Frontend:          http://localhost:5173
  Mobile:            Expo Go (escaneie QR code)
  PostgreSQL:        localhost:5432
  Redis:             localhost:6379

CREDENCIAIS PADRÃO:

  Database:    cookme_db
  User:        cookme
  Password:    cookme123

EOF
}

###############################################################################
# MAIN
###############################################################################

main() {
  case "${1:-}" in
    --help | -h)
      show_help
      exit 0
      ;;
    --status)
      show_status
      exit 0
      ;;
    --stop)
      print_header "🛑 Parando Todos os Serviços"
      backend_stop
      frontend_stop
      mobile_stop
      docker_stop
      print_success "Todos os serviços foram parados"
      exit 0
      ;;
    --clean)
      docker_clean
      exit 0
      ;;
    --backend)
      docker_up
      backend_start
      exit 0
      ;;
    --frontend)
      frontend_start
      exit 0
      ;;
    --mobile)
      mobile_start
      exit 0
      ;;
    --stop-backend)
      backend_stop
      exit 0
      ;;
    --stop-frontend)
      frontend_stop
      exit 0
      ;;
    --stop-mobile)
      mobile_stop
      exit 0
      ;;
    *)
      # Inicia todos os serviços
      print_header "🚀 CookMe - Inicialização Completa"
      print_info "Iniciando todos os serviços..."

      docker_up || {
        print_error "Falha ao iniciar Docker"
        exit 1
      }

      backend_start || print_warning "Problemas ao iniciar Backend"
      frontend_start || print_warning "Problemas ao iniciar Frontend"
      mobile_start || print_warning "Problemas ao iniciar Mobile"

      echo ""
      print_header "✅ Todos os Serviços Iniciados!"

      show_status

      echo ""
      print_info "Dicas úteis:"
      echo "  • Ver status:        ./startup.sh --status"
      echo "  • Ver logs:          tail -f .*.log"
      echo "  • Parar serviços:    ./startup.sh --stop"
      echo "  • Ajuda:             ./startup.sh --help"
      echo ""

      exit 0
      ;;
  esac
}

# Executa main
main "$@"
