// ponytail: circuit breaker service tests
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;
  const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() } as any;
  const mockConfig = {
    SERVICE_URLS: { transaction: 'http://localhost:3001' },
    CIRCUIT_BREAKER: { timeout: 1000, errorThresholdPercentage: 50, resetTimeout: 500 },
    RATE_LIMIT: { windowMs: 60000, max: 100 },
    REDIS: { host: 'localhost', port: 6379 },
    CORS_ORIGIN: 'http://localhost:5173',
  };

  beforeEach(() => {
    service = new CircuitBreakerService(mockConfig as any, mockLogger);
  });

  it('executes successful calls through the breaker', async () => {
    const result = await service.execute('transaction', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('opens circuit after threshold failures', async () => {
    const fail = () => service.execute('test-open', async () => { throw new Error('fail'); });

    // fire enough failures to trip the breaker (default volume threshold is 10 in opossum)
    const attempts: Promise<unknown>[] = [];
    for (let i = 0; i < 15; i++) {
      attempts.push(fail().catch(() => {}));
    }
    await Promise.allSettled(attempts);

    // next call should get open circuit error
    await expect(fail()).rejects.toThrow();
  });

  it('half-opens after reset timeout and closes on success', async () => {
    const fail = () => service.execute('test-half', async () => { throw new Error('fail'); });

    for (let i = 0; i < 15; i++) {
      await fail().catch(() => {});
    }

    // wait for resetTimeout
    await new Promise((r) => setTimeout(r, 600));

    // half-open: next successful call should close the circuit
    const result = await service.execute('test-half', async () => 'recovered');
    expect(result).toBe('recovered');
  });
});
