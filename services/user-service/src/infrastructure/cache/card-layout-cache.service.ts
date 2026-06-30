// ponytail: CardLayout cache service — Redis-backed read-through cache
import { Injectable, Inject } from '@nestjs/common';
import { CachePort, CACHE_PORT } from '@money-manager/shared-kernel';
import { CardLayoutData } from '../../domain/aggregates/card-layout.aggregate';

const TTL_SECONDS = 3600;

export interface CachedCardLayout {
  layout: CardLayoutData;
  version: number;
}

@Injectable()
export class CardLayoutCacheService {
  constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}

  private key(userId: string): string {
    return `layout:${userId}`;
  }

  async get(userId: string): Promise<CachedCardLayout | null> {
    return this.cache.get<CachedCardLayout>(this.key(userId));
  }

  async set(userId: string, layout: CardLayoutData, version: number): Promise<void> {
    await this.cache.set(this.key(userId), { layout, version }, 'write-through', TTL_SECONDS);
  }

  async invalidate(userId: string): Promise<void> {
    await this.cache.del(this.key(userId));
  }
}