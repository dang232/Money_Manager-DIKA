// ponytail: minimal /health endpoint for Render's free-tier health check.
// Returns 200 with service name + uptime. Render only requires a 2xx response
// within the health-check interval to keep the service alive.
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  @Get()
  check(): { status: 'ok'; service: string; uptimeSeconds: number } {
    return {
      status: 'ok',
      service: 'transaction-service',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }
}