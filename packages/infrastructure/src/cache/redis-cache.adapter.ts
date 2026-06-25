// ponytail: RedisCacheAdapter — JSON serialize/deserialize, SCAN-based invalidation
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { CachePort, CacheStrategy } from '@money-manager/shared-kernel';

@Injectable()
export class RedisCacheAdapter implements CachePort {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: unknown, strategy: CacheStrategy, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, serialized);
    }
    // Store strategy as metadata key — lightweight, not critical
    await this.redis.set(`${key}:__strategy`, strategy);
  }

  async invalidate(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
