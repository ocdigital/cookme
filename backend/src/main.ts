import './instrument';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuditInterceptor } from './modules/audit-log/interceptors/audit.interceptor';
import { AuditLogService } from './modules/audit-log/audit-log.service';
import { AppLogger } from '@common/app-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // necessário para verificação de assinatura do Stripe webhook
    logger: new AppLogger(),
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Aumentar limite do body parser para aceitar HTML de cupons fiscais
  // rawBody: true acima garante que req.rawBody esteja disponível para /stripe/webhook
  app.use(require('body-parser').json({ limit: '10mb' }));
  app.use(require('body-parser').urlencoded({ limit: '10mb', extended: true }));

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:4000', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006', 'http://192.168.86.7:8081'], // React + React Native Expo
    credentials: true,
  });

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // Retorna erro se enviar propriedades extras
      transform: true, // Transforma payloads em instâncias de DTO
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente
      },
    }),
  );

  // JWT Guard global (todas as rotas protegidas por padrão)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Audit interceptor global (registra mutações para rastreabilidade)
  const auditLogService = app.get(AuditLogService);
  app.useGlobalInterceptors(new AuditInterceptor(auditLogService));

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('CookMe API')
    .setDescription('Motor de Otimização de Inventário - API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('usuarios', 'Gestão de usuários')
    .addTag('produtos', 'Catálogo de produtos')
    .addTag('compras', 'Registro de compras')
    .addTag('inventario', 'Gestão de estoque')
    .addTag('receitas', 'Receitas e sugestões')
    .addTag('barcode', 'Scanner de código de barras')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  logger.log(`📚 Documentação Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🌍 Ambiente: ${configService.get('NODE_ENV')}`);
}

bootstrap();