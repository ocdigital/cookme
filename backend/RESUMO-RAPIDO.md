# CookMe Backend - Resumo Rápido

## O que é?
Motor de Otimização de Inventário (MOI) para gerenciar alimentos, reduzir desperdício e sugerir receitas baseadas no inventário do usuário.

## Stack
- NestJS 11 + TypeScript
- PostgreSQL 15 + TypeORM
- Redis 7
- JWT Auth
- Docker Compose
- Swagger

## Módulos (8 - Todos implementados)
1. **Auth** - Login, registro, JWT, refresh tokens
2. **Usuarios** - Perfil, preferências alimentares
3. **Produtos** - Catálogo, marcas, categorias, barcode
4. **Compras** - Registro de compras com itens
5. **Inventario** - Estoque, validades, alertas
6. **Receitas** - CRUD + Motor MOI (sugestões inteligentes)
7. **Barcode** - Scanner de produtos
8. **Scraper** - Scraping de cupons fiscais SAT-SP (integração mobile)

## Status Atual: ✅ 85% Completo
- ✅ 47 endpoints funcionando (8 módulos)
- ✅ 11 tabelas no banco
- ✅ Autenticação JWT completa
- ✅ Scraper de cupons fiscais (integração mobile + Python)
- ✅ Documentação Swagger
- ✅ Collection Postman
- ✅ Docker Compose configurado

## Falta Fazer (Prioridade):
1. ❌ Migrations e seeds do banco
2. ❌ Testes (unit + e2e)
3. ❌ Integração Open Food Facts API
4. ❌ Sistema de notificações
5. ❌ Upload de imagens
6. ❌ Deploy produção

## Como rodar:
```bash
docker-compose up -d
npm install
cp .env.example .env
npm run start:dev
```

## URLs:
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- pgAdmin: http://localhost:5050

## Arquivos importantes:
- `PROJETO-CONTEXT.md` - Documentação completa
- `CookMe-API.postman_collection.json` - Collection Postman
- `docker-compose.yml` - Setup Docker
- `.env.example` - Variáveis de ambiente
