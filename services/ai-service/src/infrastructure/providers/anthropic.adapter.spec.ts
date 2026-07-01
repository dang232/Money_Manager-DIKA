import { AnthropicAdapter } from './anthropic.adapter';
import { ConfigType } from '@nestjs/config';
import { TransactionType } from '@money-manager/shared-kernel';
import { aiConfig } from '../../config/ai.config';
import { CategoryInfo } from '../../domain/interfaces/ai-provider.port';

describe('AnthropicAdapter', () => {
  const mockConfig: ConfigType<typeof aiConfig> = {
    providerType: 'anthropic',
    apiKey: 'test-key',
    apiBaseUrl: 'https://api.anthropic.com/api/claude/web',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 200,
    timeoutMs: 5000,
    confidenceThreshold: 0.7,
    budgetServiceUrl: 'http://localhost:3002',
  };

  const mockCategories: CategoryInfo[] = [
    { id: 'cat1', name: 'Food & Dining', type: TransactionType.EXPENSE },
    { id: 'cat2', name: 'Transportation', type: TransactionType.EXPENSE },
    { id: 'cat3', name: 'Entertainment', type: TransactionType.EXPENSE },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('suggestCategory', () => {
    it('should return suggestion from valid API response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: '{"categoryId":"cat1","categoryName":"Food & Dining","confidence":0.9,"reasoning":"coffee shop"}' }],
        }),
      });
      global.fetch = mockFetch;

      const adapter = new AnthropicAdapter(mockConfig);
      const result = await adapter.suggestCategory('Starbucks coffee', mockCategories);

      expect(result.categoryId).toBe('cat1');
      expect(result.confidence).toBe(0.9);
    });

    it('should return fallback on API error', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch;

      const adapter = new AnthropicAdapter(mockConfig);
      const result = await adapter.suggestCategory('Test', mockCategories);

      expect(result.categoryId).toBe('cat1');
      expect(result.confidence).toBe(0.3);
      expect(result.reasoning).toBe('fallback');
    });

    it('should return fallback on parse error', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: 'invalid json' }],
        }),
      });
      global.fetch = mockFetch;

      const adapter = new AnthropicAdapter(mockConfig);
      const result = await adapter.suggestCategory('Test', mockCategories);

      expect(result.confidence).toBe(0.3);
    });

    it('should include Money Manager prompt in request', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: '{"categoryId":"cat1","categoryName":"Test","confidence":0.9,"reasoning":"test"}' }],
        }),
      });
      global.fetch = mockFetch;

      const adapter = new AnthropicAdapter(mockConfig);
      await adapter.suggestCategory('Netflix subscription', mockCategories);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain('Money Manager app');
      expect(callBody.messages[0].content).toContain('Food & Dining');
      expect(callBody.messages[0].content).toContain('Netflix subscription');
    });
  });
});
