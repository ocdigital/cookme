# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planejado
- App mobile (React Native)
- Suporte para cupons NFC-e
- OCR para reconhecimento de produtos por foto
- Sistema de gamificação
- Integração com supermercados para preços
- WebSockets para notificações real-time

## [1.0.0] - 2025-11-07

### Adicionado
- **Backend API completo em NestJS**
  - Módulo de autenticação (JWT)
  - CRUD de produtos
  - CRUD de compras
  - Gestão de inventário
  - CRUD de receitas
  - Motor MOI (Otimização de Inventário)
  - Documentação Swagger/OpenAPI
  - Integração com PostgreSQL via Prisma

- **Scraper de Cupons Fiscais SAT-SP**
  - Leitura de QR Code SAT
  - Automação com Selenium
  - Extração de produtos do cupom
  - Integração automática com API
  - Criação automática de produtos inexistentes
  - Registro de compras completas
  - Backup JSON local

- **Documentação Completa**
  - README.md principal
  - README.md do scraper
  - Guia de arquitetura (ARCHITECTURE.md)
  - Guia de contribuição (CONTRIBUTING.md)
  - Changelog

- **Configuração e Setup**
  - .gitignore completo
  - Script de setup automatizado
  - Arquivo de exemplo de configuração
  - Requirements.txt para Python
  - Docker Compose para banco de dados

### Funcionalidades

#### API Backend
- Autenticação e autorização com JWT
- Gestão completa de produtos
  - Busca por código de barras
  - Categorias e marcas
  - Informações nutricionais
- Registro de compras
  - Manual
  - Via cupom SAT
  - Via OCR
- Gestão de inventário
  - Controle de estoque
  - Alertas de validade
  - Localização de produtos
- Sistema de receitas
  - CRUD completo
  - Ingredientes e modo de preparo
  - Sugestões inteligentes (MOI)
  - Priorização por validade
  - Match de ingredientes disponíveis

#### Scraper Python
- Extração automática de cupons SAT-SP
- Integração perfeita com API
- Tratamento robusto de erros
- Backup automático de dados
- Suporte para reCAPTCHA manual

### Segurança
- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Refresh tokens para segurança adicional
- Proteção contra SQL Injection
- Validação de dados com class-validator
- CORS configurado

### Performance
- Connection pooling para banco de dados
- Índices otimizados
- Queries otimizadas com Prisma
- Paginação em listagens

## [0.2.0] - 2025-11-02

### Adicionado
- Primeira versão funcional do scraper
- Parser de cupons SAT básico
- Salvamento em JSON local

### Corrigido
- Problemas de parsing de valores decimais
- Timeout no reCAPTCHA

## [0.1.0] - 2025-10-31

### Adicionado
- Estrutura inicial do projeto
- Setup do backend NestJS
- Configuração do Prisma
- Modelos básicos do banco de dados

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de vulnerabilidades

## Links

- [Unreleased]: Comparação entre última versão e HEAD
- [1.0.0]: Primeira versão estável
- [0.2.0]: Versão beta do scraper
- [0.1.0]: Versão inicial
