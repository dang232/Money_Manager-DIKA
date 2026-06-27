// ponytail: gateway /health aggregation + per-service health checks
import axios from 'axios';
import { http } from '../helpers/http';

describe('Health endpoints', () => {
  it('gateway /health returns aggregated status', async () => {
    const res = await http.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(Array.isArray(res.data.services)).toBe(true);
    const names = res.data.services.map((s: { name: string }) => s.name).sort();
    // ponytail: 4 services — transaction, budget, ai, auth
    expect(names).toEqual(['ai', 'auth', 'budget', 'transaction']);
    for (const s of res.data.services) {
      expect(s.status).toBe('up');
    }
  });

  it.each([
    ['http://localhost:3001', 'transaction-service'],
    ['http://localhost:3002', 'budget-service'],
    ['http://localhost:3003', 'ai-service'],
  ])('per-service /health on %s reports ok', async (url, expectedName) => {
    const res = await axios.get(`${url}/health`, { validateStatus: () => true });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(res.data.service).toBe(expectedName);
    expect(typeof res.data.uptimeSeconds).toBe('number');
  });
});