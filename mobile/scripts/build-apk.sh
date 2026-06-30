#!/usr/bin/env bash
# Gera APK de debug (sem keystore) ou release (usa debug keystore como preview)
# Uso: bash scripts/build-apk.sh [debug|release]
# Default: release (equivale ao eas build --profile preview)
set -euo pipefail

VARIANT="${1:-release}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="$MOBILE_DIR/android"

# Carrega variáveis de ambiente para o build
# Release usa .env.production, debug usa .env.local
if [ "$VARIANT" = "debug" ] && [ -f "$MOBILE_DIR/.env.local" ]; then
  set -a; source "$MOBILE_DIR/.env.local"; set +a
elif [ -f "$MOBILE_DIR/.env.production" ]; then
  set -a; source "$MOBILE_DIR/.env.production"; set +a
fi
echo "API URL: ${EXPO_PUBLIC_API_URL:-não definida}"

# Valida ambiente
if ! command -v java &>/dev/null; then
  echo "❌ Java não encontrado. Rode: bash scripts/setup-android-build.sh"
  exit 1
fi

if [ ! -f "$ANDROID_DIR/local.properties" ]; then
  echo "❌ local.properties não encontrado. Rode: bash scripts/setup-android-build.sh"
  exit 1
fi

echo "=== Build variant: $VARIANT ==="
echo "Diretório: $ANDROID_DIR"
echo ""

# Bundla o JS com expo antes do gradle (necessário em bare workflow com expo-cli)
echo "--- Bundling JS com Expo ---"
cd "$MOBILE_DIR"
npx expo export:embed \
  --platform android \
  --entry-file node_modules/expo/AppEntry.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --dev false 2>/dev/null || true
# O gradle também faz isso automaticamente — o comando acima é só para validar

echo ""
echo "--- Rodando Gradle ---"
cd "$ANDROID_DIR"

# SENTRY_DISABLE_AUTO_UPLOAD=true pula upload de source maps (sem token local)
# SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD=true pula upload de debug nativo
if [ "$VARIANT" = "debug" ]; then
  SENTRY_DISABLE_AUTO_UPLOAD=true SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD=true \
    ./gradlew assembleDebug --no-daemon
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
  SENTRY_DISABLE_AUTO_UPLOAD=true SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD=true \
    ./gradlew assembleRelease --no-daemon
  APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

FULL_APK_PATH="$ANDROID_DIR/$APK_PATH"

if [ -f "$FULL_APK_PATH" ]; then
  SIZE=$(du -sh "$FULL_APK_PATH" | cut -f1)
  echo ""
  echo "✅ APK gerado ($SIZE):"
  echo "   $FULL_APK_PATH"
  echo ""
  echo "Para instalar em dispositivo conectado via USB:"
  echo "   adb install -r \"$FULL_APK_PATH\""
else
  echo "❌ APK não encontrado em $FULL_APK_PATH"
  exit 1
fi
