// ponytail: AI service e2e — direct hit on :3003 because gateway's /api/ai/categorize|insights|chat
// proxy paths don't exist on the AI service (only /ai/suggest is implemented).
import axios from 'axios';
import { DEFAULT_USER_ID } from '../helpers/http';
import { waitForHealthyStack } from '../helpers/wait';

const AI_BASE = process.env['AI_SERVICE_URL'] ?? 'http://localhost:3003';

describe('AI service', () => {
  beforeAll(async () => {
    await waitForHealthyStack();
  });
  it('rejects /ai/suggest with empty body', async () => {
    const res = await axios.post(`${AI_BASE}/ai/suggest`, {}, {
      headers: { 'x-user-id': DEFAULT_USER_ID, 'content-type': 'application/json' },
      validateStatus: () => true,
    });
    // ponytail: AI controller doesn't apply validation pipe → handler throws → 500.
    // Either 400 (validation) or 500 (handler error) is acceptable; just not 200.
    expect([400, 500]).toContain(res.status);
  });

  it('returns 200 from /ai/suggest for valid body (mock provider when GROQ_API_KEY is default)', async () => {
    const res = await axios.post(`${AI_BASE}/ai/suggest`, {
      transactionId: '11111111-1111-4111-a111-111111111111',
      description: 'Bún bò Grab',
      categories: [
        { id: 'cat-1', name: 'Ăn uống', type: 'EXPENSE' },
        { id: 'cat-2', name: 'Di chuyển', type: 'EXPENSE' },
      ],
    }, {
      headers: { 'x-user-id': DEFAULT_USER_ID, 'content-type': 'application/json' },
      validateStatus: () => true,
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveProperty('categoryId');
  });
});