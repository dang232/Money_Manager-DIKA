// ponytail: EventBusFactory — ENV-driven adapter selection, NestJS DynamicModule
import { DynamicModule, Module } from '@nestjs/common';
import { KafkaConfig } from 'kafkajs';
import Redis from 'ioredis';
import { KafkaEventBusAdapter } from './kafka.adapter';
import { RedisStreamsEventBusAdapter } from './redis-streams.adapter';

export interface EventBusConfig {
  adapter?: 'kafka' | 'redis-streams';
  kafka?: KafkaConfig;
  redis?: { host: string; port: number; password?: string };
}

export const EVENT_BUS_PORT = 'EVENT_BUS_PORT';

@Module({})
export class EventBusModule {
  static forRoot(config: EventBusConfig = {}): DynamicModule {
    const adapter = config.adapter ?? (process.env['EVENT_BUS_ADAPTER'] as 'kafka' | 'redis-streams') ?? 'kafka';

    const provider = adapter === 'redis-streams'
      ? {
          provide: EVENT_BUS_PORT,
          useFactory: () => {
            const redis = new Redis({
              host: config.redis?.host ?? 'localhost',
              port: config.redis?.port ?? 6379,
              password: config.redis?.password,
            });
            return new RedisStreamsEventBusAdapter(redis);
          },
        }
      : {
          provide: EVENT_BUS_PORT,
          useFactory: () => {
            const kafkaConfig: KafkaConfig = config.kafka ?? {
              clientId: process.env['KAFKA_CLIENT_ID'] ?? 'money-manager',
              brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
            };
            return new KafkaEventBusAdapter(kafkaConfig);
          },
        };

    return {
      module: EventBusModule,
      providers: [provider],
      exports: [EVENT_BUS_PORT],
    };
  }
}
