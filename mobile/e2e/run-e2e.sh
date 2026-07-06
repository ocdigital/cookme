#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Runner E2E do CookMe — duas camadas:
#   1. contrato.sh  — API dirigida como o app (segundos, sem device)
#   2. Maestro      — UI real no device físico (USB) ou emulador
#
# Uso:
#   ./run-e2e.sh              # só contrato
#   ./run-e2e.sh --ui         # contrato + Maestro (exige device adb + expo start)
# ─────────────────────────────────────────────────────────────────────────────
set -u
cd "$(dirname "$0")"
export PATH="$PATH:$HOME/.maestro/bin"

echo "═══ Camada 1: contrato (API) ═══"
./contrato.sh || { echo "✗ Contrato falhou — não adianta subir UI"; exit 1; }

if [ "${1:-}" != "--ui" ]; then
  echo
  echo "(camada UI pulada — use --ui com device conectado + 'npx expo start' rodando)"
  exit 0
fi

echo
echo "═══ Camada 2: UI (Maestro) ═══"
if ! command -v maestro >/dev/null; then
  echo "✗ Maestro não está no PATH (instale: curl -fsSL https://get.maestro.mobile.dev | bash)"
  exit 1
fi

DEVICES=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
if [ -z "$DEVICES" ]; then
  echo "✗ Nenhum device adb conectado."
  echo "  Celular físico: ative 'Depuração USB' (Config > Sobre > 7 taps em Número da versão"
  echo "  > Opções do desenvolvedor > Depuração USB), conecte o cabo e aceite o prompt."
  echo "  Depois: adb devices  (deve listar o aparelho)"
  exit 1
fi
echo "Device: $DEVICES"

echo "Lembrete: 'npx expo start' precisa estar rodando (porta 8081) e o device na mesma rede."
maestro test flows/
