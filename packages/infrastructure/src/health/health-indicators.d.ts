import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { Pool } from 'pg';
export declare class KafkaHealthIndicator extends HealthIndicator {
    private readonly kafka;
    constructor(kafka: Kafka);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
export declare class RedisHealthIndicator extends HealthIndicator {
    private readonly redis;
    constructor(redis: Redis);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
export declare class PostgresHealthIndicator extends HealthIndicator {
    private readonly pool;
    constructor(pool: Pool);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
//# sourceMappingURL=health-indicators.d.ts.map