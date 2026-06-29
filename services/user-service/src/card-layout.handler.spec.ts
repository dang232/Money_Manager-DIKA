// ponytail: integration tests for CardLayout handlers
import { CardLayout } from './domain/aggregates/card-layout.aggregate';
import { GetCardLayoutHandler } from './application/handlers/get-card-layout.handler';
import { UpdateCardLayoutHandler } from './application/handlers/update-card-layout.handler';
import { GetCardLayoutQuery } from './application/queries/get-card-layout.query';
import { UpdateCardLayoutCommand } from './application/commands/update-card-layout.command';

// Mock repository
const mockRepo = {
  findByUserId: jest.fn(),
  save: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CardLayout Handlers', () => {
  let getHandler: GetCardLayoutHandler;
  let updateHandler: UpdateCardLayoutHandler;
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    getHandler = new GetCardLayoutHandler(mockRepo as any);
    updateHandler = new UpdateCardLayoutHandler(mockRepo as any);
  });

  describe('GetCardLayoutHandler', () => {
    it('should return existing layout for user', async () => {
      const existingLayout = CardLayout.create(testUserId);
      existingLayout.updateLayout({ categories: ['cat-1', 'cat-2'], budgets: ['bud-1'] });
      mockRepo.findByUserId.mockResolvedValue(existingLayout);

      const result = await getHandler.execute(new GetCardLayoutQuery(testUserId));

      expect(result.userId).toBe(testUserId);
      expect(result.layout.categories).toEqual(['cat-1', 'cat-2']);
    });

    it('should create default layout for new user', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.save.mockImplementation((layout: CardLayout) => Promise.resolve(layout));

      const result = await getHandler.execute(new GetCardLayoutQuery(testUserId));

      expect(result.userId).toBe(testUserId);
      expect(result.layout.categories).toEqual([]);
      expect(result.layout.budgets).toEqual([]);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('UpdateCardLayoutHandler', () => {
    it('should update layout with new order', async () => {
      const existingLayout = CardLayout.create(testUserId);
      mockRepo.findByUserId.mockResolvedValue(existingLayout);
      // Save should return the modified layout
      mockRepo.save.mockImplementation((layout: CardLayout) => Promise.resolve(layout));

      const newLayout = { categories: ['cat-3', 'cat-1', 'cat-2'], budgets: [] };
      // Use a timestamp far in the future to ensure it passes the timestamp check
      const futureTimestamp = existingLayout.updatedAt.getTime() + 100000;
      const result = await updateHandler.execute(
        new UpdateCardLayoutCommand(testUserId, newLayout, 1, futureTimestamp),
      );

      expect(result.layout.categories).toEqual(['cat-3', 'cat-1', 'cat-2']);
      expect(result.version).toBe(2);
    });

    it('should use server version when client is stale', async () => {
      const existingLayout = CardLayout.create(testUserId);
      existingLayout.updateLayout({ categories: ['server-order'], budgets: [] });
      mockRepo.findByUserId.mockResolvedValue(existingLayout);

      // Client timestamp is older than server
      const oldTimestamp = existingLayout.updatedAt.getTime() - 10000;
      const result = await updateHandler.execute(
        new UpdateCardLayoutCommand(testUserId, { categories: ['client-order'], budgets: [] }, 1, oldTimestamp),
      );

      // Server version wins
      expect(result.layout.categories).toEqual(['server-order']);
    });
  });
});