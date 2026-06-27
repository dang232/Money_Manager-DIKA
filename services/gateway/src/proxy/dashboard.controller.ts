// ponytail: dashboard controller — aggregates data from transaction + budget services
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { CachePort } from '@money-manager/shared-kernel';
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
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<DashboardResponse> {
    const now = new Date();
    const y = year || String(now.getFullYear());
    const m = month || String(now.getMonth() + 1);

    const cacheKey = `dashboard:default:${y}:${m}`;
    const cached = await this.cache.get<DashboardResponse>(cacheKey);
    if (cached) return cached;

    let degraded = false;
    const urls = this.config.SERVICE_URLS;

    const [summaryResult, budgetsResult, projectionsResult] = await Promise.allSettled([
      axios.get(`${urls.transaction}/transactions/summary`, { params: { year: y, month: m } }),
      axios.get(`${urls.budget}/budgets`, { params: { year: y, month: m } }),
      axios.get(`${urls.budget}/budgets/projections`, { params: { year: y, month: m } }),
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
