import Redis from 'ioredis';
import type { CachePort, CacheStrategy } from "@money-manager/shared-kernel";
export declare class RedisCacheAdapter implements CachePort {
    private readonly redis;
    constructor(redis: Redis);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, strategy: CacheStrategy, ttlSeconds?: number): Promise<void>;
    invalidate(pattern: string): Promise<void>;
    del(key: string): Promise<void>;
}
//# sourceMappingURL=redis-cache.adapter.d.ts.map