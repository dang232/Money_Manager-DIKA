export type CacheStrategy = 'write-through' | 'write-behind' | 'cache-aside';
export interface CachePort {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, strategy: CacheStrategy, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidate(pattern: string): Promise<void>;
}
//# sourceMappingURL=cache.port.d.ts.map