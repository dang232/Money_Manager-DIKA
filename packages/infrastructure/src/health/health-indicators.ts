// ponytail: health indicators for Kafka, Redis, Postgres
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { Pool } from 'pg';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafka: Kafka) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.disconnect();
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError('Kafka check failed', this.getStatus(key, false, { error: String(err) }));
    }
  }
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') throw new Error('unexpected ping response');
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { error: String(err) }));
    }
  }
}

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  constructor(private readonly pool: Pool) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError('Postgres check failed', this.getStatus(key, false, { error: String(err) }));
    }
  }
}
