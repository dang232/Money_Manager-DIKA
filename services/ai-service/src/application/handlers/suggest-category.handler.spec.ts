import { SuggestCategoryHandler } from './suggest-category.handler';
import { SuggestCategoryCommand } from '../commands/suggest-category.command';
import { AiProviderPort } from '../../domain/interfaces/ai-provider.port';
import { EventBusPort, TransactionType } from '@money-manager/shared-kernel';
import { ConfigType } from '@nestjs/config';
import { aiConfig } from '../../config/ai.config';

describe('SuggestCategoryHandler', () => {
  const mockConfig: ConfigType<typeof aiConfig> = {
    providerType: 'anthropic',
    apiKey: 'key',
    apiBaseUrl: 'url',
    modelName: 'model',
    maxTokens: 200,
    timeoutMs: 5000,
    confidenceThreshold: 0.7,
    budgetServiceUrl: 'http://localhost:3002',
  };

  const mockCategories = [
    { id: 'cat1', name: 'Food', type: TransactionType.EXPENSE },
  ];

  const createMockEventBus = () => ({
    publish: jest.fn(),
  });

  const createMockProvider = (suggestion: any) => ({
    suggestCategory: jest.fn().mockResolvedValue(suggestion),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should publish event when confidence exceeds threshold', async () => {
    const mockEventBus = createMockEventBus();
    const mockProvider = createMockProvider({
      categoryId: 'cat1',
      categoryName: 'Food',
      confidence: 0.9,
      reasoning: 'coffee',
    });

    const handler = new SuggestCategoryHandler(
      mockProvider as unknown as AiProviderPort,
      mockEventBus as unknown as EventBusPort,
      mockConfig,
    );

    const cmd = new SuggestCategoryCommand('tx1', 'Starbucks', 'user1', mockCategories);
    const result = await handler.execute(cmd);

    expect(result.confidence).toBe(0.9);
    expect(mockEventBus.publish).toHaveBeenCalledWith('ai.category.suggested', expect.objectContaining({
      eventType: 'ai.category.suggested',
      payload: expect.objectContaining({
        transactionId: 'tx1',
        categoryId: 'cat1',
        confidence: 0.9,
      }),
    }));
  });

  it('should not publish event when confidence is below threshold', async () => {
    const mockEventBus = createMockEventBus();
    const mockProvider = createMockProvider({
      categoryId: 'cat1',
      categoryName: 'Food',
      confidence: 0.5,
      reasoning: 'uncertain',
    });

    const handler = new SuggestCategoryHandler(
      mockProvider as unknown as AiProviderPort,
      mockEventBus as unknown as EventBusPort,
      mockConfig,
    );

    const cmd = new SuggestCategoryCommand('tx1', 'Test', 'user1', mockCategories);
    const result = await handler.execute(cmd);

    expect(result.confidence).toBe(0.5);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should use config threshold', async () => {
    const mockEventBus = createMockEventBus();
    const customConfig = { ...mockConfig, confidenceThreshold: 0.5 };
    const mockProvider = createMockProvider({
      categoryId: 'cat1',
      categoryName: 'Food',
      confidence: 0.6,
      reasoning: 'maybe',
    });

    const handler = new SuggestCategoryHandler(
      mockProvider as unknown as AiProviderPort,
      mockEventBus as unknown as EventBusPort,
      customConfig,
    );

    const cmd = new SuggestCategoryCommand('tx1', 'Test', 'user1', mockCategories);
    await handler.execute(cmd);

    // With threshold 0.5, confidence 0.6 should publish
    expect(mockEventBus.publish).toHaveBeenCalled();
  });
});
