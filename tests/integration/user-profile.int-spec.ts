// ponytail: user profile integration test — exercises gateway → mTLS → user-service path
import { http, userHeaders } from '../helpers/http';
import { resetUserDb } from '../helpers/reset-db';

describe('User profile flow (real user_db via mTLS)', () => {
  beforeAll(() => {
    resetUserDb();
  });

  it('GET /api/users/me auto-creates a profile with defaults', async () => {
    const res = await http.get('/api/users/me', { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.locale).toBe('en-US');
    expect(res.data.data.timezone).toBe('UTC');
    expect(res.data.data.defaultCurrency).toBe('VND');
    expect(res.data.data.budgetAnchorDay).toBe(1);
    expect(res.data.data.notificationPrefs.email).toBe(true);
  });

  it('PUT /api/users/me patches only provided fields', async () => {
    const res = await http.put('/api/users/me', {
      displayName: 'Alice',
      defaultCurrency: 'USD',
      locale: 'vi',
      budgetAnchorDay: 15,
    }, { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.data.displayName).toBe('Alice');
    expect(res.data.data.defaultCurrency).toBe('USD');
    expect(res.data.data.locale).toBe('vi');
    expect(res.data.data.budgetAnchorDay).toBe(15);
    expect(res.data.data.timezone).toBe('UTC'); // unchanged
  });

  it('PUT /api/users/me rejects invalid currency', async () => {
    const res = await http.put('/api/users/me', { defaultCurrency: 'XXX' }, { headers: userHeaders() });
    expect(res.status).toBe(400);
  });

  it('PUT /api/users/me rejects invalid timezone', async () => {
    const res = await http.put('/api/users/me', { timezone: 'Not/Real' }, { headers: userHeaders() });
    expect(res.status).toBe(400);
  });

  it('PUT /api/users/me rejects budgetAnchorDay out of bounds', async () => {
    const res = await http.put('/api/users/me', { budgetAnchorDay: 32 }, { headers: userHeaders() });
    expect(res.status).toBe(400);
  });

  it('PUT /api/users/me/preferences updates notification prefs', async () => {
    const res = await http.put('/api/users/me/preferences', {
      email: false,
      push: true,
      budgetAlerts: false,
    }, { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.data.notificationPrefs.email).toBe(false);
    expect(res.data.data.notificationPrefs.budgetAlerts).toBe(false);
  });

  it('GET /api/users/:id returns public profile only', async () => {
    const meRes = await http.get('/api/users/me', { headers: userHeaders() });
    const userId = meRes.data.data.id;

    const res = await http.get(`/api/users/${userId}`, { headers: userHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty('id');
    expect(res.data.data).toHaveProperty('displayName');
    expect(res.data.data).toHaveProperty('avatarUrl');
    // should NOT expose private fields
    expect(res.data.data).not.toHaveProperty('locale');
    expect(res.data.data).not.toHaveProperty('defaultCurrency');
    expect(res.data.data).not.toHaveProperty('notificationPrefs');
  });
});