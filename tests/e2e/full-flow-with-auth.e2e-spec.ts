// ponytail: full-flow e2e — register → profile → category → budget → transaction → Kafka → dashboard
// + negative auth cases (wrong password, duplicate email, weak password, refresh replay, logout)
import { http } from '../helpers/http';
import { resetAllDbs } from '../helpers/reset-db';
import { waitFor } from '../helpers/wait';

const TEST_EMAIL = `e2e-${Date.now()}@test.local`;
const TEST_PASSWORD = 'StrongPass123!';
const WEAK_PASSWORD = 'short';

function authHeaders(token: string, userId?: string): Record<string, string> {
  return {
    'x-user-id': userId ?? '',
    'authorization': `Bearer ${token}`,
  };
}

function userIdHeaders(userId: string): Record<string, string> {
  return { 'x-user-id': userId };
}

describe('Full flow with auth (e2e)', () => {
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(() => {
    resetAllDbs();
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  describe('Happy path: register → profile → category → budget → transaction → verify', () => {
    it('1. POST /api/auth/register creates a new user', async () => {
      const res = await http.post('/api/auth/register', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: 'E2E Tester',
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.user.email).toBe(TEST_EMAIL.toLowerCase());
      userId = res.data.data.user.id;
      accessToken = res.data.data.accessToken;
      refreshToken = res.data.data.refreshToken;
      expect(userId).toBeTruthy();
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
    });

    it('2. PUT /api/users/me sets profile preferences', async () => {
      const res = await http.put('/api/users/me', {
        defaultCurrency: 'USD',
        locale: 'en-US',
        budgetAnchorDay: 15,
      }, { headers: userIdHeaders(userId) });
      expect(res.status).toBe(200);
      expect(res.data.data.defaultCurrency).toBe('USD');
    });

    it('3. GET /api/users/me returns updated profile', async () => {
      const res = await http.get('/api/users/me', { headers: userIdHeaders(userId) });
      expect(res.status).toBe(200);
      expect(res.data.data.defaultCurrency).toBe('USD');
      expect(res.data.data.locale).toBe('en-US');
      expect(res.data.data.budgetAnchorDay).toBe(15);
    });

    let categoryId: string;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    it('4. POST /api/categories creates a category', async () => {
      const res = await http.post('/api/categories', {
        name: `E2E-Food-${Date.now()}`,
        type: 'EXPENSE',
        icon: 'utensils',
        color: '#FF0000',
      }, { headers: userIdHeaders(userId) });
      expect(res.status).toBe(201);
      categoryId = res.data.data.id;
      expect(categoryId).toBeTruthy();
    });

    it('5. POST /api/budgets sets a monthly budget', async () => {
      const res = await http.post('/api/budgets', {
        categoryId,
        monthlyLimit: 100000,
        currency: 'VND',
        year,
        month,
      }, { headers: userIdHeaders(userId) });
      expect(res.status).toBe(201);
      expect(res.data.data.runningTotal).toBe(0);
    });

    it('6. POST /api/transactions creates an expense', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const res = await http.post('/api/transactions', {
        amount: 50000,
        type: 'EXPENSE',
        categoryId,
        description: 'E2E test transaction',
        date: yesterday.toISOString().split('T')[0],
      }, { headers: userIdHeaders(userId) });
      expect(res.status).toBe(201);
    });

    it('7. Kafka event updates budget running total', async () => {
      const budget = await waitFor(
        async () => {
          const res = await http.get(`/api/budgets?year=${year}&month=${month}`, {
            headers: userIdHeaders(userId),
          });
          return res.data.data?.[0];
        },
        (b) => b && b.runningTotal === 50000,
        10_000,
        250,
      );
      expect(budget.runningTotal).toBe(50000);
      expect(budget.usagePercentage).toBe(50);
      expect(budget.isExceeded).toBe(false);
    }, 15000);

    it('8. GET /api/dashboard returns aggregated data', async () => {
      const res = await http.get('/api/dashboard', { headers: userIdHeaders(userId) });
      expect(res.status).toBe(200);
      expect(res.data.degraded).toBe(false);
      expect(res.data).toHaveProperty('summary');
      expect(res.data).toHaveProperty('budgets');
    });

    it('9. GET /api/auth/me returns the user', async () => {
      const res = await http.get('/api/auth/me', { headers: userIdHeaders(userId) });
      expect(res.status).toBe(200);
      expect(res.data.data.id).toBe(userId);
      expect(res.data.data.email).toBe(TEST_EMAIL.toLowerCase());
    });
  });

  // ─── Negative auth ────────────────────────────────────────────────────────

  describe('Negative auth cases', () => {
    it('Login with wrong password returns 400 AUTH_INVALID_CREDENTIALS', async () => {
      const res = await http.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(400);
      expect(res.data.error?.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('Register duplicate email returns 400 USER_EMAIL_TAKEN', async () => {
      const res = await http.post('/api/auth/register', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(res.status).toBe(400);
      expect(res.data.error?.code).toBe('USER_EMAIL_TAKEN');
    });

    it('Register with weak password returns 400 PASSWORD_TOO_WEAK', async () => {
      const res = await http.post('/api/auth/register', {
        email: 'weak@test.local',
        password: WEAK_PASSWORD,
      });
      expect(res.status).toBe(400);
      expect(res.data.error?.code).toBe('PASSWORD_TOO_WEAK');
    });

    it('Refresh token rotation: old token rejected after rotate', async () => {
      // Login to get a fresh token pair
      const loginRes = await http.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(loginRes.status).toBe(200);
      const oldRefresh = loginRes.data.data.refreshToken;

      // Rotate
      const rotateRes = await http.post('/api/auth/refresh', { refreshToken: oldRefresh });
      expect(rotateRes.status).toBe(200);
      expect(rotateRes.data.data.refreshToken).not.toBe(oldRefresh);

      // Old token must fail
      const replayRes = await http.post('/api/auth/refresh', { refreshToken: oldRefresh });
      expect(replayRes.status).toBe(400);
      expect(replayRes.data.error?.code).toBe('AUTH_REFRESH_INVALID');
    });

    it('Logout revokes refresh token', async () => {
      // Login
      const loginRes = await http.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      const rt = loginRes.data.data.refreshToken;

      // Logout
      const logoutRes = await http.post('/api/auth/logout', { refreshToken: rt });
      expect(logoutRes.status).toBe(204);

      // Refresh must fail
      const refreshRes = await http.post('/api/auth/refresh', { refreshToken: rt });
      expect(refreshRes.status).toBe(400);
      expect(refreshRes.data.error?.code).toBe('AUTH_REFRESH_INVALID');
    });
  });
});