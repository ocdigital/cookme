import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const getDatabaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development', // ⚠️ NUNCA em produção
    logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'migration'] : false,
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
    // Disable native enum types to avoid conflicts
    dropSchema: configService.get('NODE_ENV') === 'development' && configService.get('DB_DROP_SCHEMA') === 'true',
});

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'cookme',
    password: process.env.DB_PASSWORD || 'cookme123',
    database: process.env.DB_DATABASE || 'cookme_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: true,
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
};