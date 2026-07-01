import { GroqAdapter } from './groq.adapter';
import { ConfigType } from '@nestjs/config';
import { TransactionType } from '@money-manager/shared-kernel';
import { aiConfig } from '../../config/ai.config';
import { CategoryInfo } from '../../domain/interfaces/ai-provider.port';

describe('GroqAdapter', () => {
  const mockConfig: ConfigType<typeof aiConfig> = {
    providerType: 'groq',
    apiKey: 'test-key',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
    modelName: 'llama-3.1-8b-instant',
    maxTokens: 200,
    timeoutMs: 5000,
    confidenceThreshold: 0.7,
    budgetServiceUrl: 'http://localhost:3002',
  };

  const mockCategories: CategoryInfo[] = [
    { id: 'cat1', name: 'Food', type: TransactionType.EXPENSE },
    { id: 'cat2', name: 'Transport', type: TransactionType.EXPENSE },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return suggestion from valid response', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '{"categoryId":"cat1","categoryName":"Food","confidence":0.9,"reasoning":"coffee"}' } }],
      }),
    });
    global.fetch = mockFetch;

    const adapter = new GroqAdapter(mockConfig);
    const result = await adapter.suggestCategory('Starbucks', mockCategories);

    expect(result.categoryId).toBe('cat1');
    expect(result.confidence).toBe(0.9);
  });

  it('should return fallback on error', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    global.fetch = mockFetch;

    const adapter = new GroqAdapter(mockConfig);
    const result = await adapter.suggestCategory('Test', mockCategories);

    expect(result.confidence).toBe(0.3);
  });
});
