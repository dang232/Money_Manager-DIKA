// event-bus
export { KafkaEventBusAdapter } from './event-bus/kafka.adapter';
export { RedisStreamsEventBusAdapter } from './event-bus/redis-streams.adapter';
export { EventBusModule, EVENT_BUS_PORT } from './event-bus/event-bus.factory';
export type { EventBusConfig } from './event-bus/event-bus.factory';

// cache
export { RedisCacheAdapter } from './cache/redis-cache.adapter';
export { CacheModule, CACHE_PORT } from './cache/cache.module';
export type { CacheModuleConfig } from './cache/cache.module';

// logging
export { createLogger } from './logging/winston-loki.config';
export { LoggerModule, LOGGER_TOKEN } from './logging/logger.module';

// health
export { KafkaHealthIndicator, RedisHealthIndicator, PostgresHealthIndicator } from './health/health-indicators';

// persistence
export { BaseEntity } from './persistence/base.entity';
export { DatabaseModule } from './persistence/mikro-orm.module';
export type { MikroOrmConfig } from './persistence/mikro-orm.module';
