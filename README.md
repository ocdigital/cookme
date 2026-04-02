# CookMe - Motor de Otimização de Inventário

Sistema completo para gerenciamento inteligente de inventário alimentar, com sugestões de receitas baseadas em produtos disponíveis e próximos ao vencimento.

## 📋 Índice

- [🚀 Início Rápido](#-início-rápido)
- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Usar](#como-usar)
- [Funcionalidades](#funcionalidades)
- [Contribuindo](#contribuindo)

## 🚀 Início Rápido

### Opção 1: Automática (Recomendado)

```bash
# Inicia tudo automaticamente (Docker + Backend + Frontend + Mobile)
./startup.sh

# Ver status dos serviços
./startup.sh --status

# Parar tudo quando terminar
./startup.sh --stop
```

**Documentação completa:** [STARTUP_SCRIPT.md](STARTUP_SCRIPT.md)

### Opção 2: Manual Rápido

```bash
# Terminal 1: Docker
docker-compose up -d

# Terminal 2: Backend (NestJS)
cd backend && npm install && npm run start:dev

# Terminal 3: Frontend (Vite React)
cd frontend && npm install && npm run dev

# Terminal 4: Mobile (Expo React Native)
cd mobile && npm install && npx expo start
```

### Acessar Serviços

| Serviço | URL |
|---------|-----|
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |
| Frontend | http://localhost:5173 |
| Mobile | Expo Go (QR code) |

---

## 🎯 Visão Geral

CookMe é uma plataforma completa que ajuda você a:
- ✅ Gerenciar seu inventário de alimentos
- ✅ Cadastrar compras automaticamente via cupom fiscal SAT
- ✅ Receber alertas de produtos próximos ao vencimento
- ✅ Obter sugestões inteligentes de receitas baseadas no que você tem em casa
- ✅ Reduzir desperdício de alimentos
- ✅ Economizar dinheiro

## 📁 Estrutura do Projeto

```
cookme/
├── backend/              # API REST em NestJS + PostgreSQL
│   ├── src/             # Código fonte da API
│   ├── dist/            # Build de produção
│   └── README.md        # Documentação do backend
│
├── lib/                 # Scraper de Cupons Fiscais (Python)
│   ├── captcha_manual.py    # Script principal de scraping
│   ├── requirements.txt     # Dependências Python
│   ├── config.json          # Configurações (credenciais API)
│   └── README.md            # Documentação do scraper
│
├── landingpage/         # Landing Page do produto
│   └── README.md        # Documentação da landing page
│
└── README.md           # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem principal
- **PostgreSQL** - Banco de dados
- **TypeORM** - ORM para banco de dados
- **JWT** - Autenticação
- **Swagger** - Documentação da API

### Scraper de Cupons Fiscais
- **Python 3.12+** - Linguagem
- **Selenium** - Automação web
- **Requests** - Cliente HTTP
- **WebDriver Manager** - Gerenciamento de drivers

### Frontend (Landing Page)
- HTML/CSS/JavaScript
- PHP (CRUD)

## 📦 Pré-requisitos

### Para o Backend
- Node.js 18+ e npm
- PostgreSQL 14+
- Docker (opcional)

### Para o Scraper
- Python 3.12+
- Google Chrome (para Selenium)
- ChromeDriver (gerenciado automaticamente)

## 🚀 Instalação e Configuração

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Iniciar banco de dados (se usar Docker)
docker-compose up -d

# Executar migrations
npm run migration:run

# Iniciar em modo desenvolvimento
npm run start:dev
```

A API estará disponível em `http://localhost:3000/api`
Documentação Swagger: `http://localhost:3000/api/docs`

### 2. Scraper de Cupons Fiscais

```bash
cd lib

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar credenciais da API
cp config.example.json config.json
# Edite config.json com suas credenciais
```

## 💻 Como Usar

### Cadastrar uma Compra via Cupom Fiscal SAT

1. Tenha o QR Code do cupom fiscal em mãos
2. Inicie o backend
3. Execute o scraper:

```bash
cd lib
source venv/bin/activate
python captcha_manual.py
```

4. Cole o texto do QR Code quando solicitado
5. Resolva o reCAPTCHA manualmente
6. Aguarde a extração e salvamento automático na API

### Acessar a API

#### Registrar/Login
```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "senha": "suaSenha123",
    "nome": "Seu Nome"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "senha": "suaSenha123"
  }'
```

#### Ver Inventário
```bash
curl http://localhost:3000/api/inventario \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### Obter Sugestões de Receitas (MOI)
```bash
curl http://localhost:3000/api/receitas/sugestoes \
  -H "Authorization: Bearer SEU_TOKEN"
```

## ✨ Funcionalidades

### Backend (API)

#### Autenticação
- ✅ Registro de usuários
- ✅ Login com JWT
- ✅ Refresh token
- ✅ Proteção de rotas

#### Produtos
- ✅ CRUD completo de produtos
- ✅ Busca por código de barras
- ✅ Categorias e marcas
- ✅ Informações nutricionais

#### Compras
- ✅ Registro de compras
- ✅ Importação via cupom fiscal SAT
- ✅ Histórico de compras
- ✅ Estatísticas de gastos

#### Inventário
- ✅ Gerenciamento de estoque
- ✅ Alertas de validade
- ✅ Listagem de produtos vencidos
- ✅ Localização de produtos (geladeira, despensa, etc)

#### Receitas
- ✅ CRUD de receitas
- ✅ Ingredientes e modo de preparo
- ✅ **MOI (Motor de Otimização de Inventário)**
  - Sugestões inteligentes baseadas no inventário
  - Priorização de produtos próximos ao vencimento
  - Match de ingredientes disponíveis

### Scraper de Cupons Fiscais

- ✅ Leitura de QR Code SAT-SP
- ✅ Scraping automatizado do site da Fazenda
- ✅ Extração de todos os produtos do cupom
- ✅ Integração automática com a API
- ✅ Criação de produtos inexistentes
- ✅ Registro completo da compra
- ✅ Backup em JSON local

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Autenticação via JWT
- Tokens de refresh para segurança adicional
- Proteção contra SQL Injection (TypeORM)
- Validação de dados com class-validator

## 📊 Banco de Dados

O projeto utiliza PostgreSQL com TypeORM e as seguintes tabelas principais:
- `usuarios` - Dados dos usuários
- `preferencias` - Preferências alimentares dos usuários
- `produtos` - Catálogo de produtos
- `compras` e `compras_itens` - Histórico de compras
- `inventario` - Estoque atual
- `receitas`, `receitas_ingredientes`, `receitas_executadas` - Sistema de receitas
- `marcas` e `categorias` - Organização de produtos

Entities disponíveis em: `backend/src/modules/*/entities/*.entity.ts`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Eduardo**
- Email: eduardo@ocdigital.com.br

## 🗺️ Roadmap

- [ ] App mobile (React Native)
- [ ] Reconhecimento de produtos por foto
- [ ] Integração com mais tipos de cupons fiscais
- [ ] Sistema de lista de compras inteligente
- [ ] Integração com supermercados (preços)
- [ ] Compartilhamento de receitas entre usuários
- [ ] Sistema de gamificação (redução de desperdício)

---

**Desenvolvido com ❤️ para ajudar a reduzir o desperdício de alimentos**
