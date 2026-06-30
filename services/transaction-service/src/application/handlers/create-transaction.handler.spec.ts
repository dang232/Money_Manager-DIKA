// Unit tests for CreateTransactionHandler
import { CreateTransactionHandler } from './create-transaction.handler';
import { CreateTransactionCommand } from '../commands/create-transaction.command';
import { TransactionType } from '@money-manager/shared-kernel';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';

// Test user ID - valid UUID for testing
const TEST_USER_ID = '11111111-1111-4111-a111-111111111111';

describe('CreateTransactionHandler', () => {
  let handler: CreateTransactionHandler;
  let mockRepo: { save: jest.Mock; findById: jest.Mock; delete: jest.Mock; findByUserId: jest.Mock; findByPeriod: jest.Mock; getMonthlySummary: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn().mockImplementation((t: Transaction) => Promise.resolve(t)),
      findById: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      findByPeriod: jest.fn(),
      getMonthlySummary: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CreateTransactionHandler(mockRepo as any, mockEventBus as any);
  });

  it('should create a transaction and publish event', async () => {
    const cmd = new CreateTransactionCommand(
      TEST_USER_ID,
      50000,
      'VND',
      TransactionType.EXPENSE,
      '11111111-1111-4111-b111-111111111111',
      'Test transaction',
      new Date('2024-06-01'),
    );

    const result = await handler.execute(cmd);

    expect(result).toBeDefined();
    expect(result.amount).toBe(50000);
    expect(result.type).toBe(TransactionType.EXPENSE);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'transaction.events',
      expect.objectContaining({ eventType: 'transaction.created' }),
    );
  });

  it('should propagate domain validation errors', async () => {
    const cmd = new CreateTransactionCommand(
      TEST_USER_ID,
      0, // invalid amount
      'VND',
      TransactionType.EXPENSE,
      '11111111-1111-4111-b111-111111111111',
      'Test',
      new Date('2024-06-01'),
    );

    await expect(handler.execute(cmd)).rejects.toThrow('amount must be greater than 0');
  });
});
