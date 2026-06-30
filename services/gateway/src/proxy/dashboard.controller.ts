// Dashboard controller — aggregates data from transaction + budget services
// FIXED: Added @CurrentUser() for multi-user isolation, user-specific cache keys, auth header forwarding
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { UserId, CurrentUser, CachePort } from '@money-manager/shared-kernel';
import { CACHE_PORT } from '@money-manager/shared-kernel';
import { appConfig } from '../config/app.config';

interface DashboardResponse {
  summary: unknown;
  budgets: unknown;
  projections: unknown;
  updatedAt: string;
  degraded: boolean;
}

@Controller('api/dashboard')
export class DashboardController {
  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  @Get()
  async getDashboard(
    @CurrentUser() userId: UserId,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<DashboardResponse> {
    console.log('[DashboardController] getDashboard called with userId:', userId.value);
    const now = new Date();
    const y = year || String(now.getFullYear());
    const m = month || String(now.getMonth() + 1);

    // FIXED: User-specific cache key for multi-user isolation
    const cacheKey = `dashboard:${userId.value}:${y}:${m}`;
    console.log('[DashboardController] cacheKey:', cacheKey);
    const cached = await this.cache.get<DashboardResponse>(cacheKey);
    if (cached) {
      console.log('[DashboardController] returning cached data');
      return cached;
    }

    let degraded = false;
    const urls = this.config.SERVICE_URLS;

    // FIXED: Include x-user-id header for downstream auth
    const authHeaders = { 'x-user-id': userId.value };

    const [summaryResult, budgetsResult, projectionsResult] = await Promise.allSettled([
      axios.get(`${urls.transaction}/transactions/summary`, {
        params: { year: y, month: m },
        headers: authHeaders,
      }),
      axios.get(`${urls.budget}/budgets`, {
        params: { year: y, month: m },
        headers: authHeaders,
      }),
      axios.get(`${urls.budget}/budgets/projections`, {
        params: { year: y, month: m },
        headers: authHeaders,
      }),
    ]);

    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value.data : null;
    const budgets = budgetsResult.status === 'fulfilled' ? budgetsResult.value.data : null;
    const projections = projectionsResult.status === 'fulfilled' ? projectionsResult.value.data : null;

    if (!summary || !budgets || !projections) degraded = true;

    const response: DashboardResponse = {
      summary,
      budgets,
      projections,
      updatedAt: new Date().toISOString(),
      degraded,
    };

    if (!degraded) {
      await this.cache.set(cacheKey, response, 'write-through', 30);
    }

    return response;
  }
}
