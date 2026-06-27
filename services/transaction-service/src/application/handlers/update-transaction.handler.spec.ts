// ponytail: unit tests for UpdateTransactionHandler
import { UpdateTransactionHandler } from './update-transaction.handler';
import { UpdateTransactionCommand } from '../commands/update-transaction.command';
import { TransactionType, NotFoundException } from '@money-manager/shared-kernel';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';

describe('UpdateTransactionHandler', () => {
  let handler: UpdateTransactionHandler;
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
    handler = new UpdateTransactionHandler(mockRepo as any, mockEventBus as any);
  });

  it('updates the transaction and publishes transaction.events', async () => {
    const existing = Transaction.reconstitute({
      id: 'tx-1',
      userId: 'user-1',
      amount: 50000,
      currency: 'VND',
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      description: 'Old',
      date: new Date('2024-06-01'),
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
    });
    mockRepo.findById.mockResolvedValue(existing);

    const cmd = new UpdateTransactionCommand('tx-1', { amount: 75000, description: 'New' });
    await handler.execute(cmd);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'transaction.events',
      expect.objectContaining({ eventType: 'transaction.updated' }),
    );
  });

  it('throws NotFoundException when transaction does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    const cmd = new UpdateTransactionCommand('missing-id', { amount: 100 });

    await expect(handler.execute(cmd)).rejects.toThrow(NotFoundException);
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('propagates domain validation errors when amount is invalid', async () => {
    const existing = Transaction.reconstitute({
      id: 'tx-1',
      userId: 'user-1',
      amount: 50000,
      currency: 'VND',
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      description: 'Old',
      date: new Date('2024-06-01'),
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
    });
    mockRepo.findById.mockResolvedValue(existing);

    const cmd = new UpdateTransactionCommand('tx-1', { amount: -1 });
    await expect(handler.execute(cmd)).rejects.toThrow();
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});