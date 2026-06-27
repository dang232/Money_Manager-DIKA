// ponytail: minimal /health endpoint
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  @Get()
  check(): { status: 'ok'; service: string; uptimeSeconds: number } {
    return {
      status: 'ok',
      service: 'user-service',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }
}