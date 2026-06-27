// ponytail: cross-service integration — POST transaction through gateway → Kafka publish →
// budget-service consumer updates running total in budget_db → GET reflects via gateway.
// Highest-value test in the suite: exercises the full event-driven architecture.
import { http, userHeaders } from '../helpers/http';
import { resetAllDbs } from '../helpers/reset-db';
import { waitFor, waitForHealthyStack } from '../helpers/wait';

describe('Cross-service event flow (Kafka)', () => {
  beforeAll(async () => {
    await waitForHealthyStack();
    resetAllDbs();
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.toISOString().split('T')[0];
  const uniqueCat = `Event-${Date.now()}`;

  let categoryId: string;

  it('seeds a category in budget_db', async () => {
    const res = await http.post(
      '/api/categories',
      { name: uniqueCat, type: 'EXPENSE', icon: 'utensils', color: '#FF0000' },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(201);
    categoryId = res.data.data.id;
  });

  it('seeds a budget with monthlyLimit=100000', async () => {
    const res = await http.post(
      '/api/budgets',
      { categoryId, monthlyLimit: 100000, currency: 'VND', year, month },
      { headers: userHeaders() },
    );
    expect(res.status).toBe(201);
    expect(res.data.data.runningTotal).toBe(0);
  });

  it('POST /api/transactions publishes transaction.created → budget running-total updates via Kafka', async () => {
    const txAmount = 50000;

    const post = await http.post(
      '/api/transactions',
      {
        amount: txAmount,
        type: 'EXPENSE',
        categoryId,
        description: 'cross-service test',
        date: today,
      },
      { headers: userHeaders() },
    );
    expect(post.status).toBe(201);

    // ponytail: poll until runningTotal reflects the transaction amount. Kafka consumer
    // rebalances can take 1-3s on first message, so we allow up to 10s.
    const updated = await waitFor(
      async () => {
        const res = await http.get(`/api/budgets?year=${year}&month=${month}`, { headers: userHeaders() });
        return res.data.data[0];
      },
      (b) => b && b.runningTotal === txAmount,
      10_000,
      250,
    );

    expect(updated.runningTotal).toBe(txAmount);
    expect(updated.usagePercentage).toBe(50); // 50000/100000
    expect(updated.isExceeded).toBe(false);
  }, 15000);
});