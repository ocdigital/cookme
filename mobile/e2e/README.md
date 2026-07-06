# E2E do CookMe

Duas camadas, da mais barata para a mais completa:

## Camada 1 — Contrato (`contrato.sh`)

Dirige a API local **exatamente como o app faz** (mesmo usuário, mesmas rotas,
mesmos shapes). Roda em segundos, sem device. Asserts incluem os bugs reais que
já quebraram o app:

- resposta **UTF-8 válida** (2026-07-06: detalhe servido em Latin-1 → tela branca)
- listas **são arrays** (2026-07-06: favoritas como objeto → crash `.map`)
- enum da busca web (2026-07-05: 500 por valor faltando no enum)
- todas as rotas que cada tela consome (Home, Receitas, Despensa, Detalhe)

```bash
./contrato.sh                          # backend local (default)
E2E_EMAIL=x E2E_SENHA=y ./contrato.sh  # outro usuário
```

**Rodar SEMPRE antes de PR que toque backend ou contrato de API.**

## Camada 2 — UI real (Maestro, `flows/`)

Abre o app de verdade e navega: login → Home → Receitas → detalhe (com retry
se cair no estado de erro) → Despensa (asserta que sabonete/detergente NÃO
aparecem).

Requisitos:
1. Backend local rodando (`npm run start:dev` no backend)
2. `npx expo start` rodando no mobile (porta 8081)
3. Device Android com **Expo Go** conectado por USB com *Depuração USB* ativa
   (`adb devices` deve listar) — ou emulador

```bash
./run-e2e.sh          # só contrato
./run-e2e.sh --ui     # contrato + Maestro
maestro test flows/   # só UI
```

Maestro instalado em `~/.maestro/bin` (adicione ao PATH ou use o runner).

## Emulador Android (pendente — disco)

A máquina tem KVM e o SDK, mas o disco estava com só ~3GB livres
(2026-07-06) — uma system image + AVD precisam de ~6-10GB. Quando liberar
espaço:

```bash
SDK=~/Android/Sdk
$SDK/cmdline-tools/latest/bin/sdkmanager "emulator" "system-images;android-34;google_apis;x86_64"
$SDK/cmdline-tools/latest/bin/avdmanager create avd -n cookme -k "system-images;android-34;google_apis;x86_64" -d pixel_6
$SDK/emulator/emulator -avd cookme -no-snapshot -no-audio &
# instalar Expo Go no emulador: npx expo start --android (instala sozinho)
./run-e2e.sh --ui
```

## Convenção

Bug de UI reproduzido → vira assert num flow. Bug de API/shape → vira assert
no contrato.sh. Nada de bug consertado sem teste que o teria pego.
