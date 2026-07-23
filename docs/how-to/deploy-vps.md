# CookMe VPS — Runbook de Recuperação

> Documento de referência para recriar o ambiente do zero.  
> Atualizado: junho 2026

---

## 1. Servidor

| Campo | Valor |
| --- | --- |
| Provedor | DigitalOcean |
| IP | `206.189.239.250` |
| OS | Ubuntu 24.04.4 LTS |
| RAM | 1 GB |
| Disco | 24 GB (6.3 GB usado, 17 GB livre) |
| Acesso | `ssh root@206.189.239.250` |

---

## 2. Domínios e DNS

DNS gerenciado no **Cloudflare**. Ativar proxy (laranjinha) após subir o servidor.

| Domínio | Aponta para | Proxy CF |
| --- | --- | --- |
| `api.cookme.com.br` | `206.189.239.250` | ativar |
| `admin.cookme.com.br` | `206.189.239.250` | ativar |

> **Importante:** o Nginx bloqueia (`444`) qualquer acesso que não venha do Cloudflare. Ativar o proxy no CF antes de testar.

---

## 3. Estrutura de Diretórios

```
/var/www/cookme/
├── backend/           # NestJS — código-fonte + dist/
│   ├── dist/          # Build compilado (node dist/main.js)
│   └── .env           # Variáveis de ambiente (NÃO versionar)
├── frontend/          # Admin Vite/React
│   └── dist/          # Build estático (servido pelo Nginx)
├── ecosystem.config.cjs  # Config PM2
└── .backend.log       # Log unificado do PM2

/var/backups/cookme/   # Backups diários do PostgreSQL (últimos 7)
/usr/local/bin/        # Scripts de ops (cookme-*.sh)
/etc/nginx/sites-available/cookme  # Config Nginx completo
/etc/fail2ban/jail.local           # Config Fail2ban
```

---

## 4. Software Instalado

| Software | Versão | Como instalar |
| --- | --- | --- |
| Node.js | v20.20.2 | `curl -fsSL https://deb.nodesource.com/setup_20.x \| bash - && apt-get install -y nodejs` |
| npm | 10.8.2 | vem com Node |
| PM2 | 7.0.1 | `npm install -g pm2` |
| Nginx | 1.24.0 | `apt-get install -y nginx` |
| PostgreSQL | 16.14 | `apt-get install -y postgresql postgresql-contrib` |
| Certbot | 2.9.0 | `apt-get install -y certbot python3-certbot-nginx` |
| Fail2ban | 1.0.2 | `apt-get install -y fail2ban` |
| UFW | — | `apt-get install -y ufw` (vem com Ubuntu) |

---

## 5. PostgreSQL

### Banco e usuário

```sql
-- Criar usuário e banco
CREATE USER cookme WITH PASSWORD 'cookme123';
CREATE DATABASE cookme_db OWNER cookme;
GRANT ALL PRIVILEGES ON DATABASE cookme_db TO cookme;

-- Conectar ao banco e instalar extensões
\c cookme_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
```

### Restaurar backup

```bash
# Listar backups disponíveis
ls -lh /var/backups/cookme/

# Restaurar o mais recente
PGPASSWORD=cookme123 gunzip -c /var/backups/cookme/cookme_YYYYMMDD_HHMMSS.sql.gz \
  | psql -h localhost -U cookme -d cookme_db
```

### Acesso direto

```bash
PGPASSWORD=cookme123 psql -h localhost -U cookme -d cookme_db
```

---

## 6. Usuário de Sistema

O backend roda como usuário não-root `cookme-app` (sem shell de login).

```bash
# Criar usuário
useradd -r -s /usr/sbin/nologin -d /var/www/cookme cookme-app

# Dar ownership do diretório
chown -R cookme-app:cookme-app /var/www/cookme
```

---

## 7. PM2

### Ecosystem config (`/var/www/cookme/ecosystem.config.cjs`)

```javascript
module.exports = {
  apps: [{
    name: 'cookme-backend',
    cwd: '/var/www/cookme/backend',
    script: 'node',
    args: 'dist/main.js',
    watch: false,
    autorestart: true,
    max_memory_restart: '800M',
    uid: 'cookme-app',
    gid: 'cookme-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    out_file: '/var/www/cookme/.backend.log',
    error_file: '/var/www/cookme/.backend.log',
    merge_logs: true,
    time: true,
  }],
};
```

### Comandos essenciais

