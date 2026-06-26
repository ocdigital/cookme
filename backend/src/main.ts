import 'module-alias/register';
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
import { SubscriptionLimitFilter } from '@common/filters/subscription-limit.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: new AppLogger(),
  });

  // Aumentar limite para cupons fiscais sem quebrar rawBody do webhook Stripe
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.use('/api/compras', require('body-parser').json({ limit: '10mb' }));
  httpAdapter.use('/api/compras', require('body-parser').urlencoded({ limit: '10mb', extended: true }));

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProd = configService.get('NODE_ENV') === 'production';

  // Security headers
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS — apenas origens conhecidas em produção
  app.enableCors({
    origin: isProd
      ? [
          'https://admin.cookme.com.br',
          'https://cookme.com.br',
          'https://www.cookme.com.br',
        ]
      : true,
    credentials: true,
  });

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // JWT Guard global (todas as rotas protegidas por padrão)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Filter para converter erros de limite/plano em 403 com upgrade:true
  app.useGlobalFilters(new SubscriptionLimitFilter());

  // Audit interceptor global
  const auditLogService = app.get(AuditLogService);
  app.useGlobalInterceptors(new AuditInterceptor(auditLogService));

  // Swagger — apenas fora de produção
  if (!isProd) {
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
    logger.log(`📚 Swagger: http://localhost:${configService.get('PORT', 3000)}/api/docs`);
  }

  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Aplicação rodando em: http://0.0.0.0:${port}`);
  logger.log(`🌍 Ambiente: ${configService.get('NODE_ENV')}`);
}

bootstrap();
