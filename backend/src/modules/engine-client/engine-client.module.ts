import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EngineClientService } from './engine-client.service';

@Module({
  imports: [ConfigModule],
  providers: [EngineClientService],
  exports: [EngineClientService],
})
export class EngineClientModule {}