```bash
cd /var/www/cookme
pm2 start ecosystem.config.cjs   # Primeira vez
pm2 restart cookme-backend        # Deploy
pm2 logs cookme-backend --lines 50
pm2 status

# Garantir que PM2 sobe com o servidor
pm2 startup
pm2 save
```

---

## 8. Nginx

Config em `/etc/nginx/sites-available/cookme`. Habilitar:

```bash
ln -sf /etc/nginx/sites-available/cookme /etc/nginx/sites-enabled/cookme
nginx -t && systemctl reload nginx
```

### O que o config faz

- `api.cookme.com.br` → proxy para `127.0.0.1:3000` (NestJS)
- `admin.cookme.com.br` → arquivos estáticos em `/var/www/cookme/frontend/dist`
- Bloqueia (`444`) qualquer IP que não seja do Cloudflare
- `set_real_ip_from` → rate limit usa IP real do usuário, não IP do CF
- Rate limit: auth endpoints 5 req/min, geral 30 req/min
- WebSocket `/socket.io/` com `proxy_read_timeout 86400`
- Assets Vite com `Cache-Control: public, immutable, 1 year`
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options

### SSL (Certbot)

```bash
certbot --nginx -d api.cookme.com.br
certbot --nginx -d admin.cookme.com.br

# Renovação automática (já configurada)
certbot renew --dry-run
```

---

## 9. UFW (Firewall)

```bash
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw deny 3000 comment 'NestJS local only'
ufw deny 5432 comment 'PostgreSQL local only'
ufw enable
```

> Porta 3000 e 5432 **não abertas para internet**. NestJS ouve em `127.0.0.1:3000`.

---

## 10. Fail2ban

Config em `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
banaction = ufw
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled  = true
port     = ssh
maxretry = 3
bantime  = 86400

[nginx-http-auth]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log

[nginx-limit-req]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/access.log
maxretry = 2

[nginx-bad-request]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/access.log
maxretry = 10
```

```bash
systemctl enable fail2ban
systemctl start fail2ban
fail2ban-client status   # Verificar jails
```

---

## 11. Variáveis de Ambiente (`/var/www/cookme/backend/.env`)

> Valores reais guardados em local seguro (não no git).

| Variável | Descrição |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_USERNAME` | `cookme` |
| `DB_PASSWORD` | senha do PostgreSQL |
| `DB_DATABASE` | `cookme_db` |
| `JWT_SECRET` | segredo JWT |
| `JWT_REFRESH_SECRET` | segredo refresh token |
| `JWT_EXPIRES_IN` | ex: `7d` |
| `JWT_REFRESH_EXPIRES_IN` | ex: `30d` |
| `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` | Claude AI |
| `GEMINI_API_KEY` | Google Gemini |
| `UNSPLASH_API_KEY` | busca de imagens |
| `PEXELS_API_KEY` | busca de imagens fallback |
| `STRIPE_SECRET_KEY` | pagamentos |
| `STRIPE_WEBHOOK_SECRET` | webhook Stripe |
| `STRIPE_PRICE_PREMIUM_MENSAL` | price ID Stripe |
| `STRIPE_PRICE_PREMIUM_ANUAL` | price ID Stripe |
| `STRIPE_PRICE_FAMILIA` | price ID Stripe |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `SENTRY_DSN` | monitoramento erros |
| `R2_ACCOUNT_ID` | Cloudflare R2 storage |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 |
| `R2_BUCKET_NAME` | Cloudflare R2 |
| `R2_ENDPOINT` | Cloudflare R2 |
| `R2_PUBLIC_URL` | Cloudflare R2 |
| `FRONTEND_URL` | `https://admin.cookme.com.br` |
| `PYTHON_SERVICE_URL` | microsserviço Python (futuro) |
| `AWS_REGION` | região AWS (se usar Lambda) |

---

## 12. Scripts de Ops (`/usr/local/bin/`)

| Script | Cron | Função |
| --- | --- | --- |
| `cookme-health.sh` | `*/5 * * * *` | Healthcheck `/api/health` — reinicia PM2 se falhar |
| `cookme-backup.sh` | `0 3 * * *` | pg_dump → gzip → `/var/backups/cookme/` (7 últimos) |
| `cookme-cleanup.sh` | `0 4 * * 0` | Limpa PM2 logs, npm cache, journalctl >7d, apt cache |
| `cookme-popular-receitas.py` | `0 3 * * *` | Popula banco com receitas TudoGostoso |

