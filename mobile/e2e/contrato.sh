#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Suíte de CONTRATO do CookMe — dirige a API exatamente como o app mobile.
# Primeira linha de defesa E2E: roda em segundos, sem device, e pega bugs
# reais (ex: 2026-07-06 — detalhe de receita servido em Latin-1 quebrava o
# parse do app → tela branca; o assert de UTF-8 daqui teria pegado).
#
# Uso:  ./contrato.sh [BASE_URL]     (default http://localhost:3000/api)
# Env:  E2E_EMAIL / E2E_SENHA        (default edu1@cookme.com / edu3221)
# ─────────────────────────────────────────────────────────────────────────────
set -u
BASE="${1:-http://localhost:3000/api}"
EMAIL="${E2E_EMAIL:-edu1@cookme.com}"
SENHA="${E2E_SENHA:-edu3221}"

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# http <método> <path> [json_body] → status em $STATUS, corpo em $BODY_FILE
BODY_FILE=$(mktemp)
http() {
  local method=$1 path=$2 body=${3:-}
  local args=(-s -o "$BODY_FILE" -w '%{http_code}' -X "$method" "$BASE$path" -H "Authorization: Bearer ${TOKEN:-}")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  STATUS=$(curl "${args[@]}")
}

# Asserts em python (utf-8, shapes)
py() { python3 -c "$1" < "$BODY_FILE"; }
assert_utf8() {
  if py "import sys; sys.stdin.buffer.read().decode('utf-8')" 2>/dev/null; then
    ok "$1: UTF-8 válido"
  else
    fail "$1: RESPOSTA NÃO É UTF-8 (app não parseia → tela branca)"
  fi
}
assert_array() { # $1 nome, $2 expr python que extrai a lista do json
  if py "import json,sys; d=json.load(sys.stdin); l=$2; assert isinstance(l,list), type(l)" 2>/dev/null; then
    ok "$1: é array"
  else
    fail "$1: NÃO é array (guard Array.isArray existe, mas contrato quebrou)"
  fi
}

echo "── CookMe · suíte de contrato · $BASE"

# 0. Health
http GET /health
[ "$STATUS" = 200 ] && ok "health 200" || { fail "health $STATUS — backend está rodando?"; echo "── ABORTADO"; exit 1; }

# 1. Login (fluxo do app)
TOKEN=""
http POST /auth/login "{\"email\":\"$EMAIL\",\"senha\":\"$SENHA\"}"
TOKEN=$(py "import json,sys; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
if [ "$STATUS" = 200 ] && [ -n "$TOKEN" ]; then ok "login $EMAIL"; else fail "login falhou ($STATUS)"; echo "── ABORTADO"; exit 1; fi

# 2. Despensa (tab Despensa)
http GET /inventario
[ "$STATUS" = 200 ] && ok "GET /inventario 200" || fail "GET /inventario $STATUS"
assert_utf8 "inventario"

# 3. Favoritas (Home + Receitas — crash de 2026-07-06)
http GET /receitas/favoritas
[ "$STATUS" = 200 ] && ok "GET /receitas/favoritas 200" || fail "GET /receitas/favoritas $STATUS"
assert_array "favoritas" "d"

# 4. Receitas disponíveis (tab Receitas)
http GET /receitas/disponiveis
[ "$STATUS" = 200 ] && ok "GET /receitas/disponiveis 200" || fail "GET /receitas/disponiveis $STATUS"
assert_utf8 "disponiveis"
assert_array "disponiveis.receitas" "d.get('receitas')"
RID=$(py "import json,sys; rs=json.load(sys.stdin).get('receitas',[]); print(rs[0]['id'] if rs else '')" 2>/dev/null)

# 5. Quase-possíveis
http GET /receitas/quase-possiveis
[ "$STATUS" = 200 ] && ok "GET /receitas/quase-possiveis 200" || fail "quase-possiveis $STATUS"
assert_array "quase-possiveis.receitas" "d.get('receitas')"

# 6. Detalhe da receita (tela que ficava branca)
if [ -n "$RID" ]; then
  http GET "/receitas/$RID"
  [ "$STATUS" = 200 ] && ok "GET /receitas/:id 200" || fail "GET /receitas/:id $STATUS"
  assert_utf8 "detalhe"  # ← o bug de 2026-07-06
  if py "import json,sys; r=json.load(sys.stdin)['receita']; assert r.get('titulo'); assert r.get('id')" 2>/dev/null; then
    ok "detalhe: shape {receita:{titulo,id}}"
  else
    fail "detalhe: shape inesperado"
  fi
  # 6b. Extras que a tela de detalhe carrega em paralelo
  for ep in minha-avaliacao comentarios favoritado; do
    http GET "/receitas/$RID/$ep"
    [ "$STATUS" = 200 ] && ok "GET :id/$ep 200" || fail "GET :id/$ep $STATUS"
  done
else
  fail "sem receita disponível para testar detalhe"
fi

# 7. Busca web (erro de enum de 2026-07-05)
http POST /receitas/web/buscar '{"ingredientes":["frango","arroz"]}'
[ "$STATUS" = 201 ] || [ "$STATUS" = 200 ] && ok "POST /receitas/web/buscar $STATUS" || fail "web/buscar $STATUS"

# 8. Sugestões da Home
for ep in "sugestoes/para-mim" "sugestoes/desafios"; do
  http GET "/receitas/$ep"
  [ "$STATUS" = 200 ] && ok "GET /receitas/$ep 200" || fail "GET /receitas/$ep $STATUS"
done

# 9. Eventos (métricas — não pode quebrar o app)
http POST /eventos/app-open
[ "$STATUS" = 204 ] && ok "POST /eventos/app-open 204" || fail "eventos/app-open $STATUS"

# 10. Esqueci minha senha (anti-enumeração: e-mail inexistente TAMBÉM responde 200)
http_noauth() { STATUS=$(curl -s -o "$BODY_FILE" -w '%{http_code}' -X POST "$BASE$1" -H 'Content-Type: application/json' -d "$2"); }
http_noauth /auth/esqueci-senha '{"email":"nao-existe-'$RANDOM'@cookme.test"}'
[ "$STATUS" = 200 ] && ok "esqueci-senha e-mail inexistente → 200 (anti-enumeração)" || fail "esqueci-senha inexistente $STATUS"
http_noauth /auth/redefinir-senha '{"email":"nao-existe@cookme.test","codigo":"000000","nova_senha":"abc12345"}'
[ "$STATUS" = 400 ] && ok "redefinir-senha código inválido → 400 genérico" || fail "redefinir-senha $STATUS"

rm -f "$BODY_FILE"
echo "──"
echo "PASS: $PASS  FAIL: $FAIL"
[ "$FAIL" -eq 0 ]
