import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScraperSessao } from './entities/scraper-sessao.entity';
import { Compra } from '../compras/entities/compra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, ScraperSessao]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ScraperController],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
