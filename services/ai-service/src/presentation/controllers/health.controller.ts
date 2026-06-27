// ponytail: minimal /health endpoint for Render's free-tier health check.
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  @Get()
  check(): { status: 'ok'; service: string; uptimeSeconds: number } {
    return {
      status: 'ok',
      service: 'ai-service',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }
}