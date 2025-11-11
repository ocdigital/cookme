# CookMe Backend - Checklist de Tarefas

## 🔴 Prioridade ALTA (Crítico para MVP)

### Database & Setup
- [ ] Criar e rodar migrations do TypeORM
- [ ] Criar seed de categorias padrão (Grãos, Laticínios, Carnes, Vegetais, etc.)
- [ ] Criar seed de marcas populares (Tio João, Nestlé, Sadia, etc.)
- [ ] Criar seed de produtos básicos (Arroz, Feijão, Leite, etc.)
- [ ] Criar seed de receitas populares (Arroz com Feijão, Omelete, etc.)
- [ ] Configurar arquivo `.env` (copiar de .env.example e ajustar secrets)

### Testes
- [ ] Configurar ambiente de testes (banco separado)
- [ ] Testes unitários: AuthService
- [ ] Testes unitários: UsuariosService
- [ ] Testes unitários: ProdutosService
- [ ] Testes unitários: ComprasService
- [ ] Testes unitários: InventarioService
- [ ] Testes unitários: ReceitasService (Motor MOI)
- [ ] Testes unitários: BarcodeService
- [ ] Testes E2E: Auth endpoints
- [ ] Testes E2E: Fluxo completo (Register → Login → Criar Produto → Criar Compra → Ver Inventário → Sugestões)
- [ ] Coverage mínimo de 70%

### Segurança
- [ ] Trocar JWT_SECRET em produção
- [ ] Trocar JWT_REFRESH_SECRET em produção
- [ ] Implementar rate limiting (ThrottlerModule)
- [ ] Configurar Helmet.js para headers de segurança
- [ ] Revisar CORS para domínio específico do frontend
- [ ] Sanitização de inputs (já tem class-validator, mas revisar)

### Scraper de Cupons Fiscais (Finalizar)
- [x] Criar módulo ScraperModule no backend
- [x] Criar DTOs e interfaces
- [x] Criar ScraperService (gerenciamento de sessões)
- [x] Criar ScraperController (5 endpoints)
- [x] Documentação de integração mobile (MOBILE_INTEGRATION.md)
- [ ] ⚠️ Modificar script Python para modo API
  - [ ] Adicionar argparse para --mode, --session-id, --qrcode
  - [ ] Implementar enviar_mensagem_json() e aguardar_continuar()
  - [ ] Modificar método consultar() para modo API
  - [ ] Modificar função main() para dois modos
  - [ ] Ver `lib/MIGRATION_API_MODE.md` para detalhes completos
- [ ] Testar integração NestJS ↔ Python localmente
- [ ] Atualizar Postman Collection com endpoints do Scraper
- [ ] Testar fluxo completo com mobile (mock)
- [ ] Adicionar testes unitários: ScraperService
- [ ] Adicionar testes E2E: Scraper endpoints

---

## 🟡 Prioridade MÉDIA (Importante para Produção)

### Integrações Externas
- [ ] Integrar BarcodeService com Open Food Facts API
- [ ] Implementar cache Redis para consultas externas
- [ ] Fallback para busca local se API externa falhar
- [ ] Tratamento de erros de APIs externas

### Notificações
- [ ] Criar módulo de Notificações
- [ ] Scheduler (cron) para verificar produtos vencendo
- [ ] Envio de email (Nodemailer ou SendGrid)
- [ ] Sistema de templates de email
- [ ] Push notifications (opcional, se houver app mobile)
- [ ] Preferências de notificação por usuário

### Upload e Imagens
- [ ] Criar módulo de Upload
- [ ] Upload de foto de produtos (local ou S3)
- [ ] Upload de foto de receitas
- [ ] Upload de nota fiscal (para OCR futuro)
- [ ] Validação de tipo e tamanho de arquivo
- [ ] Redimensionamento de imagens (Sharp)
- [ ] Configurar AWS S3 (ou local storage)

### Melhorias no Motor MOI
- [ ] Considerar histórico de receitas executadas
- [ ] Ponderar score por frequência de execução
- [ ] Sistema de "aprendizado" de preferências
- [ ] Sugestão de lista de compras baseada em receitas favoritas
- [ ] Análise de sazonalidade de produtos

### Analytics
- [ ] Dashboard de estatísticas do usuário
- [ ] Cálculo de desperdício evitado (kg/mês)
- [ ] Cálculo de economia gerada (R$/mês)
- [ ] Gráficos de consumo por categoria
- [ ] Relatório de produtos mais comprados

### Melhorias no Scraper (Escalabilidade)
- [ ] Implementar WebSocket para substituir polling
- [ ] Adicionar fila (Bull + Redis) para processar consultas
- [ ] Suporte para NFC-e (Nota Fiscal Eletrônica)
- [ ] Suporte para cupons de outros estados
- [ ] CAPTCHA automático via serviços de terceiros (2Captcha, Anti-Captcha)
- [ ] Métricas e monitoramento de consultas
- [ ] Rate limiting por usuário
- [ ] Persistência de sessões no Redis (ao invés de memória)

