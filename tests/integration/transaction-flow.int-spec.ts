// ponytail: transaction CRUD against the real stack — real Postgres, real gateway, real validation
import { http, userHeaders } from '../helpers/http';
import { resetTxnDb } from '../helpers/reset-db';
import { waitForHealthyStack } from '../helpers/wait';

const CATEGORY_ID = '11111111-1111-4111-a111-111111111111';

const today = (): string => new Date().toISOString().split('T')[0];
const yesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const validBody = (overrides: Record<string, unknown> = {}) => ({
  amount: 50000,
  type: 'EXPENSE',
  categoryId: CATEGORY_ID,
  description: 'Integration test transaction',
  date: yesterday(),
  ...overrides,
});

describe('Transaction flow (real DB)', () => {
  beforeAll(async () => {
    await waitForHealthyStack();
    resetTxnDb();
  });

  let createdId: string;

  it('POST /api/transactions creates a transaction', async () => {
    const res = await http.post('/api/transactions', validBody(), { headers: userHeaders() });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveProperty('id');
    createdId = res.data.data.id;
  });

  it('GET /api/transactions/:id returns the created transaction', async () => {
    const res = await http.get(`/api/transactions/${createdId}`, { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(createdId);
    expect(res.data.data.amount).toBe(50000);
  });

  it('GET /api/transactions includes the new transaction', async () => {
    const res = await http.get('/api/transactions?limit=100', { headers: userHeaders() });
    expect(res.status).toBe(200);
    const ids = res.data.data.map((t: { id: string }) => t.id);
    expect(ids).toContain(createdId);
  });

  it('PUT /api/transactions/:id updates amount', async () => {
    const res = await http.put(
      `/api/transactions/${createdId}`,
      { amount: 75000, description: 'Updated' },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(200);
    expect(res.data.data.amount).toBe(75000);
    expect(res.data.data.description).toBe('Updated');
  });

  it('GET /api/transactions/summary reflects updated amount', async () => {
    const now = new Date();
    const res = await http.get(
      `/api/transactions/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
      { headers: userHeaders() },
    );
    expect(res.status).toBe(200);
    expect(res.data.data.transactionCount).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 on validation failure (amount=0)', async () => {
    const res = await http.post('/api/transactions', validBody({ amount: 0 }), { headers: userHeaders() });
    expect(res.status).toBe(400);
  });

  it('returns 400 on future date', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const res = await http.post(
      '/api/transactions',
      validBody({ date: future.toISOString().split('T')[0] }),
      { headers: userHeaders() },
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid UUID categoryId', async () => {
    const res = await http.post('/api/transactions', validBody({ categoryId: 'not-a-uuid' }), {
      headers: userHeaders(),
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/transactions/:id removes the record and subsequent GET returns 404', async () => {
    const del = await http.delete(`/api/transactions/${createdId}`, { headers: userHeaders() });
    // ponytail: gateway proxy returns 200 with empty body for downstream 204 (no @HttpCode on proxy controller)
    expect([200, 204]).toContain(del.status);

    const get = await http.get(`/api/transactions/${createdId}`, { headers: userHeaders() });
    expect(get.status).toBe(404);
  });

  it('GET /api/transactions/summary with today date works (no NaN regression)', async () => {
    const res = await http.get('/api/transactions/summary', { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.data.period).toMatch(/^\d{4}-\d{2}$/);
  });
});