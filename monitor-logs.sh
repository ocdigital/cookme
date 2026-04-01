#!/bin/bash

###############################################################################
# 📊 CookMe - Monitor de Logs em Tempo Real
#
# Este script monitora os logs de todos os serviços em tempo real
#
# Uso:
#   ./monitor-logs.sh              # Monitorar tudo
#   ./monitor-logs.sh backend      # Apenas backend
#   ./monitor-logs.sh frontend     # Apenas frontend
#   ./monitor-logs.sh mobile       # Apenas mobile
#   ./monitor-logs.sh errors       # Apenas erros
#   ./monitor-logs.sh help         # Ver ajuda
#
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header() {
  echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

show_help() {
  cat << 'EOF'

📊 CookMe - Monitor de Logs em Tempo Real

USO:

  ./monitor-logs.sh              Monitorar todos os serviços
  ./monitor-logs.sh backend      Monitorar apenas Backend
  ./monitor-logs.sh frontend     Monitorar apenas Frontend
  ./monitor-logs.sh mobile       Monitorar apenas Mobile
  ./monitor-logs.sh errors       Monitorar apenas ERROS
  ./monitor-logs.sh tail         Últimas 50 linhas de cada log
  ./monitor-logs.sh grep PALAVRA Buscar palavra em todos os logs
  ./monitor-logs.sh help         Ver esta mensagem

EXEMPLOS:

  # Monitorar tudo em tempo real
  ./monitor-logs.sh

  # Monitorar apenas erros
  ./monitor-logs.sh errors

  # Buscar "Cannot" nos logs
  ./monitor-logs.sh grep "Cannot"

  # Ver últimas 100 linhas do backend
  tail -100 .backend.log

DICAS:

  • Pressione CTRL+C para parar o monitoramento
  • Use pipes para filtrar: tail -f .backend.log | grep "error"
  • Combine com sed, awk, etc para formatação customizada

CORES NOS LOGS:

  🔴 RED    - Erros
  🟢 GREEN  - Sucesso
  🟡 YELLOW - Avisos
  🔵 BLUE   - Informação

EOF
}

monitor_all() {
  print_header "📊 Monitorando TODOS os Serviços"

  print_info "Backend: $(test -f "$PROJECT_ROOT/.backend.log" && echo '✅' || echo '⏸️')"
  print_info "Frontend: $(test -f "$PROJECT_ROOT/.frontend.log" && echo '✅' || echo '⏸️')"
  print_info "Mobile: $(test -f "$PROJECT_ROOT/.mobile.log" && echo '✅' || echo '⏸️')"

  echo -e "${YELLOW}Pressione CTRL+C para parar${NC}\n"

  tail -f \
    "$PROJECT_ROOT"/.backend.log \
    "$PROJECT_ROOT"/.frontend.log \
    "$PROJECT_ROOT"/.mobile.log \
    2>/dev/null | while read -r line; do

    # Colorir output
    if echo "$line" | grep -qi "error\|exception\|fail"; then
      echo -e "${RED}$line${NC}"
    elif echo "$line" | grep -qi "success\|completed\|running"; then
      echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -qi "warning\|warn"; then
      echo -e "${YELLOW}$line${NC}"
    elif echo "$line" | grep -qi "backend\|nestjs"; then
      echo -e "${BLUE}$line${NC}"
    elif echo "$line" | grep -qi "frontend\|vite\|react"; then
      echo -e "${MAGENTA}$line${NC}"
    elif echo "$line" | grep -qi "mobile\|expo\|metro"; then
      echo -e "${CYAN}$line${NC}"
    else
      echo "$line"
    fi
  done
}

monitor_backend() {
  print_header "🔧 Monitorando Backend (NestJS)"

  if [ ! -f "$PROJECT_ROOT/.backend.log" ]; then
    echo -e "${RED}❌ Log do backend não encontrado${NC}"
    echo "Execute: ./startup.sh --backend"
    return 1
  fi

  echo -e "${YELLOW}Pressione CTRL+C para parar${NC}\n"

  tail -f "$PROJECT_ROOT/.backend.log" | while read -r line; do
    if echo "$line" | grep -qi "error\|exception"; then
      echo -e "${RED}$line${NC}"
    elif echo "$line" | grep -qi "success\|started\|listening"; then
      echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -qi "warning"; then
      echo -e "${YELLOW}$line${NC}"
    else
      echo -e "${BLUE}$line${NC}"
    fi
  done
}

monitor_frontend() {
  print_header "⚛️  Monitorando Frontend (Vite React)"

  if [ ! -f "$PROJECT_ROOT/.frontend.log" ]; then
    echo -e "${RED}❌ Log do frontend não encontrado${NC}"
    echo "Execute: ./startup.sh --frontend"
    return 1
  fi

  echo -e "${YELLOW}Pressione CTRL+C para parar${NC}\n"

  tail -f "$PROJECT_ROOT/.frontend.log" | while read -r line; do
    if echo "$line" | grep -qi "error\|exception"; then
      echo -e "${RED}$line${NC}"
    elif echo "$line" | grep -qi "ready\|compiled\|✓"; then
      echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -qi "warning"; then
      echo -e "${YELLOW}$line${NC}"
    else
      echo -e "${MAGENTA}$line${NC}"
    fi
  done
}

monitor_mobile() {
  print_header "📱 Monitorando Mobile (Expo)"

  if [ ! -f "/tmp/expo.log" ]; then
    echo -e "${RED}❌ Log do Expo não encontrado${NC}"
    echo "Execute: ./startup.sh --mobile"
    return 1
  fi

  echo -e "${YELLOW}Pressione CTRL+C para parar${NC}\n"

  tail -f /tmp/expo.log | while read -r line; do
    if echo "$line" | grep -qi "error\|exception\|failed"; then
      echo -e "${RED}$line${NC}"
    elif echo "$line" | grep -qi "ready\|running\|success"; then
      echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -qi "warning"; then
      echo -e "${YELLOW}$line${NC}"
    else
      echo -e "${CYAN}$line${NC}"
    fi
  done
}

monitor_errors() {
  print_header "🚨 Monitorando APENAS ERROS"

  echo -e "${YELLOW}Pressione CTRL+C para parar${NC}\n"

  tail -f \
    "$PROJECT_ROOT"/.backend.log \
    "$PROJECT_ROOT"/.frontend.log \
    "$PROJECT_ROOT"/.mobile.log \
    2>/dev/null | grep -i "error\|exception\|fail\|cannot\|refused" | while read -r line; do

    echo -e "${RED}[ERRO] $line${NC}"
  done
}

show_tail() {
  print_header "📋 Últimas 50 linhas de cada log"

  echo -e "${BLUE}══════ BACKEND ══════${NC}"
  tail -50 "$PROJECT_ROOT/.backend.log" 2>/dev/null || echo "Sem logs"

  echo -e "\n${MAGENTA}══════ FRONTEND ══════${NC}"
  tail -50 "$PROJECT_ROOT/.frontend.log" 2>/dev/null || echo "Sem logs"

  echo -e "\n${CYAN}══════ MOBILE ══════${NC}"
  tail -50 /tmp/expo.log 2>/dev/null || echo "Sem logs"
}

grep_logs() {
  local pattern=$1
  print_header "🔍 Buscando: $pattern"

  echo -e "${BLUE}Backend:${NC}"
  grep -i "$pattern" "$PROJECT_ROOT/.backend.log" 2>/dev/null | tail -10 || echo "Não encontrado"

  echo -e "\n${MAGENTA}Frontend:${NC}"
  grep -i "$pattern" "$PROJECT_ROOT/.frontend.log" 2>/dev/null | tail -10 || echo "Não encontrado"

  echo -e "\n${CYAN}Mobile:${NC}"
  grep -i "$pattern" /tmp/expo.log 2>/dev/null | tail -10 || echo "Não encontrado"
}

# Main
case "${1:-}" in
  backend)
    monitor_backend
    ;;
  frontend)
    monitor_frontend
    ;;
  mobile)
    monitor_mobile
    ;;
  errors)
    monitor_errors
    ;;
  tail)
    show_tail
    ;;
  grep)
    if [ -z "$2" ]; then
      echo -e "${RED}Uso: ./monitor-logs.sh grep PALAVRA${NC}"
      exit 1
    fi
    grep_logs "$2"
    ;;
  help | -h | --help)
    show_help
    ;;
  *)
    monitor_all
    ;;
esac
