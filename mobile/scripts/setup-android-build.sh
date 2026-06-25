#!/usr/bin/env bash
# Setup local Android build environment for CookMe mobile
# Ubuntu 24.04 x86_64 — run once, then use build-apk.sh
set -euo pipefail

echo "=== 1/4 Instalando JDK 17 ==="
sudo apt-get update -q
sudo apt-get install -y openjdk-17-jdk

JAVA_HOME_PATH=$(dirname $(dirname $(readlink -f $(which javac))))
echo "JAVA_HOME=$JAVA_HOME_PATH"

# Persiste em ~/.bashrc se ainda não estiver lá
if ! grep -q "JAVA_HOME" ~/.bashrc; then
  echo "" >> ~/.bashrc
  echo "export JAVA_HOME=$JAVA_HOME_PATH" >> ~/.bashrc
  echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
fi
export JAVA_HOME=$JAVA_HOME_PATH
export PATH=$JAVA_HOME/bin:$PATH

echo "=== 2/4 Baixando Android command-line tools ==="
ANDROID_SDK_ROOT="$HOME/Android/Sdk"
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"

CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
TMP_ZIP="/tmp/cmdline-tools.zip"

if [ ! -f "$TMP_ZIP" ]; then
  curl -Lo "$TMP_ZIP" "$CMDLINE_TOOLS_URL"
fi

unzip -qo "$TMP_ZIP" -d /tmp/cmdline-tools-unzip
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools/latest"
# Google zipa com subpasta "cmdline-tools" dentro
cp -r /tmp/cmdline-tools-unzip/cmdline-tools/* "$ANDROID_SDK_ROOT/cmdline-tools/latest/"
rm -rf /tmp/cmdline-tools-unzip "$TMP_ZIP"

SDKMANAGER="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"

# Persiste ANDROID_HOME
if ! grep -q "ANDROID_HOME" ~/.bashrc; then
  echo "" >> ~/.bashrc
  echo "export ANDROID_HOME=$ANDROID_SDK_ROOT" >> ~/.bashrc
  echo "export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT" >> ~/.bashrc
  echo "export PATH=\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH" >> ~/.bashrc
fi
export ANDROID_HOME=$ANDROID_SDK_ROOT
export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "=== 3/4 Instalando SDK components (aceita licenças automaticamente) ==="
yes | "$SDKMANAGER" --licenses > /dev/null 2>&1 || true
"$SDKMANAGER" \
  "platform-tools" \
  "platforms;android-35" \
  "build-tools;35.0.0" \
  "ndk;27.1.12297006"

echo "=== 4/4 Criando local.properties ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$SCRIPT_DIR/../android"
echo "sdk.dir=$ANDROID_SDK_ROOT" > "$ANDROID_DIR/local.properties"
echo "Criado: $ANDROID_DIR/local.properties"

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para buildar o APK:"
echo "  cd $(dirname $SCRIPT_DIR)"
echo "  bash scripts/build-apk.sh"
echo ""
echo "IMPORTANTE: abra um novo terminal (ou rode 'source ~/.bashrc') para JAVA_HOME/ANDROID_HOME entrarem em vigor."
