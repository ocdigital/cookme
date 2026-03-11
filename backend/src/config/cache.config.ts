import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const getCacheConfig = async (
  configService: ConfigService,
): Promise<CacheModuleOptions> => {
  const store = await redisStore({
    socket: {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
    },
    ttl: 300,
  });

  return {
    store: store as any,
    isGlobal: true,
  };
};
