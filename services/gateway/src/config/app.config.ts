// ponytail: gateway configuration — service URLs, circuit breaker, rate limit, redis
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  SERVICE_URLS: {
    transaction: process.env['TRANSACTION_SERVICE_URL'] || 'http://localhost:3001',
    budget: process.env['BUDGET_SERVICE_URL'] || 'http://localhost:3002',
    ai: process.env['AI_SERVICE_URL'] || 'http://localhost:3003',
  },
  CIRCUIT_BREAKER: {
    timeout: Number(process.env['CB_TIMEOUT'] || 3000),
    errorThresholdPercentage: Number(process.env['CB_ERROR_THRESHOLD'] || 50),
    resetTimeout: Number(process.env['CB_RESET_TIMEOUT'] || 30000),
  },
  RATE_LIMIT: {
    windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS'] || 60000),
    max: Number(process.env['RATE_LIMIT_MAX'] || 100),
  },
  REDIS: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: Number(process.env['REDIS_PORT'] || 6379),
  },
  CORS_ORIGIN: process.env['FRONTEND_URL'] || 'http://localhost:5173',
}));