---

## 🟢 Prioridade BAIXA (Features Futuras)

### Social e Compartilhamento
- [ ] Sistema de receitas compartilhadas
- [ ] Feed de receitas da comunidade
- [ ] Likes e favoritos em receitas
- [ ] Comentários em receitas
- [ ] Compartilhar receita via link público

### Gamificação
- [ ] Sistema de pontos por ações (cadastrar compra, executar receita, etc.)
- [ ] Badges e conquistas
- [ ] Ranking de usuários
- [ ] Desafios semanais/mensais
- [ ] Streak de dias sem desperdício

### Internacionalização
- [ ] Configurar i18n (nestjs-i18n)
- [ ] Traduzir mensagens de erro (pt-BR, en-US)
- [ ] Traduzir categorias e tags
- [ ] Conversão de unidades (métrico ↔ imperial)

### Performance
- [ ] Implementar cache Redis para receitas
- [ ] Implementar cache Redis para produtos
- [ ] Paginação em listagens (produtos, receitas, compras)
- [ ] Lazy loading de relações (otimizar queries)
- [ ] Índices no banco de dados (revisar quais faltam)
- [ ] Compressão de responses (gzip)

### OCR e IA
- [ ] OCR de notas fiscais (Tesseract.js ou Google Vision)
- [ ] Extração automática de produtos de nota fiscal
- [ ] Integração com microserviço Python (ML)
- [ ] Previsão de consumo baseada em histórico
- [ ] Sugestão de quantidade ideal de compra

---

## 🚀 Deploy e DevOps

### CI/CD
- [ ] Configurar GitHub Actions (ou GitLab CI)
- [ ] Pipeline de build e testes
- [ ] Deploy automático em staging
- [ ] Deploy manual em produção (com aprovação)
- [ ] Rollback automático se health check falhar

### Infraestrutura
- [ ] Escolher provedor cloud (AWS, GCP, Azure, Heroku)
- [ ] Configurar instância de produção
- [ ] Configurar banco de dados gerenciado (RDS, Cloud SQL)
- [ ] Configurar Redis gerenciado (ElastiCache, Cloud Memorystore)
- [ ] Configurar CDN para imagens (CloudFront, Cloud CDN)
- [ ] Configurar domínio e SSL/TLS

### Monitoramento
- [ ] Configurar Sentry para error tracking
- [ ] Configurar logs centralizados (CloudWatch, Stackdriver)
- [ ] Configurar APM (Datadog, New Relic)
- [ ] Health check endpoint (`/api/health`)
- [ ] Métricas de performance (response time, throughput)
- [ ] Alertas para erros críticos

### Banco de Dados
- [ ] Backup automático diário
- [ ] Estratégia de restore testada
- [ ] Réplicas read-only (se necessário)
- [ ] Migrations automáticas no deploy (com rollback)
- [ ] Índices otimizados

---

## 📚 Documentação

- [x] Documentação Swagger completa
- [x] Collection Postman com todos os endpoints
- [x] README com instruções de setup
- [x] Contexto completo do projeto (PROJETO-CONTEXT.md)
- [ ] Documentação de arquitetura (diagramas)
- [ ] Guia de contribuição
- [ ] Changelog (versões e updates)
- [ ] API versioning strategy

---

## 🎯 Roadmap de Releases

### v1.0 - MVP (2-3 semanas)
- [x] Backend completo com 8 módulos
- [ ] Finalizar Scraper Python modo API
- [ ] Migrations e seeds
- [ ] Testes (70% coverage)
- [ ] Deploy em produção

### v1.1 - Integrações (1-2 semanas)
- [ ] Open Food Facts API
- [ ] Sistema de notificações
- [ ] Upload de imagens
- [ ] WebSocket para Scraper (substituir polling)

### v1.2 - Analytics (1 semana)
- [ ] Dashboard de estatísticas
- [ ] Relatórios de desperdício e economia

### v2.0 - Social (2-3 semanas)
- [ ] Compartilhamento de receitas
- [ ] Gamificação
- [ ] Feed da comunidade

### v3.0 - IA (3-4 semanas)
- [ ] OCR de notas fiscais
- [ ] Machine Learning para preferências
- [ ] Previsão de consumo

---

## 📊 Progresso Geral

- ✅ Backend Core: **94%** (7.5/8 módulos - Scraper Python pendente)
- ⏳ Scraper: **85%** (Backend pronto, Python modo API pendente)
- ⏳ Testes: **0%** (0/12 suites incluindo Scraper)
- ⏳ Deploy: **0%** (0/5 tasks)
- ⏳ Features Extras: **0%** (0/20 features)

**Total:** ~45% do projeto completo (considerando MVP + produção-ready)
