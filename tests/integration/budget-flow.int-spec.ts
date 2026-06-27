// ponytail: budget + category flow against real budget_db
import { http, userHeaders } from '../helpers/http';
import { resetBudgetDb } from '../helpers/reset-db';
import { waitForHealthyStack } from '../helpers/wait';

describe('Budget flow (real budget_db)', () => {
  beforeAll(async () => {
    await waitForHealthyStack();
    resetBudgetDb();
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const uniqueName = `Cat-${Date.now()}`;

  let categoryId: string;

  it('POST /api/categories creates a fresh category', async () => {
    const res = await http.post(
      '/api/categories',
      { name: uniqueName, type: 'EXPENSE', icon: 'utensils', color: '#FF5733' },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(201);
    expect(res.data.data).toHaveProperty('id');
    categoryId = res.data.data.id;
  });

  it('POST /api/categories rejects duplicate name+type', async () => {
    const res = await http.post(
      '/api/categories',
      { name: uniqueName, type: 'EXPENSE', icon: 'car', color: '#00FF00' },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(400);
    // ponytail: gateway HttpExceptionFilter normalizes the body — downstream code is lost.
    // Verify the status; the body just needs to indicate error.
    expect(res.data.success).not.toBe(true);
  });

  it('POST /api/categories rejects bad color', async () => {
    const res = await http.post(
      '/api/categories',
      { name: `Bad-${Date.now()}`, type: 'INCOME', icon: 'wallet', color: 'not-a-color' },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(400);
  });

  it('POST /api/budgets creates a budget with runningTotal=0', async () => {
    const res = await http.post(
      '/api/budgets',
      { categoryId, monthlyLimit: 100000, currency: 'VND', year, month },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(201);
    expect(res.data.data).toHaveProperty('budgetId');
    expect(res.data.data.categoryId).toBe(categoryId);
    expect(res.data.data.monthlyLimit).toBe(100000);
    expect(res.data.data.runningTotal).toBe(0);
    expect(res.data.data.usagePercentage).toBe(0);
    expect(res.data.data.isExceeded).toBe(false);
  });

  it('POST /api/budgets again with same categoryId+period updates monthlyLimit', async () => {
    const res = await http.post(
      '/api/budgets',
      { categoryId, monthlyLimit: 250000, currency: 'VND', year, month },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(201);
    expect(res.data.data.monthlyLimit).toBe(250000);
  });

  it('GET /api/budgets?year&month returns the budget with usage fields', async () => {
    const res = await http.get(`/api/budgets?year=${year}&month=${month}`, { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.data.length).toBe(1);
    const b = res.data.data[0];
    expect(b.monthlyLimit).toBe(250000);
    expect(b).toHaveProperty('runningTotal');
    expect(b).toHaveProperty('usagePercentage');
    expect(b).toHaveProperty('isExceeded');
  });

  it('GET /api/budgets/projections returns projection rows', async () => {
    const res = await http.get(`/api/budgets/projections?year=${year}&month=${month}`, {
      headers: userHeaders(),
    });
    expect(res.status).toBe(200);
    expect(res.data.data.length).toBe(1);
    const p = res.data.data[0];
    expect(p).toHaveProperty('dailyVelocity');
    expect(p).toHaveProperty('projectedOverageDate');
    expect(p).toHaveProperty('daysUntilExceeded');
  });

  it('POST /api/budgets rejects bad month', async () => {
    const res = await http.post(
      '/api/budgets',
      { categoryId, monthlyLimit: 100, currency: 'VND', year, month: 13 },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(400);
  });
});