Logs em `/var/log/cookme-*.log`.

---

## 13. Deploy — Passo a Passo

### Backend

```bash
# Local
cd /home/eduardo/projetos/cookme/backend
npm run build
rsync -az --delete dist/ root@206.189.239.250:/var/www/cookme/backend/dist/

# No VPS
ssh root@206.189.239.250 "pm2 restart cookme-backend"
```

### Admin Frontend

```bash
# Local
cd /home/eduardo/projetos/cookme/frontend
npm run build
rsync -az --delete dist/ root@206.189.239.250:/var/www/cookme/frontend/dist/
# Nginx serve estático — não precisa restart
```

---

## 14. Recuperação do Zero

Ordem de execução para recriar o servidor:

```bash
# 1. Atualizar OS
apt-get update && apt-get upgrade -y

# 2. Instalar software base
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx postgresql postgresql-contrib certbot python3-certbot-nginx fail2ban ufw

# 3. PM2
npm install -g pm2

# 4. PostgreSQL — criar banco
sudo -u postgres psql << 'SQL'
CREATE USER cookme WITH PASSWORD 'cookme123';
CREATE DATABASE cookme_db OWNER cookme;
GRANT ALL PRIVILEGES ON DATABASE cookme_db TO cookme;
\c cookme_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
SQL

# 5. Usuário de sistema
useradd -r -s /usr/sbin/nologin -d /var/www/cookme cookme-app
mkdir -p /var/www/cookme

# 6. Restaurar backup do banco
PGPASSWORD=cookme123 gunzip -c /backups/cookme_LATEST.sql.gz | psql -h localhost -U cookme -d cookme_db

# 7. Clonar código
git clone git@github.com:ocdigital/cookme.git /var/www/cookme
# OU rsync do local:
rsync -az /home/eduardo/projetos/cookme/backend/dist/ root@IP:/var/www/cookme/backend/dist/
rsync -az /home/eduardo/projetos/cookme/frontend/dist/ root@IP:/var/www/cookme/frontend/dist/

# 8. .env
nano /var/www/cookme/backend/.env   # preencher com valores reais

# 9. Ownership
chown -R cookme-app:cookme-app /var/www/cookme

# 10. PM2
cd /var/www/cookme
pm2 start ecosystem.config.cjs
pm2 startup && pm2 save

# 11. UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000
ufw deny 5432
ufw enable

# 12. Fail2ban
# Copiar /etc/fail2ban/jail.local (seção 10 deste doc)
systemctl enable fail2ban && systemctl start fail2ban

# 13. Nginx
# Copiar config (seção 8 deste doc) para /etc/nginx/sites-available/cookme
ln -sf /etc/nginx/sites-available/cookme /etc/nginx/sites-enabled/cookme
nginx -t && systemctl reload nginx

# 14. SSL
certbot --nginx -d api.cookme.com.br
certbot --nginx -d admin.cookme.com.br

# 15. Scripts de ops
# Copiar cookme-*.sh para /usr/local/bin/ e chmod +x
# Adicionar crontab (seção 12 deste doc)

# 16. Cloudflare
# Ativar proxy (laranjinha) nos registros DNS de api e admin
```

---

## 15. Verificação Pós-Deploy

```bash
# API responde
curl -s https://api.cookme.com.br/api/health

# Admin carrega
curl -sI https://admin.cookme.com.br | head -3

# PM2 online
pm2 status

# Fail2ban ativo
fail2ban-client status

# PostgreSQL conecta
PGPASSWORD=cookme123 psql -h localhost -U cookme -d cookme_db -c "SELECT COUNT(*) FROM receitas;"

# Backup do dia existe
ls -lh /var/backups/cookme/ | head -3

# Cloudflare bloqueando acesso direto
curl -sI http://206.189.239.250 | head -3   # deve retornar vazio (444) ou connection refused
```

---

## 16. Monitoramento

| O que monitorar | Onde ver |
| --- | --- |
| Logs do backend | `pm2 logs cookme-backend --lines 100` |
| Healthcheck | `/var/log/cookme-health.log` |
| Backups | `/var/log/cookme-backup.log` |
| Fail2ban bans | `fail2ban-client status sshd` |
| Disco | `df -h /` |
| RAM | `free -h` |
| Nginx errors | `/var/log/nginx/error.log` |

---

*Manter este documento atualizado a cada mudança de infraestrutura.*
