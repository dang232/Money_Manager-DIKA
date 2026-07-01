// ponytail: /api/dashboard — gateway fans out to 3 services and aggregates
import { http, userHeaders, TEST_USER_ID } from '../helpers/http';
import { waitForHealthyStack } from '../helpers/wait';

describe('Dashboard aggregation', () => {
  beforeAll(async () => {
    await waitForHealthyStack();
  });
  it('returns combined summary + budgets + projections', async () => {
    const res = await http.get('/api/dashboard', { headers: userHeaders(TEST_USER_ID) });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('summary');
    expect(res.data).toHaveProperty('budgets');
    expect(res.data).toHaveProperty('projections');
    expect(res.data).toHaveProperty('updatedAt');
    expect(typeof res.data.degraded).toBe('boolean');
  });

  it('returns 200 even when no budgets exist', async () => {
    const res = await http.get('/api/dashboard', { headers: userHeaders(TEST_USER_ID) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.budgets.data)).toBe(true);
  });

  it('summary totals are numbers (zero is valid)', async () => {
    const res = await http.get('/api/dashboard', { headers: userHeaders(TEST_USER_ID) });
    expect(res.status).toBe(200);
    expect(typeof res.data.summary.data.totalIncome).toBe('number');
    expect(typeof res.data.summary.data.totalExpense).toBe('number');
  });
});