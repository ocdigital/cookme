#!/bin/bash
# Deploy frontend admin para produção
# Uso: ./scripts/deploy-frontend.sh

set -e

echo "🔨 Building frontend..."
cd "$(dirname "$0")/../frontend"
VITE_API_URL=https://api.cookme.com.br/api npx vite build

echo "🚀 Enviando para VPS..."
rsync -az --delete dist/ root@206.189.239.250:/var/www/cookme-admin/

echo "✅ Deploy concluído — https://admin.cookme.com.br"
