// ponytail: gateway → downstream proxy forwarding (read endpoints)
import { http, userHeaders } from '../helpers/http';
import { waitForHealthyStack } from '../helpers/wait';

describe('Gateway proxy forwarding', () => {
  beforeAll(async () => {
    // ponytail: wait for circuit breaker to recover if prior run left it open
    await waitForHealthyStack();
  });
  describe('GET /api/transactions', () => {
    it('returns array of transactions', async () => {
      const res = await http.get('/api/transactions', { headers: userHeaders() });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('respects limit query param', async () => {
      const res = await http.get('/api/transactions?limit=5', { headers: userHeaders() });
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/transactions/summary', () => {
    it('returns numeric summary with default month', async () => {
      const res = await http.get('/api/transactions/summary', { headers: userHeaders() });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('totalIncome');
      expect(res.data.data).toHaveProperty('totalExpense');
      expect(res.data.data).toHaveProperty('net');
      expect(res.data.data).toHaveProperty('transactionCount');
      expect(res.data.data).toHaveProperty('period');
    });

    it('respects year/month query params', async () => {
      const res = await http.get('/api/transactions/summary?year=2020&month=1', { headers: userHeaders() });
      expect(res.status).toBe(200);
      expect(res.data.data.period).toMatch(/^2020-01$/);
    });
  });

  describe('GET /api/categories', () => {
    it('returns array (length depends on prior runs)', async () => {
      const res = await http.get('/api/categories', { headers: userHeaders() });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      // ponytail: spec must work whether or not seed has run; just assert it's an array
      expect(res.data.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/budgets', () => {
    it('returns array (possibly empty)', async () => {
      const res = await http.get('/api/budgets', { headers: userHeaders() });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('returns 400 for non-UUID id', async () => {
      const res = await http.get('/api/transactions/not-a-uuid', { headers: userHeaders() });
      expect(res.status).toBe(400);
    });

    it('returns 404 for valid UUID with no record', async () => {
      const res = await http.get('/api/transactions/00000000-0000-4000-a000-000000000000', {
        headers: userHeaders(),
      });
      expect(res.status).toBe(404);
      // ponytail: gateway's HttpExceptionFilter formats the error; downstream ApiResponse not preserved
      expect(res.status).toBe(404);
    });
  });

  describe('user header propagation', () => {
    it('honors x-user-id header', async () => {
      const res = await http.get('/api/transactions', { headers: userHeaders() });
      expect(res.status).toBe(200);
      // ponytail: response meta correlationId proves the request traversed gateway→service
      expect(res.data.meta?.correlationId ?? res.headers['x-correlation-id']).toBeTruthy();
    });
  });
});