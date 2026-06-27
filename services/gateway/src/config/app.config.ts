// ponytail: gateway configuration — service URLs, circuit breaker, rate limit, redis, mTLS
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  SERVICE_URLS: {
    transaction: process.env['TRANSACTION_SERVICE_URL'] || 'http://localhost:3001',
    budget: process.env['BUDGET_SERVICE_URL'] || 'http://localhost:3002',
    ai: process.env['AI_SERVICE_URL'] || 'http://localhost:3003',
    auth: process.env['AUTH_SERVICE_URL'] || 'http://localhost:3004',
    user: process.env['USER_SERVICE_URL'] || 'https://localhost:3005',
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
  MTLS: {
    enabled: process.env['MTLS_USER_ENABLED'] === 'true',
    caPath: process.env['MTLS_CA_PATH'] || '/etc/mtls/ca.pem',
    clientCertPath: process.env['MTLS_CLIENT_CERT_PATH'] || '/etc/mtls/gateway.crt',
    clientKeyPath: process.env['MTLS_CLIENT_KEY_PATH'] || '/etc/mtls/gateway.key',
  },
  CORS_ORIGIN: process.env['FRONTEND_URL'] || 'http://localhost:5173',
}));
