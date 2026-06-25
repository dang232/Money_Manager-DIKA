// ponytail: budget cache service — Redis-backed read-through cache
import { Injectable, Inject } from '@nestjs/common';
import { CachePort } from '@money-manager/shared-kernel';
import { CACHE_PORT } from '@money-manager/infrastructure';
import { BudgetStatusDto } from '../../application/handlers/get-budget-status.handler';

const TTL_SECONDS = 3600;

@Injectable()
export class BudgetCacheService {
  constructor(
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  private key(userId: string, year: number, month: number): string {
    return `budget:${userId}:${year}:${month}`;
  }

  async getStatus(userId: string, year: number, month: number): Promise<BudgetStatusDto[] | null> {
    return this.cache.get<BudgetStatusDto[]>(this.key(userId, year, month));
  }

  async setStatus(userId: string, year: number, month: number, data: BudgetStatusDto[]): Promise<void> {
    await this.cache.set(this.key(userId, year, month), data, 'write-through', TTL_SECONDS);
  }

  async invalidate(userId: string, year: number, month: number): Promise<void> {
    await this.cache.del(this.key(userId, year, month));
  }
}
