// ponytail: dashboard controller tests — aggregation + degraded mode
import { DashboardController } from './dashboard.controller';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DashboardController', () => {
  let controller: DashboardController;
  const mockCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn(),
    invalidate: jest.fn(),
  };
  const mockConfig = {
    SERVICE_URLS: {
      transaction: 'http://localhost:3001',
      budget: 'http://localhost:3002',
      ai: 'http://localhost:3003',
    },
    CIRCUIT_BREAKER: { timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 30000 },
    RATE_LIMIT: { windowMs: 60000, max: 100 },
    REDIS: { host: 'localhost', port: 6379 },
    CORS_ORIGIN: 'http://localhost:5173',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DashboardController(mockConfig as any, mockCache as any);
  });

  it('returns combined data from all services', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('summary')) return Promise.resolve({ data: { income: 5000, expense: 3000 } });
      if (url.includes('projections')) return Promise.resolve({ data: { projected: 2000 } });
      return Promise.resolve({ data: [{ id: '1', name: 'Food' }] });
    });

    const result = await controller.getDashboard('2024', '6');

    expect(result.degraded).toBe(false);
    expect(result.summary).toEqual({ income: 5000, expense: 3000 });
    expect(result.budgets).toEqual([{ id: '1', name: 'Food' }]);
    expect(result.projections).toEqual({ projected: 2000 });
    expect(result.updatedAt).toBeDefined();
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('returns partial data with degraded flag on service failure', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('summary')) return Promise.resolve({ data: { income: 5000 } });
      return Promise.reject(new Error('service down'));
    });

    const result = await controller.getDashboard('2024', '6');

    expect(result.degraded).toBe(true);
    expect(result.summary).toEqual({ income: 5000 });
    expect(result.budgets).toBeNull();
    expect(result.projections).toBeNull();
    expect(mockCache.set).not.toHaveBeenCalled();
  });

  it('returns cached data when available', async () => {
    const cached = { summary: {}, budgets: [], projections: {}, updatedAt: 'x', degraded: false };
    mockCache.get.mockResolvedValueOnce(cached);

    const result = await controller.getDashboard('2024', '6');

    expect(result).toEqual(cached);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});
