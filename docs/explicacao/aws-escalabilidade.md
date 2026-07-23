# GUIA COMPLETO: COOKME NA AWS COM ESCALABILIDADE
## Do Deploy Básico ao Altamente Escalável

---

## 📑 ÍNDICE
1. [Conceitos Fundamentais](#conceitos-fundamentais)
2. [Arquitetura Current vs AWS](#arquitetura-current-vs-aws)
3. [Arquitetura Multi-Tier Escalável](#arquitetura-multi-tier-escalável)
4. [Componentes AWS Detalhados](#componentes-aws-detalhados)
5. [Implementação Passo a Passo](#implementação-passo-a-passo)
6. [Escalabilidade Horizontal](#escalabilidade-horizontal)
7. [Banco de Dados em Escala](#banco-de-dados-em-escala)
8. [Cache Layer Advanced](#cache-layer-advanced)
9. [CDN e Otimização](#cdn-e-otimização)
10. [Monitoramento e Alertas](#monitoramento-e-alertas)
11. [Segurança e Compliance](#segurança-e-compliance)
12. [Disaster Recovery](#disaster-recovery)
13. [Estimativas de Custo](#estimativas-de-custo)
14. [Troubleshooting](#troubleshooting)

---

## CONCEITOS FUNDAMENTAIS

### O que é Escalabilidade?

**Escalabilidade Vertical**: Aumentar poder do servidor (CPU, RAM)
- Limitado: Existe um máximo
- Simples de implementar
- Sem downtime (geralmente)

**Escalabilidade Horizontal**: Adicionar mais servidores
- Ilimitado: Adiciona quantos precisar
- Requer load balancer
- Melhor prática para aplicações cloud

### Padrões de Tráfego que CookMe Vai Enfrentar

```
Dia normal:       10 req/s
Horário de pico:  100 req/s
Black Friday:     1000+ req/s
```

**Meta**: Sistema suporta 10x pico máximo sem cair.

### Por que AWS?

✅ Escalabilidade automática
✅ Pagamento por uso (pay-as-you-go)
✅ Gerenciado (menos DevOps manual)
✅ Global (múltiplas regiões)
✅ Ferramentas integradas (logs, monitoring)
✅ Segurança enterprise

---

## ARQUITETURA CURRENT VS AWS

### CURRENT (Docker Compose Local)

```
┌─────────────────────────────────────────┐
│         1 Máquina Local                 │
├─────────────────────────────────────────┤
│  Backend (Node)  │  Frontend (React)    │
│      :3000       │      :5173           │
├─────────────────────────────────────────┤
│  PostgreSQL      │  Redis               │
│     :5432        │     :6379            │
└─────────────────────────────────────────┘

❌ Problemas:
- 1 máquina = 1 ponto de falha
- Sem escalabilidade
- Sem redundância
- Sem load balancing
- Backup manual
- Sem CDN
```

### AWS BÁSICO (Single Instance)

```
┌────────────────────────────────────────────────┐
│              AWS (1 Região)                    │
├────────────────────────────────────────────────┤
│  EC2 Instance (t3.medium)                      │
│  ├─ Backend (Node) :3000                       │
│  ├─ Frontend (React build)                     │
│  └─ Mobile (Expo)                              │
│                                                │
│  RDS PostgreSQL (db.t3.micro)                  │
│  ├─ Automated backups                          │
│  └─ Multi-AZ option                            │
│                                                │
│  ElastiCache Redis (cache.t3.micro)            │
│  └─ Automatic failover                         │
│                                                │
│  S3 (Estáticos, backups, uploads)              │
│                                                │
│  CloudFront (CDN)                              │
│  └─ Cache global                               │
└────────────────────────────────────────────────┘

✅ Melhor que local
❌ Ainda single point of failure
```

### AWS ESCALÁVEL (Recomendado)

```
┌──────────────────────────────────────────────────────────────┐
│                   AWS MULTI-AZ ESCALÁVEL                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────── REGIÃO us-east-1 ────────────────────┐              │
│  │                                              │              │
│  │  ┌─────────── ALB (Load Balancer) ──────┐  │              │
│  │  │  Distribui tráfego entre AZs         │  │              │
│  │  └──────────────────────────────────────┘  │              │
│  │           ↓            ↓             ↓      │              │
│  │  ┌─────────────────────────────────────┐  │              │
│  │  │  AZ-1      │  AZ-2      │  AZ-3    │  │              │
│  │  │            │            │          │  │              │
│  │  │ EC2:3000   │ EC2:3000   │ EC2:3000 │  │              │
│  │  │ (Backend)  │ (Backend)  │(Backend) │  │              │
│  │  │            │            │          │  │              │
│  │  └─────────────────────────────────────┘  │              │
│  │                                              │              │
│  │  ┌────────────────────────────────────┐    │              │
│  │  │  RDS PostgreSQL (Multi-AZ)        │    │              │
│  │  │  ├─ Primary (write)               │    │              │
│  │  │  ├─ Standby (failover)            │    │              │
│  │  │  ├─ Read Replicas (query)         │    │              │
│  │  │  └─ RDS Proxy (connection pool)   │    │              │
│  │  └────────────────────────────────────┘    │              │
│  │                                              │              │
│  │  ┌────────────────────────────────────┐    │              │
│  │  │  ElastiCache Redis Cluster        │    │              │
│  │  │  ├─ Primary node                  │    │              │
│  │  │  ├─ Replica node                  │    │              │
│  │  │  └─ Auto-failover                 │    │              │
│  │  └────────────────────────────────────┘    │              │
│  │                                              │              │
│  │  ┌────────────────────────────────────┐    │              │
│  │  │  S3 + CloudFront (CDN Global)     │    │              │
│  │  └────────────────────────────────────┘    │              │
│  │                                              │              │
│  │  ┌────────────────────────────────────┐    │              │
│  │  │  Auto Scaling Group               │    │              │
│  │  │  ├─ Min: 3 instâncias             │    │              │
│  │  │  ├─ Desejado: 5                   │    │              │
│  │  │  └─ Máximo: 20                    │    │              │
│  │  └────────────────────────────────────┘    │              │
│  │                                              │              │
│  │  ┌────────────────────────────────────┐    │              │
│  │  │  CloudWatch + SNS                 │    │              │
│  │  │  ├─ Monitora CPU, Memória, Disco  │    │              │
│  │  │  └─ Alertas automáticos           │    │              │
│  │  └────────────────────────────────────┘    │              │
│  │                                              │              │
│  └──────────────────────────────────────────┘  │              │
│                                                 │              │
│  Route 53 (DNS + Health Checks)                │              │
│  └─ Redireciona para ALB                       │              │
│                                                 │              │
│  CodePipeline + CodeDeploy (CI/CD)            │              │
│  └─ Deploy automático                          │              │
│                                                 │              │
└──────────────────────────────────────────────────────────────┘

✅ Alta disponibilidade
✅ Escalabilidade automática
✅ Redundância total
✅ Global performance
```

---

## ARQUITETURA MULTI-TIER ESCALÁVEL

### Camadas de Uma Aplicação Escalável

```
┌─────────────────────────────────────────┐
│  TIER 1: APRESENTAÇÃO (Frontend)       │
│  ┌─────────────────────────────────┐   │
│  │ CloudFront (CDN Global)         │   │
│  │ ├─ React estático (S3)          │   │
│  │ ├─ Cache em edge locations      │   │
│  │ └─ Gzip + Minificação           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  TIER 2: API GATEWAY & LOAD BALANCER   │
│  ┌─────────────────────────────────┐   │
│  │ Application Load Balancer (ALB) │   │
│  │ ├─ Route por hostname/path      │   │
│  │ ├─ Health checks                │   │
│  │ └─ Rate limiting                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  TIER 3: APLICAÇÃO (Backend)            │
│  ┌─────────────────────────────────┐   │
│  │ Auto Scaling Group (EC2)        │   │
│  │ ├─ Multiple instances           │   │
│  │ ├─ Container (Docker/ECS)       │   │
│  │ ├─ Health monitoring            │   │
│  │ └─ Auto-scale policies          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  TIER 4: CACHE LAYER                    │
│  ┌─────────────────────────────────┐   │
│  │ ElastiCache Redis (Multi-node)  │   │
│  │ ├─ Primary + Replicas           │   │
│  │ ├─ Auto-failover                │   │
│  │ └─ Replication across AZs       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  TIER 5: BANCO DE DADOS                 │
│  ┌─────────────────────────────────┐   │
│  │ RDS PostgreSQL Multi-AZ          │   │
│  │ ├─ Primary (AZ-A, write)        │   │
│  │ ├─ Standby (AZ-B, failover)     │   │
│  │ ├─ Read Replicas (AZ-C)         │   │
│  │ ├─ RDS Proxy (connection pool)  │   │
│  │ └─ Automated backups            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  TIER 6: STORAGE & BACKUPS              │
│  ┌─────────────────────────────────┐   │
│  │ S3 (Object Storage)             │   │
│  │ ├─ Assets (imagens)             │   │
│  │ ├─ Backups (RDS snapshots)      │   │
│  │ ├─ Logs (CloudWatch)            │   │
│  │ └─ Life cycle policies          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Fluxo de Requisição Escalado

```
1. USUÁRIO (Mobile/Web)
   ↓
2. Route 53 (DNS Resolution)
   └─ cookme.com → CloudFront edge location
   ↓
3. CloudFront (CDN)
   ├─ Usuário em Tokyo? → Serve do cache Asia
   ├─ Usuário em São Paulo? → Serve do cache SA
   ├─ Cache hit? → Retorna sem ir ao backend
   └─ Cache miss? → Forward para ALB
   ↓
4. Application Load Balancer (ALB)
   ├─ Analisa header "Authorization"
   ├─ /api/* → Backend servers
   ├─ Health check em /health → Apenas servidores saudáveis
   └─ Distribuir entre 3-20 EC2 instances (dependendo carga)
   ↓
5. EC2 Auto Scaling Group
   ├─ Request chega em um EC2 (e.g. t3.medium)
   ├─ NestJS rodando em container (Docker)
   ├─ Recebe requisição, processa
   └─ Se CPU > 70% por 2 min → scale up (+2 instâncias)
   ↓
6. RDS Proxy (Connection Pooling)
   ├─ Agrupa conexões
   ├─ Reduz carga no RDS
   └─ Pooling automático
   ↓
7. RDS PostgreSQL Multi-AZ
   ├─ Primary (AZ-A) = escrita
   ├─ Standby (AZ-B) = leitura + failover
   ├─ Read Replica (AZ-C) = consultas analíticas
   ├─ Responde: SELECT * FROM produtos
   └─ Replication lag: < 1ms (same region)
   ↓
8. Resultado volta para EC2
   ├─ Cache em Redis?
   └─ Se SIM → Próxima requisição igual é instant
   ↓
9. Response volta para ALB
   ├─ Comprime (gzip)
   ├─ Adiciona headers de cache
   └─ 200 OK
   ↓
10. CloudFront
    ├─ Cache a resposta por TTL configurado
    └─ Distribui global em próximas requisições
    ↓
11. Usuário recebe (< 200ms do Brasil)
```

---

## COMPONENTES AWS DETALHADOS

### 1. ROUTE 53 (DNS + Global Traffic)

**O que faz**: Gerencia domínios e roteia tráfego

**Configuração**:
```
cookme.com
├─ Alias Record A → CloudFront (*.cloudfront.net)
├─ Health Check (ALB)
└─ Failover routing (multi-region)
```

**Recursos**:
- Resolução DNS: 53ms (global)
- Health checks: Detecta falhas em segundos
- Geolocation routing: Usuário em BR? → Rota para us-east-1
- Failover: Região principal cai? → Redireciona para backup

### 2. CLOUDFRONT (CDN Global)

**O que faz**: Cache global + compressão + DDoS

**Distribuição**:
```
Edge Location 1: São Paulo (cache copy)
Edge Location 2: New York (cache copy)
Edge Location 3: Tokyo (cache copy)
Edge Location N: (200+ locais mundo)
           ↓
      Origin (S3 + ALB)
```

**Benefícios**:
- CDN de 200+ locais
- Cache por extensão (.js, .css, .woff = 1 ano)
- .html = 1 dia (sempre fresco)
- /api/* = TTL 0 (nunca cacheia)
- Gzip automático
- DDoS proteção inclusa

**Configuração para CookMe**:
```
Behaviors:
1. /api/* → ALB (TTL 0, sem cache)
2. /assets/* → S3 (TTL 1 year)
3. /*.js → S3 (TTL 1 year)
4. /*.css → S3 (TTL 1 year)
5. / → S3 (TTL 1 day)
```

### 3. APPLICATION LOAD BALANCER (ALB)

**O que faz**: Distribui tráfego entre N servidores

**Configuração**:
```
ALB Port 443 (HTTPS)
├─ Target Group 1 (Backend)
│  ├─ Porta 3000
│  ├─ Health check: GET /api/health
│  ├─ Healthy threshold: 2 checks
│  ├─ Unhealthy threshold: 3 checks
│  └─ Interval: 30 segundos
│
└─ Target Group 2 (Fallback)
   ├─ Health check falha?
   └─ Remove da rotação automaticamente
```

**Recursos**:
- Path-based routing: /api/* → Backend
- Hostname routing: api.cookme.com → Backend
- Port mapping: 443 → 3000
- Health checks: Automático detecta falhas
- Connection draining: Aguarda requisições terminarem
- Logs: Salva em S3

**Vantagens**:
- Layer 7 (Application): Entende HTTP
- Sticky sessions (opcional): Mesmo usuario → mesma instância
- WebSocket support: Para real-time
- Rate limiting: Proteção contra DDoS

### 4. EC2 AUTO SCALING GROUP

**O que faz**: Cria/deleta instâncias automaticamente

**Configuração**:
```
Launch Template
├─ AMI: Amazon Linux 2 + Docker
├─ Instance Type: t3.medium
├─ Security Group: Backend (3000, SSH)
├─ IAM Role: Acesso ECR + S3 + CloudWatch
├─ User Data: Puxa imagem Docker
└─ Monitoring: DetailedMonitoring

Auto Scaling Group
├─ Min Capacity: 3 (sempre rodando)
├─ Desired Capacity: 5 (meta)
├─ Max Capacity: 20 (limite)
├─ Subnets: us-east-1a, us-east-1b, us-east-1c (Multi-AZ)
├─ Target Group: Backend TG
└─ Health Check Type: ELB
```

**Políticas de Scaling**:
```
Policy 1 - Scale UP (quando ocupado):
├─ Métrica: CPUUtilization > 70%
├─ Duration: 2 minutos consecutivos
├─ Action: +2 instâncias
└─ Cooldown: 5 minutos

Policy 2 - Scale DOWN (quando vazio):
├─ Métrica: CPUUtilization < 30%
├─ Duration: 5 minutos consecutivos
├─ Action: -1 instância
└─ Cooldown: 10 minutos

Policy 3 - Target Tracking (simplificado):
├─ Métrica: CPUUtilization = 60% (alvo)
└─ AWS ajusta automaticamente
```

**Processo de Scale Up**:
```
T0: 5 instâncias, CPU 75%
    ↓
T1: Trigger de scale (CPU > 70%)
    ↓
T2: Launching 2 novas instâncias
    ├─ EC2-1 (iniciando)
    └─ EC2-2 (iniciando)
    ↓
T3: Instâncias em running
    ├─ Health check em andamento (30s)
    └─ Ainda não no ALB
    ↓
T4: Health check OK
    ├─ Registrada no Target Group
    └─ Começa a receber tráfego
    ↓
T5: 7 instâncias ativas
    └─ CPU cai para 65%
```

### 5. RDS POSTGRESQL (Banco Escalado)

**Multi-AZ Setup**:
```
AZ-A (Availability Zone 1) - us-east-1a
├─ RDS Primary Instance
│  ├─ Multi-AZ: Standby automático em AZ-B
│  ├─ Instance: db.r6i.2xlarge
│  ├─ Storage: io1 (provisioned IOPS)
│  ├─ IOPS: 5000 (5k operações/segundo)
│  ├─ Automated backups: 35 dias
│  └─ Encryption at rest: KMS
│
└─ RDS Proxy (Connection Pool)
   ├─ Max pool size: 100
   ├─ Queue timeout: 30s
   └─ Max idle connections: 24 hours
```

**Read Replicas** (para distribuir leitura):
```
AZ-C (us-east-1c)
├─ Read Replica #1
│  ├─ Sincroniza de Primary (< 1ms)
│  ├─ Aceita leitura (não escrita)
│  └─ Auto-promote se Primary cai
│
└─ Read Replica #2 (opcional)
   └─ Redundância extra de leitura
```

**Failover Automático**:
```
Cenário: Primary em AZ-A falha
T0: Primary cai
   ↓
T1: Health check falha (30s)
   ↓
T2: AWS promove Standby (AZ-B) → novo Primary
   ↓
T3: Aplicações se reconectam (requery)
   ↓
T4: Downtime: ~30 segundos
```

**Optimization**:
- Índices em colunas frequentes
- Connection pooling (RDS Proxy)
- Read replicas para consultas pesadas
- Slow query logs habilitado

### 6. ELASTICACHE REDIS (Cache)

**Cluster Setup**:
```
Redis Cluster Mode Disabled (Simpler)
├─ Primary Node (cache.r6g.xlarge)
│  ├─ 1000 MB de RAM
│  └─ Max connections: 10k
│
├─ Replica Node (failover)
│  ├─ Sincroniza em tempo real
│  └─ Read-only
│
└─ Automatic Failover
   ├─ Detecção: < 1 segundo
   └─ Promoção: < 30 segundos
```

**Padrões de Cache em CookMe**:
```
# 1. Session Cache
redis.set('session:user:123', JSON.stringify(user), 'EX', 86400)
// TTL: 24 horas

# 2. Product List Cache
redis.set('products:all:page:1', JSON.stringify(products), 'EX', 3600)
// TTL: 1 hora (atualiza quando novo produto criado)

# 3. Recipe Suggestions
redis.set('recipes:user:123', JSON.stringify(recipes), 'EX', 1800)
// TTL: 30 minutos

# 4. API Response Cache
redis.set('api:response:xyz123', JSON.stringify(response), 'EX', 300)
// TTL: 5 minutos
```

**Hit Rate Target**: 80% (4 de 5 requisições vêm do cache)

### 7. S3 + CLOUDFRONT

**Estrutura S3**:
```
cookme-assets-bucket (private)
├─ /frontend/
│  ├─ index.html
│  ├─ bundle.js (versionado: bundle.a1b2c3.js)
│  ├─ styles.css
│  └─ favicon.ico
│
├─ /images/
│  ├─ recipes/
│  └─ products/
│
├─ /backups/
│  ├─ rds-snapshot-2026-01-28.sql
│  └─ daily/ (lifecycle: delete after 30 days)
│
└─ /logs/
   ├─ cloudfront/
   ├─ alb/
   └─ application/ (lifecycle: archive to Glacier after 90 days)
```

**CloudFront Origin Access Control**:
```
┌─────────────┐
│ CloudFront  │ (pode ler S3)
├─────────────┤
│   OAC       │ (origin access control)
│   Token     │
└─────────────┘
        ↓
┌─────────────┐
│    S3       │ (S3 Bucket Policy)
│   (privado) │ (apenas via OAC)
└─────────────┘
```

**Cache Invalidation**:
```
Deploy novo bundle.js:
1. Upload versão nova: bundle.a1b2c3.js
2. Update index.html (muda referência)
3. Invalidate /index.html em CloudFront (purga cache)
4. Usuários recebem novo index.html
5. index.html referencia novo bundle.a1b2c3.js
6. Browser cacheia novo bundle (1 ano)
```

### 8. ECR (Elastic Container Registry)

**Repositório Docker**:
```
123456789.dkr.ecr.us-east-1.amazonaws.com/cookme-backend:latest
├─ Image: NestJS + Node
├─ Base: node:20-alpine (pequeno)
├─ Size: 200MB (comprimido)
├─ Scan: Vulnerabilidades automáticas
└─ Lifecycle: Manter últimas 10 imagens
```

**Pipeline Build**:
```
GitHub Push
  ↓
CodePipeline (trigger)
  ↓
CodeBuild
├─ npm install
├─ npm run build
├─ npm run test
├─ docker build
├─ docker push → ECR
└─ image:tag publicado
  ↓
CodeDeploy
├─ Pull image de ECR
├─ Stop container antigo
├─ Start container novo
└─ Health check
```

### 9. ECS (Elastic Container Service)

**EC2 Launch Type** (mais controle, menos custo):
```
EC2 Instance (t3.large)
├─ ECS Agent rodando
├─ Task Definition
│  ├─ Image: cookme-backend:latest
│  ├─ Port: 3000
│  ├─ CPU: 512 units
│  ├─ Memory: 1GB
│  ├─ Env vars (de Secrets Manager)
│  └─ Log driver: CloudWatch
│
└─ Task (Container)
   ├─ Rodando: NestJS
   └─ Recebendo tráfego
```

**vs Fargate** (serverless, sem gerenciar EC2):
```
Fargate Launch Type
├─ Serverless container
├─ Pagamento por CPU/RAM consumido
├─ Sem gerenciar EC2
├─ Mais caro (30% premium)
└─ Melhor para workloads variable
```

---

## IMPLEMENTAÇÃO PASSO A PASSO

### FASE 1: PREPARAÇÃO (Semana 1)

#### 1.1 Conta AWS & Configuração

**Criar Conta AWS**:
- Acesse: aws.amazon.com
- Registre-se (necessário cartão de crédito)
- Ative MFA (autenticação 2 fatores)
- Crie IAM user (nunca use root)

**IAM Policy** (permissions mínimas para deploy):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "elasticache:*",
        "s3:*",
        "cloudfront:*",
        "ecr:*",
        "ecs:*",
        "cloudwatch:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**AWS CLI Setup**:
```bash
# Instalar
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Configurar credenciais
aws configure
# Access Key: xxxxx
# Secret Key: xxxxx
# Region: us-east-1
# Format: json

# Testar
aws ec2 describe-instances
```

#### 1.2 Preparar Aplicação

**Criar Dockerfiles** (se não existir):

Backend Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

Frontend Dockerfile:
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Remover secrets do .env**:
```bash
# Arquivo .env.example (commitar no Git)
DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=
REDIS_HOST=
REDIS_PORT=6379
CLAUDE_API_KEY=
GEMINI_API_KEY=
```

**Criar arquivo production.env**:
```bash
# Não commitar! (add .gitignore)
DB_HOST=cookme-db.xxxxx.rds.amazonaws.com
DB_USERNAME=postgres
DB_PASSWORD=<gerar senha forte>
JWT_SECRET=<gerar chave aleatória>
REDIS_HOST=cookme-redis.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
CLAUDE_API_KEY=<do Secrets Manager>
GEMINI_API_KEY=<do Secrets Manager>
```

**VPC & Security Groups**:
```bash
# Criar VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Subnets (para Multi-AZ)
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b

aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1c

# Security Group (Backend)
aws ec2 create-security-group \
  --group-name cookme-backend \
  --description "Backend security group" \
  --vpc-id vpc-xxx

# Regras de ingresso
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 3000 \
  --source-security-group-id sg-alb

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 # SSH (restringir para seu IP)

# Security Group (Database)
aws ec2 create-security-group \
  --group-name cookme-database \
  --description "RDS security group"
  --vpc-id vpc-xxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-database \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id sg-backend
```

### FASE 2: INFRAESTRUTURA BASE (Semana 2-3)

#### 2.1 RDS PostgreSQL Multi-AZ

**Criar Instância RDS**:
```bash
aws rds create-db-instance \
  --db-instance-identifier cookme-db \
  --db-instance-class db.r6i.xlarge \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "$(openssl rand -base64 32)" \
  --allocated-storage 100 \
  --storage-type io1 \
  --iops 5000 \
  --db-subnet-group-name cookme-db-subnet \
  --vpc-security-group-ids sg-database \
  --multi-az \
  --backup-retention-period 35 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-cloudwatch-logs-exports postgresql \
  --storage-encrypted \
  --deletion-protection \
  --publicly-accessible false
```

**Criar RDS Proxy** (connection pooling):
```bash
aws rds create-db-proxy \
  --db-proxy-name cookme-proxy \
  --engine-family POSTGRESQL \
  --db-proxy-role-arn arn:aws:iam::xxxxx:role/rds-proxy-role \
  --auth-schemes '{"SECRETS": {"SecretArn": "arn:aws:secretsmanager:..."}' \
  --db-engine postgresql \
  --max-idle-connections-percent 100
```

**Teste de Conexão**:
```bash
# Obter endpoint
aws rds describe-db-instances \
  --db-instance-identifier cookme-db \
  --query 'DBInstances[0].Endpoint.Address'
# Output: cookme-db.xxxxx.us-east-1.rds.amazonaws.com

# Conectar localmente
psql -h cookme-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres

# Executar migrations
npm run migration:run -- --dataSource src/config/database.config.ts

# Seed data
npm run seed
```

#### 2.2 ElastiCache Redis

**Criar Cluster Redis Multi-AZ**:
```bash
aws elasticache create-replication-group \
  --replication-group-description "CookMe Redis Cluster" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.r6g.xlarge \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --multi-az \
  --cache-parameter-group-name default.redis7 \
  --cache-subnet-group-name cookme-redis-subnet \
  --security-group-ids sg-redis \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token "$(openssl rand -base64 32)" \
  --replication-group-id cookme-redis
```

**Teste de Conexão**:
```bash
# Obter endpoint
aws elasticache describe-replication-groups \
  --replication-group-id cookme-redis

# Testar com Redis CLI
redis-cli -h cookme-redis.xxxxx.cache.amazonaws.com \
          -p 6379 \
          -a your-auth-token \
          ping
```

#### 2.3 ECR (Container Registry)

**Criar repositório ECR**:
```bash
# Backend
aws ecr create-repository \
  --repository-name cookme-backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=KMS

# Frontend
aws ecr create-repository \
  --repository-name cookme-frontend
```

**Build & Push da Imagem**:
```bash
# Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Build da imagem
cd backend
docker build -t cookme-backend:v1.0.0 .

# Tag para ECR
docker tag cookme-backend:v1.0.0 \
  123456789.dkr.ecr.us-east-1.amazonaws.com/cookme-backend:v1.0.0

# Push
docker push \
  123456789.dkr.ecr.us-east-1.amazonaws.com/cookme-backend:v1.0.0
```

#### 2.4 S3 para Assets

**Criar Buckets**:
```bash
# Assets bucket (público via CloudFront)
aws s3 mb s3://cookme-assets-prod

# Bucket policy (CloudFront only)
aws s3api put-bucket-policy \
  --bucket cookme-assets-prod \
  --policy file://bucket-policy.json
```

**Configurar Lifecycle**:
```bash
# Logs para Glacier após 90 dias
aws s3api put-bucket-lifecycle-configuration \
  --bucket cookme-assets-prod \
  --lifecycle-configuration file://lifecycle.json
```

### FASE 3: LOAD BALANCER & AUTO SCALING (Semana 3-4)

#### 3.1 Application Load Balancer

**Criar ALB**:
```bash
aws elbv2 create-load-balancer \
  --name cookme-alb \
  --subnets subnet-1a subnet-1b subnet-1c \
  --security-groups sg-alb \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

**Criar Target Group**:
```bash
aws elbv2 create-target-group \
  --name cookme-backend \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200
```

**Criar HTTPS Listener** (com ACM certificate):
```bash
# Criar certificate no ACM
aws acm request-certificate \
  --domain-name cookme.com \
  --domain-name "*.cookme.com" \
  --validation-method DNS

# Aplicar listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS-1-2-2017-01 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 3.2 Auto Scaling Group

**Criar Launch Template**:
```bash
aws ec2 create-launch-template \
  --launch-template-name cookme-backend-template \
  --version-description "Backend container" \
  --launch-template-data '{
    "ImageId": "ami-0c55b159cbfafe1f0",
    "InstanceType": "t3.medium",
    "KeyName": "my-key-pair",
    "SecurityGroupIds": ["sg-backend"],
    "IamInstanceProfile": {
      "Arn": "arn:aws:iam::xxxxx:instance-profile/ecsInstanceRole"
    },
    "UserData": "IyEvYmluL2Jhc2gKYXdzIGVjciBnZXQtbG9naW4tcGFzc3dvcmQgLS1yZWdpb24gdXMtZWFzdC0xIHwgZG9ja2VyIGxvZ2luIC0tdXNlcm5hbWUgQVdTIC0tcGFzc3dvcmQtc3RkaW4gMTIzNDU2Nzg5LmRrci5lY3IudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20Kc3VkbyB5dW0gdXBkYXRlIC15CnN1ZG8geXVtIGluc3RhbGwgLXkgZG9ja2VyIGVjcy1pbml0CgplY3MtYWdlbnQgc3RhcnQK",
    "TagSpecifications": [{
      "ResourceType": "instance",
      "Tags": [{"Key": "Name", "Value": "cookme-backend"}]
    }]
  }'
```

**Criar Auto Scaling Group**:
```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name cookme-asg \
  --launch-template LaunchTemplateName=cookme-backend-template,Version=\$Latest \
  --min-size 3 \
  --max-size 20 \
  --desired-capacity 5 \
  --default-cooldown 300 \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --vpc-zone-identifier "subnet-1a,subnet-1b,subnet-1c" \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

**Criar Scaling Policies**:
```bash
# Scale Up
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name cookme-asg \
  --policy-name scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 600
  }'

# Scale Down (mais conservador)
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name cookme-asg \
  --policy-name scale-down \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 30.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 900
  }'
```

### FASE 4: CLOUDFRONT & DOMÍNIO (Semana 4)

#### 4.1 CloudFront Distribution

**Criar Distribuição**:
```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json**:
```json
{
  "CallerReference": "cookme-2026-01-28",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "S3Assets",
        "DomainName": "cookme-assets-prod.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      },
      {
        "Id": "ALBBackend",
        "DomainName": "cookme-alb-123456.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Assets",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    }
  },
  "CacheBehaviors": [
    {
      "PathPattern": "/api/*",
      "TargetOriginId": "ALBBackend",
      "ViewerProtocolPolicy": "https-only",
      "CachePolicyId": "4135ea3d-c35d-46eb-81d7-reeSJlXJd_J",
      "OriginRequestPolicyId": "216adef5-5c7f-47e4-b989-5492eafa07d3"
    }
  ],
  "Enabled": true,
  "Comment": "CookMe CDN"
}
```

#### 4.2 Route 53 DNS

**Criar Hosted Zone**:
```bash
aws route53 create-hosted-zone \
  --name cookme.com \
  --caller-reference $(date +%s)
```

**Criar Alias Record**:
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "cookme.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d123.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## ESCALABILIDADE HORIZONTAL

### Como Funciona o Auto Scaling

**Métrica: CPU > 70%**

```
T0: 5 instâncias, CPU 75%
    ↓
T0:30: Primeiro health check falha (CPU > 70%)
    ↓
T2:00: Segundo health check falha (mantém CPU > 70%)
    ↓
T5:00: Cooldown termina, trigger SCALE UP
    ├─ Launch 2 novas instâncias
    └─ Action: +2
    ↓
T5:30: Instâncias em "pending"
    ├─ EC2-6: iniciando Docker
    └─ EC2-7: iniciando Docker
    ↓
T6:00: Instâncias em "running"
    ├─ Health check: GET /api/health
    └─ Aguardando resposta
    ↓
T6:30: Health check OK
    ├─ EC2-6 registrado no ALB
    └─ EC2-7 registrado no ALB
    ↓
T7:00: 7 instâncias ativas
    └─ CPU cai para 65%
```

**Timing Importante**:
- Health check interval: 30s
- Needed checks: 2 consecutivos
- Cooldown: 300s (5 min)
- **Total para scale**: ~5-6 minutos

### Estratégias de Escalabilidade

#### 1. Stateless Design (Essencial)

**❌ ERRADO** (com estado):
```javascript
let cache = {};
app.post('/compras', (req, res) => {
  cache[req.user.id] = req.body; // Problema!
  // Se requisição próxima vai para EC2 diferente,
  // dados se perdem
});
```

**✅ CORRETO** (sem estado):
```javascript
app.post('/compras', async (req, res) => {
  await db.compras.create(req.body); // Persistido
  res.json({success: true});
});
// Qualquer EC2 pode processar
```

#### 2. Database Connection Pooling

**Problema**: Muitos EC2 = muitas conexões ao DB

```
5 instâncias × 50 conexões = 250 conexões total
10 instâncias × 50 conexões = 500 conexões
20 instâncias × 50 conexões = 1000 conexões ❌

PostgreSQL padrão: max 100 conexões
```

**Solução: RDS Proxy**

```
┌─────────────────────────────┐
│ 20 EC2 Instâncias           │
│ ├─ 50 conexões cada         │
│ └─ 1000 conexões            │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│ RDS Proxy (connection pool) │
│ ├─ Agrupa conexões          │
│ ├─ 100 para DB              │
│ └─ Multiplexing             │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│ RDS PostgreSQL              │
│ ├─ Max 100 conexões         │
│ └─ Sem sobrecarga           │
└─────────────────────────────┘
```

#### 3. Cache Strategy

**Sem Cache** (10k requisições):
```
10,000 req/s → 10,000 queries
Latência: 100ms cada
Total: 1000s = 16+ minutos! ❌
```

**Com Cache** (80% hit rate):
```
10,000 req/s
├─ 8,000 cache hits (< 1ms)
└─ 2,000 queries (100ms)

Latência média: (8000 × 0.001) + (2000 × 0.1) = 208ms ✅
```

#### 4. Read Replicas para Analytics

**Sem Replicas** (mistura read + write):
```
Primary DB:
├─ 70% write (compras, receitas)
├─ 30% read (listagens)
└─ Coordenação complexa
```

**Com Read Replicas**:
```
Primary DB:
├─ 100% write (compras, receitas)
└─ Latência: < 1ms

Read Replica-1:
├─ 100% read (listagens produtos)
└─ Latência: < 1ms

Read Replica-2:
├─ Analytics (relatórios pesados)
└─ Sem impactar transações
```

**Routing em NestJS**:
```typescript
// Escrita (Primary)
async createCompra(data) {
  return await this.primaryDb.compras.save(data);
}

// Leitura (Replica)
async getCompras() {
  return await this.replicaDb.compras.find();
}

// Analytics (Replica pesada)
async getMonthlyStats() {
  return await this.analyticsDb.query(`
    SELECT DATE(created_at), COUNT(*)
    FROM compras
    GROUP BY DATE(created_at)
  `);
}
```

#### 5. API Rate Limiting

**Proteger contra abuso**:
```bash
# Instalar em NestJS
npm install @nestjs/throttler

# Configurar
@ThrottleModule.register([
  {
    ttl: 60, // segundos
    limit: 100 // requests por minute
  }
])

# Resultado
Usuário faz 101 requisições em 60s
└─ 101ª requisição: 429 Too Many Requests
```

### Métricas de Escalabilidade

**Monitorar no CloudWatch**:

```
1. CPU Utilization
   ├─ Alvo: 60-70%
   ├─ < 30%: scale down
   └─ > 75%: scale up

2. Memory Utilization
   ├─ Alvo: 70-80%
   ├─ Indicador de shortage
   └─ Se > 90%: aumentar tamanho instância

3. Request Count
   ├─ requests/segundo
   ├─ Peak vs off-peak ratio
   └─ Projetar picos futuros

4. Response Time (Latency)
   ├─ P50: mediana
   ├─ P95: 95º percentil
   ├─ P99: 99º percentil (SLA)
   └─ Alvo: < 200ms P99

5. Error Rate
   ├─ 5xx errors: problemas backend
   ├─ 4xx errors: problemas cliente
   └─ Alvo: < 0.1%

6. Database Connections
   ├─ Active connections
   ├─ Idle connections
   └─ Connection wait time

7. Cache Hit Rate
   ├─ Alvo: > 80%
   ├─ Se < 70%: aumentar TTL
   └─ Se > 95%: verificar staleness
```

---

## BANCO DE DADOS EM ESCALA

### RDS Scaling Strategies

#### Vertical Scaling (Upgrade)

```
db.t3.micro   (0.5 GB RAM) → 10 req/s
db.t3.small   (2 GB RAM)   → 50 req/s
db.t3.medium  (4 GB RAM)   → 100 req/s
db.r6i.large  (16 GB RAM)  → 500 req/s
db.r6i.xlarge (32 GB RAM)  → 1000 req/s
db.r6i.4xlarge (128 GB RAM) → 5000 req/s
```

**Processo** (com downtime mínimo):
```
T0: Primary = db.r6i.2xlarge (32 GB)
T1: AWS cria snapshot
T2: Restaura snapshot com novo tipo
T3: Promove novo como Primary (replication lag < 1min)
T4: Downtime: ~2 minutos
T5: Primary = db.r6i.4xlarge (128 GB) ✅
```

#### Horizontal Scaling (Read Replicas)

**Caso: Read-heavy (listagens, relatórios)**

```
Arquitetura:
├─ Primary (r6i.2xlarge)
│  ├─ Write pool: 5000 ops/s
│  └─ Local: 500 ops/s read
│
├─ Read Replica-1 (r6i.xlarge)
│  ├─ Read pool: 1000 ops/s
│  └─ Lag: < 1ms
│
├─ Read Replica-2 (r6i.xlarge)
│  ├─ Read pool: 1000 ops/s
│  └─ Lag: < 1ms
│
└─ Analytics Replica (r6i.large)
   ├─ Heavy queries: 500 ops/s
   └─ Lag: < 10ms (aceitável)
```

**Configurar em NestJS**:
```typescript
// database.config.ts
export const createDataSourceOptions = (): DataSourceOptions => {
  const primary = new DataSource({
    host: 'cookme-db-primary.xxxx.rds.amazonaws.com',
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'cookme_db',
  });

  const replica = new DataSource({
    host: 'cookme-db-replica.xxxx.rds.amazonaws.com',
    replication: {
      master: {...primary},
      slaves: [
        {host: 'replica-1.xxxx.rds.amazonaws.com'},
        {host: 'replica-2.xxxx.rds.amazonaws.com'},
      ]
    }
  });
};

// produtos.service.ts
async getProducts(page: number) {
  // Usa replica automaticamente
  return await this.dataSource
    .createQueryBuilder()
    .select('produto')
    .from(Produto, 'produto')
    .skip((page - 1) * 20)
    .take(20)
    .getMany();
}
```

#### Partitioning (Sharding)

**Quando usar**: > 100M registros em tabela

```
Tabela: compras (1B registros)
├─ Partition 1: user_id 1-1M
├─ Partition 2: user_id 1M-2M
└─ Partition N: user_id N M-(N+1)M

Benefício:
├─ Queries mais rápidas (menos rows scan)
├─ Índices menores (mais em RAM)
└─ Backup mais rápido
```

**Implementar em PostgreSQL**:
```sql
-- Range partitioning
CREATE TABLE compras (
  id UUID PRIMARY KEY,
  user_id INTEGER,
  created_at TIMESTAMP,
  valor DECIMAL
) PARTITION BY RANGE (user_id);

CREATE TABLE compras_1 PARTITION OF compras
  FOR VALUES FROM (1) TO (1000000);

CREATE TABLE compras_2 PARTITION OF compras
  FOR VALUES FROM (1000000) TO (2000000);
```

### Backup & Recovery

#### Automated Backups

```
RDS Backup Strategy:
├─ Tipo: Automated (daily)
├─ Retenção: 35 dias
├─ Horário: 03:00 UTC
├─ Stored: S3 (geo-replicated)
└─ RPO (Recovery Point Objective): 24 horas
```

**Restore Procedure**:
```bash
# Listar backups
aws rds describe-db-snapshots \
  --db-instance-identifier cookme-db

# Restaurar para novo DB (não afeta atual)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier cookme-db-restored \
  --db-snapshot-identifier cookme-db-snapshot

# Validar dados
psql -h cookme-db-restored.xxx.rds.amazonaws.com \
     -U postgres -c "SELECT COUNT(*) FROM compras"

# Promover novo como primary (if needed)
```

#### Point-in-Time Recovery

```
Acidente: Alguém deletou todos os usuários T10:30
Recuperação:
├─ Identificar when: T10:30
├─ Restore até T10:29
├─ RTO (Recovery Time Objective): 15 minutos
└─ RPO: 1 minuto (transaction logs)
```

**Implementar**:
```bash
# Restore a specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier cookme-db \
  --target-db-instance-identifier cookme-db-restored \
  --restore-time 2026-01-28T10:29:00Z
```

---

## CACHE LAYER ADVANCED

### Estratégias de Invalidação

#### 1. TTL (Time-To-Live)

**Simples, mas pode ficar stale**:
```typescript
async getProducts(page: number) {
  const cacheKey = `products:page:${page}`;

  // Tentar cache
  let products = await redis.get(cacheKey);
  if (products) return JSON.parse(products);

  // DB query
  products = await this.db.getProducts(page);

  // Cache por 1 hora
  await redis.set(cacheKey, JSON.stringify(products), 'EX', 3600);

  return products;
}
```

#### 2. Event-Based Invalidation

**Invalida quando dado muda**:
```typescript
async createProduct(data: CreateProductDTO) {
  // Salvar no DB
  const product = await this.db.create(data);

  // Invalidar cache
  await redis.del('products:page:1');
  await redis.del('products:page:2');
  await redis.del('products:all');

  // Publish evento (para outros serviços)
  await this.eventBus.publish('product.created', product);

  return product;
}

@EventListener('product.created')
async onProductCreated(product: Produto) {
  // Outros serviços podem reagir
  await this.notificationsService.notifyAdmins();
}
```

#### 3. Cache Aside Pattern

```
request
  ↓
Check Redis
├─ HIT: return data
└─ MISS:
    ├─ Query DB
    ├─ Update Redis
    └─ Return data

Vantagem: Simples, lazy loading
Desvantagem: Primeiro acesso é slow
```

#### 4. Write-Through Pattern

```
Write Request
  ├─ Update Redis
  └─ Update DB (depois)
     ├─ Se DB falha: Redis tem dados
     └─ Eventual consistency

Vantagem: Dados sempre frescos
Desvantagem: Mais operações
```

#### 5. Write-Behind Pattern

```
Write Request
  ├─ Update Redis
  ├─ Async: Update DB (queue)
  └─ Return OK

Vantagem: Muito rápido, escalável
Desvantagem: Data loss se Redis cai
Uso: Não-crítico (ex: page views)
```

### Redis Cluster Mode

**Quando usar**: > 100 mil operações/segundo

```
Cluster Mode Disabled (Simpler):
├─ Primary: 16 GB RAM
├─ Replica: 16 GB RAM (failover)
└─ Throughput: 50,000 ops/s

Cluster Mode Enabled (Distribuído):
├─ Node-1: 8 GB, Shard-1
├─ Node-2: 8 GB, Shard-2
├─ Node-3: 8 GB, Shard-3
├─ Replicas: Cada shard tem réplica
└─ Throughput: 150,000+ ops/s
```

**Dados distribuídos por hash**:
```
redis.set('user:123:cart', data)
  hash = crc16(key) % 16384
  └─ Vai para shard responsável pelo hash range
```

---

## CDN E OTIMIZAÇÃO

### CloudFront Caching Strategy

**Cache Headers**:
```
Response Headers
├─ Cache-Control: max-age=3600
│  └─ Browser cacheia por 1 hora
│
├─ ETag: "abc123"
│  └─ Revalidação sem re-download
│
└─ CloudFront-Cache-Status: Hit
   ├─ Hit: Servido do edge cache
   ├─ Miss: Buscado do origin
   └─ RefreshHit: Revalidação OK
```

**Configurar por tipo**:
```
/api/*
├─ Cache-Control: no-cache, no-store
├─ TTL: 0 (nunca cacheia)
└─ Revalidar sempre

/static/*
├─ Cache-Control: public, max-age=31536000
├─ TTL: 1 ano
└─ Hash no filename (bundle.a1b2c3.js)

/index.html
├─ Cache-Control: public, max-age=86400
├─ TTL: 1 dia
└─ Sempre revalidar no origin
```

### Asset Optimization

#### Code Splitting

```
# Sem splitting
bundle.js: 5 MB
└─ Usuário baixa tudo

# Com splitting
├─ vendor.js: 2 MB (libraries, never changes)
├─ main.js: 2 MB (app code)
├─ recipe-detail.js: 1 MB (lazy loaded)
└─ Total: 5 MB, mas paralelo

// React Router lazy load
const RecipeDetail = React.lazy(() => import('./RecipeDetail'));

<Suspense fallback={<Loading />}>
  <RecipeDetail />
</Suspense>
```

#### Compression

```
Vite build otimizado:
├─ main.js: 500 KB → 150 KB (gzip)
├─ styles.css: 200 KB → 50 KB (gzip)
└─ Total: 200 KB (vs 700 KB)

Economia: 71% redução!

CloudFront + Browser:
├─ Edge comprime (gzip)
├─ Browser descomprime
└─ Speed: ~3x mais rápido
```

#### Image Optimization

```
Original recipes/pasta.jpg: 2 MB
  ↓
Optimize:
├─ WebP format: 400 KB
├─ Resize para device:
│  ├─ Mobile (500px): 150 KB
│  ├─ Tablet (800px): 250 KB
│  └─ Desktop (1200px): 350 KB
├─ Lazy load (não na viewport)
└─ Serve via CloudFront + CDN edge

Resultado: 90% redução, lazy load, global fast
```

---

## MONITORAMENTO E ALERTAS

### CloudWatch Metrics

```
Standard Metrics (cada 5 min):
├─ EC2
│  ├─ CPUUtilization
│  ├─ NetworkIn/Out
│  └─ DiskReadOps/WriteOps
│
├─ RDS
│  ├─ DatabaseConnections
│  ├─ CPUUtilization
│  ├─ ReadLatency / WriteLatency
│  ├─ DiskQueueDepth
│  └─ ReplicaLag
│
├─ ElastiCache
│  ├─ CacheHits / Misses
│  ├─ Evictions
│  └─ ReplicationLag
│
└─ ALB
   ├─ TargetResponseTime
   ├─ HTTPCode_Target_5XX_Count
   └─ HealthyHostCount / UnHealthyHostCount
```

### Custom Metrics (Application)

```javascript
// Backend (NestJS)
const http_requests = new prometheus.Histogram({
  name: 'http_requests_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

// Cada requisição
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    http_requests
      .labels(req.method, req.route.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Enviar para CloudWatch
setInterval(async () => {
  const metrics = await prometheus.register.metrics();
  await cloudwatch.putMetricData({
    MetricData: [...],
    Namespace: 'CookMe/Backend'
  });
}, 60000); // A cada minuto
```

### Alertas (SNS)

```bash
# Criar SNS Topic
aws sns create-topic --name cookme-alerts

# Subscribe via email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:xxxxx:cookme-alerts \
  --protocol email \
  --notification-endpoint admin@cookme.com
```

**Alertas Importante**:

```
1. CPU > 85% (potencial shortage)
   └─ Action: Manual review ou auto-scale

2. Database Connections > 90%
   └─ Action: Scale up DB ou adicionar RDS Proxy

3. Cache Hit Rate < 70%
   └─ Action: Aumentar TTL ou ajustar strategy

4. Error Rate > 1%
   └─ Action: Investigar logs

5. Response Time P99 > 500ms
   └─ Action: Check DB, cache, network

6. RDS Replica Lag > 1 second
   └─ Action: Investigate replication, may indicate network issues

7. Auto Scaling Group scaling events
   └─ Action: Review scaling policies
```

---

## SEGURANÇA E COMPLIANCE

### Network Security

#### VPC Isolation

```
┌─────────────────────────────────────────┐
│ VPC: 10.0.0.0/16                       │
├─────────────────────────────────────────┤
│                                         │
│  Public Subnets (Route via IGW):       │
│  ├─ ALB (Internet accessible)          │
│  └─ NAT Gateway (outbound)             │
│                                         │
│  Private Subnets (No internet):        │
│  ├─ EC2 Backend (via NAT only)        │
│  ├─ RDS Database                       │
│  └─ ElastiCache                        │
│                                         │
│  Network ACLs (layer 3-4 filtering)    │
│  Security Groups (layer 3-4 stateful)  │
│                                         │
└─────────────────────────────────────────┘
```

#### Security Groups Rules

```
ALB Security Group:
├─ Ingress
│  ├─ 443 (HTTPS) from 0.0.0.0/0
│  └─ 80 (HTTP) from 0.0.0.0/0
│
└─ Egress
   └─ All traffic to VPC

Backend Security Group:
├─ Ingress
│  ├─ 3000 from ALB security group
│  └─ 22 (SSH) from admin IP only
│
└─ Egress
   ├─ 443 to 0.0.0.0/0 (HTTPS outbound)
   ├─ 5432 to RDS security group
   └─ 6379 to ElastiCache security group

RDS Security Group:
├─ Ingress
│  └─ 5432 from Backend security group
│
└─ Egress
   └─ None (database doesn't initiate)

ElastiCache Security Group:
├─ Ingress
│  └─ 6379 from Backend security group
│
└─ Egress
   └─ None
```

### Secrets Management

**AWS Secrets Manager** (para senhas/keys):

```bash
# Criar secret
aws secretsmanager create-secret \
  --name cookme/prod/db-password \
  --secret-string "$(openssl rand -base64 32)"

# Usar em Backend
import * as AWS from 'aws-sdk';
const secretsManager = new AWS.SecretsManager();

const getDbPassword = async () => {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'cookme/prod/db-password'
  }).promise();
  return secret.SecretString;
};

// Aplicação recupera automatically
const dbPassword = await getDbPassword();
```

**Rotation Policy**:
```
Rotar senha a cada 30 dias:
├─ Criar nova senha
├─ Validar acesso com nova
├─ Atualizar em todas aplicações (zero downtime)
└─ Arquivar senha antiga
```

### Encryption

#### At-Rest (dados armazenados)

```
RDS:
├─ Habilitado: encryption = true
├─ KMS Key: AWS managed (default)
└─ Performance: Sem overhead (~5%)

S3:
├─ Default: Server-side encryption (SSE-S3)
├─ Upgrade: SSE-KMS (mais controle)
└─ Bucket policy: Rejeitar uploads sem encryption

ElastiCache:
├─ Encryption: enabled = true
└─ Performance: Mínimo overhead
```

#### In-Transit (dados em trânsito)

```
CloudFront → ALB:
├─ HTTPS (TLS 1.2+)
├─ Certificate: ACM (auto-renewed)
└─ Cipher: Modern (no old stuff)

ALB → Backend:
├─ HTTP (dentro VPC privada, ok)
└─ Ou HTTPS (paranoid, small overhead)

Backend → RDS:
├─ Encrypted connection
├─ Default em AWS
└─ Verify: require_ssl = on

Backend → Redis:
├─ TLS encryption (if not local)
└─ Auth token required
```

### Compliance

#### LGPD (Lei Geral de Proteção de Dados - Brasil)

```
Aplicável se trata dados de brasileiros

1. Consentimento
   ├─ Users consentem tratamento
   └─ CookMe pede permission antes

2. Direito de Acesso
   ├─ User pode pedir seus dados
   ├─ Backend endpoint: GET /api/usuarios/me/download
   └─ Retorna JSON com todos dados

3. Direito de Deleção
   ├─ User pode pedir deletion
   ├─ Backend endpoint: DELETE /api/usuarios/me
   └─ Deletar: user, compras, receitas, tudo

4. Direito de Portabilidade
   ├─ User pode exportar dados em formato comum
   └─ CSV ou JSON

5. Auditoria
   ├─ Log de acessos (quem, quando, o quê)
   ├─ CloudTrail para ações AWS
   └─ Application logs em CloudWatch

6. Data Residency
   ├─ Dados brasileiros devem estar no Brasil
   ├─ Usar região: sa-east-1 (São Paulo)
   └─ Não permitir replicação automática

7. Privacy
   ├─ Hashing de senhas (bcrypt)
   ├─ Não armazenar credit cards
   └─ Use payment gateway (Stripe, etc)
```

---

## DISASTER RECOVERY

### RTO & RPO

```
RTO (Recovery Time Objective): Tempo máximo aceitável de downtime
RPO (Recovery Point Objective): Quanto perda de dados é aceitável

CookMe Target:
├─ RTO: 1 hora (pode ficar fora por 1h max)
└─ RPO: 15 minutos (aceita perder até 15min de dados)
```

### DR Strategies

#### 1. Backup Only

```
RPO: 24 horas (último backup)
RTO: 2 horas (restaurar é lento)

Custo: ~$100/mês
Uso: Startups, projeto inicial
```

```
Diário:
T0: Backup automático de RDS
T1: Snapshot enviado para S3
T2: Armazenado por 35 dias

Caso falha:
T0: Descobrir problema
T1: Logar no AWS Console
T2-T3: Restaurar snapshot
T4: Update Route 53 (2 hours total)
```

#### 2. Hot Standby (Warm)

```
RPO: < 1 minuto (replication)
RTO: 15 minutos (failover + reconfig)

Custo: ~$500/mês (duplicar infra)
Uso: Médias empresas
```

```
Production (us-east-1):
├─ RDS Primary
├─ ElastiCache Primary
├─ EC2 Auto Scaling Group (5 instâncias)
└─ Ativo, recebendo tráfego

Standby (us-west-2):
├─ RDS Standby (replicado, ≤1min lag)
├─ ElastiCache Standby
├─ EC2 Auto Scaling Group (1 instância, idle)
└─ Inativo, apenas replica dados

Failover:
T0: us-east-1 cai
T1: CloudWatch detecta (2 min)
T2: Route 53 redireciona para us-west-2 (instant)
T3: Scale up Standby ASG (2 min)
T4: Aplicação em us-west-2 (5 min total)
```

#### 3. Multi-Region Active-Active

```
RPO: < 1 segundo (simultâneo)
RTO: 0 minutos (sem failover!)

Custo: ~$1000+/mês
Uso: Enterprise, crítico
```

```
┌─────────────────────────────────────────────┐
│ Global Architecture                         │
├─────────────────────────────────────────────┤
│                                             │
│ Route 53 Geolocation:                       │
│ ├─ Usuário em São Paulo → us-east-1        │
│ ├─ Usuário em New York → us-east-1         │
│ ├─ Usuário em Tokyo → ap-northeast-1       │
│ └─ Usuário em London → eu-west-1           │
│                                             │
│ us-east-1 (N. Virginia):                    │
│ ├─ RDS Primary (Escrita)                   │
│ ├─ DynamoDB Global Table copy               │
│ └─ EC2 ASG (10 instâncias)                  │
│                                             │
│ ap-northeast-1 (Tokyo):                     │
│ ├─ RDS Read Replica + Writable              │
│ ├─ DynamoDB Global Table copy               │
│ └─ EC2 ASG (5 instâncias)                   │
│                                             │
│ eu-west-1 (Ireland):                        │
│ ├─ RDS Read Replica + Writable              │
│ ├─ DynamoDB Global Table copy               │
│ └─ EC2 ASG (5 instâncias)                   │
│                                             │
│ Data Consistency:                           │
│ ├─ DynamoDB Global Table: <1s replication   │
│ ├─ RDS replication: <1s (same region)       │
│ └─ Cross-region: <100ms                     │
│                                             │
└─────────────────────────────────────────────┘

Falha em us-east-1:
└─ Usuário não vê nada! (Traffic automático)
```

### Backup Strategy

```
Daily:
├─ RDS Automated Snapshot
├─ S3 Versioning (última 30 versões)
└─ CloudTrail logs (audit trail)

Weekly:
├─ RDS Manual Snapshot (copy to another region)
├─ Database integrity check
└─ Test restore (critical!)

Monthly:
├─ Full database export to S3
├─ Encrypt and archive to Glacier
└─ DR drill (restore em region diferente)
```

---

## ESTIMATIVAS DE CUSTO

### Pequena Escala (100 usuários ativos)

```
Componente          | Instance         | Custo/mês
────────────────────┼──────────────────┼──────────
EC2 (backend)       | t3.small (2)     | $20
RDS PostgreSQL      | db.t3.micro      | $25
ElastiCache Redis   | cache.t3.micro   | $15
ALB                 | -                | $16
CloudFront          | 1 GB/dia         | $5
S3                  | 10 GB            | $1
Secrets Manager     | -                | $1
Data Transfer       | 1 GB/dia         | $5
────────────────────┴──────────────────┴──────────
TOTAL                                   | $88/mês
```

### Média Escala (10k usuários ativos)

```
Componente          | Instance         | Custo/mês
────────────────────┼──────────────────┼──────────
EC2 (backend)       | t3.medium (10)   | $200
RDS PostgreSQL      | db.r6i.large     | $150
RDS Proxy           | -                | $20
Read Replica        | db.r6i.large     | $150
ElastiCache Redis   | cache.r6g.xlarge | $100
ALB                 | -                | $16
CloudFront          | 100 GB/dia       | $50
S3                  | 100 GB           | $2
Secrets Manager     | -                | $1
Data Transfer       | 100 GB/dia       | $50
CloudWatch          | Custom metrics   | $20
────────────────────┴──────────────────┴──────────
TOTAL                                   | $759/mês
```

### Grande Escala (1M usuários ativos)

```
Componente          | Instance         | Custo/mês
────────────────────┼──────────────────┼──────────
EC2 (backend)       | t3.xlarge (50)   | $2000
RDS PostgreSQL      | db.r6i.4xlarge   | $600
RDS Proxy           | -                | $30
Read Replicas (3)   | db.r6i.2xlarge   | $450
ElastiCache Redis   | cluster (6 nodes)| $600
ALB                 | -                | $16
CloudFront          | 10 TB/dia        | $500
S3                  | 1 TB             | $20
DynamoDB (backup)   | On-demand        | $100
Lambda (automation) | -                | $50
Secrets Manager     | -                | $1
Data Transfer       | 10 TB/dia        | $5000
CloudWatch          | Custom metrics   | $100
Code Pipeline       | -                | $1
Multi-region backup | -                | $200
────────────────────┴──────────────────┴──────────
TOTAL                                   | $9,668/mês
```

### Otimizar Custos

```
1. Reserved Instances
   ├─ 1-year: 30% desconto
   ├─ 3-year: 50% desconto
   └─ Para workloads previsível

2. Spot Instances
   ├─ 70% desconto vs on-demand
   ├─ Mas pode ser interrompido
   └─ Usar para batch jobs, não produção

3. Rightsizing
   ├─ Não usar t3.xlarge se cabe t3.large
   ├─ Monitor CloudWatch
   └─ Ajustar mensal

4. Data Transfer
   ├─ VPC Endpoint (S3, DynamoDB)
   ├─ Não transferir entre regiões
   └─ Use CloudFront CDN

5. Auto Scaling
   ├─ Scale down durante noite
   ├─ Weekends = menos instâncias
   └─ Economizar 30%

6. Database Optimization
   ├─ Índices corretos = menos CPU
   ├─ RDS read replicas vs more expensive instance
   └─ Connection pooling (RDS Proxy)

7. Logging Strategy
   ├─ CloudWatch: Expensive per GB
   ├─ Archive to S3 após 7 dias
   ├─ Use Athena para queries
   └─ Delete logs após 30 dias
```

---

## TROUBLESHOOTING

### Health Check Falha

**Sintoma**: Instâncias removidas do ALB

```
Cause 1: Application não respondendo
├─ Check: EC2 logs
├─ Check: Application health endpoint
│  └─ curl http://localhost:3000/api/health
├─ Check: Database conectado
│  └─ psql via RDS endpoint
└─ Fix: Restart aplicação ou debugar

Cause 2: Security Group bloqueado
├─ Check: ALB pode acessar port 3000?
├─ Check: Security group rules
│  └─ sg-backend permite 3000 de sg-alb
└─ Fix: Add ingress rule

Cause 3: Health check timeout
├─ Check: Latência RDS query
├─ Check: CPU no EC2
│  └─ ps aux | grep node
├─ Check: Network latency (tc qdisc)
└─ Fix: Otimizar query ou scale up

Health Check Endpoint:
@Get('/health')
async health() {
  try {
    // Verificar DB
    await this.db.query('SELECT 1');
    // Verificar Redis
    await this.redis.ping();
    return { status: 'healthy' };
  } catch (e) {
    throw new Error('Unhealthy');
  }
}
```

### Database Connection Limit

**Sintoma**: "Too many connections" error

```
Problema: EC2 × conexões por instance = total

Exemplo:
10 EC2 instances × 50 connections = 500 total
RDS max connections = 100 ❌

Solução 1: RDS Proxy (connection pooling)
├─ EC2 → RDS Proxy (pode reuse)
├─ RDS Proxy → RDS (pooled)
└─ Resultado: 100 conexões no RDS, 500 lógicas

Solução 2: Reduzir conexões por instance
// NestJS
TypeOrmModule.forRoot({
  ...options,
  extra: {
    max: 10, // Foi 50
    min: 2,
    idle: 3000,
  }
})

Solução 3: Scale up RDS
├─ max_connections = 500 (default ~100)
└─ Mais RAM necessária
```

### High Latency

**Sintoma**: Response time > 500ms

```
Investigate ordem:
1. CloudWatch metrics
   ├─ ALB response time (Time taken)
   ├─ EC2 CPU / Memory
   └─ RDS latency

2. Se RDS lento:
   ├─ Check: Slow query log
   │  └─ queries > 1 segundo
   ├─ Check: CPU/IOPS
   ├─ Add índices
   └─ Scale read replicas

3. Se EC2 lento:
   ├─ Check: Node.js heap
   │  └─ node --max-old-space-size=2048 dist/main.js
   ├─ Check: Garbage collection pauses
   └─ Scale up instância

4. Se Network lento:
   ├─ Check: VPC Flow Logs
   ├─ Check: Replication lag
   └─ Check: Regional latency (Route 53)

5. Use CloudFront para caching
   ├─ Cache responses (80% hit rate)
   └─ Reduz latência em 90%
```

### Auto Scaling Not Working

**Sintoma**: CPU > 70% mas não scale up

```
Debug:
1. ASG policy ativada?
   aws autoscaling describe-auto-scaling-groups \
     --auto-scaling-group-name cookme-asg

2. Métricas no CloudWatch?
   aws cloudwatch describe-alarms

3. Cooldown ativo?
   ├─ Última scale ação há quanto tempo?
   ├─ Cooldown de 300s = espera 5 min
   └─ Se muito recente, aguarde

4. Min/Max atingido?
   ├─ desired: 5, max: 5? (não pode mais)
   └─ Check: AWS limits (vCPU limits)

5. Health check falha?
   ├─ Se instâncias marked unhealthy
   ├─ Removem mas não replcam (recovery)
   └─ Fix: Fix health check

Resultado esperado:
T0: CPU 75%
T1: Aguarda 2 checks positivos (1 min)
T2: Trigger (CPU > 70%)
T3: Aguarda cooldown
T4: +2 instâncias launched
T5-6: Instâncias em running, health check
T7: Adicionadas ao ALB
T8: Tráfego distribuído, CPU cai
```

---

## CHECKLIST PRÉ-PRODUÇÃO

```
□ Segurança
  □ Remover secrets do código
  □ Usar Secrets Manager
  □ HTTPS em CloudFront
  □ Security groups corretos
  □ VPC privada para DB/Cache
  □ IAM roles mínimas
  □ Encryption at-rest e in-transit

□ Performance
  □ CloudFront cache habilitado
  □ RDS Proxy connection pooling
  □ Redis cache strategy
  □ Database indices otimizados
  □ Code splitting + lazy loading
  □ Image optimization
  □ Gzip compression

□ Reliability
  □ Multi-AZ RDS
  □ Multi-AZ ElastiCache
  □ Auto Scaling Group (min 3 instâncias)
  □ Health checks configurados
  □ Backup strategy (daily snapshots)
  □ Point-in-time recovery enabled

□ Monitoring
  □ CloudWatch metrics habilitadas
  □ Custom metrics para app
  □ SNS alertas configurados
  □ Logs em CloudWatch
  □ CloudTrail para auditoria
  □ Dashboard criado

□ Testing
  □ Load testing (simule picos)
  □ Failover testing
  □ Backup restore testing
  □ Security scanning
  □ Penetration testing (se crítico)

□ Cost
  □ Calculated AWS bill
  □ Reserved instances (se 1+ ano)
  □ Cost anomaly detection
  □ Budget alerts

□ Compliance
  □ LGPD endpoints (get/delete/export)
  □ Privacy policy atualizada
  □ Terms of service
  □ Data residency (sa-east-1 para Brasil)

□ Documentation
  □ Runbook de operações
  □ Troubleshooting guide
  □ Escalation contacts
  □ Architecture diagram
  □ Disaster recovery procedures
```

---

## RECURSOS ADICIONAIS

### AWS Official
- AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/
- AWS Scalability: https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html
- RDS Best Practices: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/

### Tools
- AWS CloudFormation (Infrastructure as Code)
- Terraform (Multi-cloud IaC)
- AWS SAM (Serverless Application Model)
- Docker + ECS (Container Orchestration)

### Monitoring
- Prometheus (custom metrics)
- Grafana (visualization)
- Datadog (enterprise monitoring)
- New Relic (APM)

### Performance
- Apache JMeter (load testing)
- Locust (Python load testing)
- Gremlin (chaos engineering)

---

**Última atualização**: 2026-01-28
**Versão**: 1.0
**Autor**: Claude Code
**Status**: Production Ready

Para dúvidas: Consulte AWS Documentation ou contate seu AWS Solution Architect.
