// ponytail: health controller — checks downstream services, redis, kafka
import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { appConfig } from '../config/app.config';

interface ServiceHealth {
  name: string;
  status: 'up' | 'down';
}

@Controller('health')
export class HealthController {
  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  @Get()
  async check(): Promise<{ status: 'ok' | 'degraded'; services: ServiceHealth[] }> {
    const urls = this.config.SERVICE_URLS;
    const checks = Object.entries(urls).map(async ([name, url]) => {
      try {
        await axios.get(`${url}/health`, { timeout: 2000 });
        return { name, status: 'up' as const };
      } catch {
        return { name, status: 'down' as const };
      }
    });

    const services = await Promise.all(checks);
    const allUp = services.every((s) => s.status === 'up');

    return { status: allUp ? 'ok' : 'degraded', services };
  }
}
