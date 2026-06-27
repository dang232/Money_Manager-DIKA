// ponytail: CacheModule — NestJS DynamicModule wrapping RedisCacheAdapter
import { DynamicModule, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { CACHE_PORT } from '@money-manager/shared-kernel';

export interface CacheModuleConfig {
  host: string;
  port: number;
  password?: string;
}

export { CACHE_PORT };

@Module({})
export class CacheModule {
  static forRoot(config: CacheModuleConfig): DynamicModule {
    const provider = {
      provide: CACHE_PORT,
      useFactory: () => {
        const redis = new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
        });
        return new RedisCacheAdapter(redis);
      },
    };

    return {
      module: CacheModule,
      providers: [provider],
      exports: [CACHE_PORT],
    };
  }
}
