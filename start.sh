#!/bin/bash
# Versão simplificada: apenas inicia tudo rapidinho
set -e
cd "$(dirname "$0")"
echo "🚀 CookMe - Iniciando serviços..."
docker-compose up -d postgres redis 2>/dev/null || true
nohup npm --prefix backend run start:dev >.backend.log 2>&1 &
nohup npm --prefix frontend run dev >.frontend.log 2>&1 &
nohup npm --prefix mobile expo start --clear >.mobile.log 2>&1 &
echo "✅ Tudo iniciado! Acesse:"
echo "   Backend:   http://localhost:3000"
echo "   Frontend:  http://localhost:5173"
echo "   Mobile:    Expo Go (QR code no terminal)"
