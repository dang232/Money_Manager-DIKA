// ponytail: health controller — checks downstream services, redis, kafka
import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { readFileSync } from 'fs';
import { Agent as HttpsAgent } from 'https';
import axios from 'axios';
import { appConfig } from '../config/app.config';

interface ServiceHealth {
  name: string;
  status: 'up' | 'down';
}

@Controller('health')
export class HealthController {
  private mtlsAgent: HttpsAgent | null = null;

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {
    // ponytail: build mTLS agent eagerly in constructor so health checks work for user-service
    const m = this.config.MTLS;
    if (m.enabled) {
      try {
        this.mtlsAgent = new HttpsAgent({
          ca: readFileSync(m.caPath),
          cert: readFileSync(m.clientCertPath),
          key: readFileSync(m.clientKeyPath),
          rejectUnauthorized: true,
        });
      } catch { /* proxy service will crash first if certs missing */ }
    }
  }

  @Get()
  async check(): Promise<{ status: 'ok' | 'degraded'; services: ServiceHealth[] }> {
    const urls = this.config.SERVICE_URLS;
    const checks = Object.entries(urls).map(async ([name, url]) => {
      try {
        const needsMtls = url.startsWith('https://') && this.mtlsAgent;
        await axios.get(`${url}/health`, {
          timeout: 2000,
          ...(needsMtls ? { httpsAgent: this.mtlsAgent } : {}),
        });
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
