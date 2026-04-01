# 🐳 Docker Compose - Problema Resolvido

## ❌ Erro Original

Se você estava recebendo este erro ao executar `./startup.sh`:

```
ERROR: for postgres-cookme  'ContainerConfig'
KeyError: 'ContainerConfig'
```

## ✅ Solução Aplicada

O problema era causado por uma versão **muito antiga** do `docker-compose` (v1.29.2) que tinha um bug ao tentar gerenciar containers.

### O que foi mudado:

1. **Atualizar comandos no script**
   - ❌ Antes: `docker-compose -f docker-compose.yml`
   - ✅ Depois: `docker compose -f docker-compose.yml`

2. **Remover versão obsoleta**
   - ❌ Antes: `version: '3.8'` no `docker-compose.yml`
   - ✅ Depois: Removido (Docker agora ignora isso)

## 🔧 Por que isso funciona?

A partir do **Docker 20.10+** (2020), o `docker compose` foi integrado como subcomando nativo do Docker:

```bash
# Antes (dependência externa)
docker-compose up -d
↓
# Agora (integrado no Docker)
docker compose up -d
```

**Vantagens da versão nova:**
- ✅ Sem dependência externa
- ✅ Versão sempre sincronizada com Docker
- ✅ Menos bugs
- ✅ Performance melhorada
- ✅ Suporte completo a todas as features modernas

## ✨ Verificar sua Versão

```bash
# Ver versão do Docker
docker --version

# Verificar se suporta "docker compose"
docker compose version
```

Se receber erro em `docker compose version`, você tem uma versão muito antiga do Docker. Atualize!

## 🚀 Agora Funciona!

```bash
./startup.sh
```

## 🐛 Se o Problema Persistir

### 1. Verificar Docker version
```bash
docker --version
# Esperado: Docker version 20.10+
```

### 2. Se é muito antiga, atualizar
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io

# macOS com Homebrew
brew install docker
```

### 3. Remover containers antigos
```bash
docker compose -f docker-compose.yml down -v
docker rm postgres-cookme redis-cookme 2>/dev/null || true
```

### 4. Tentar novamente
```bash
./startup.sh
```

## 📊 Compatibilidade

| Docker Version | Status |
|---|---|
| < 20.10 | ❌ Não suporta `docker compose` |
| 20.10 - 24.x | ✅ Funciona perfeitamente |
| 25.x+ | ✅ Funciona perfeitamente |

---

**Tudo deve estar funcionando agora! 🎉**

Execute: `./startup.sh`
