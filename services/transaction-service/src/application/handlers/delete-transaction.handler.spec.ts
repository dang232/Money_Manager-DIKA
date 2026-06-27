// ponytail: unit tests for DeleteTransactionHandler
import { DeleteTransactionHandler } from './delete-transaction.handler';
import { DeleteTransactionCommand } from '../commands/delete-transaction.command';
import { TransactionType, NotFoundException } from '@money-manager/shared-kernel';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';

describe('DeleteTransactionHandler', () => {
  let handler: DeleteTransactionHandler;
  let mockRepo: { save: jest.Mock; findById: jest.Mock; delete: jest.Mock; findByUserId: jest.Mock; findByPeriod: jest.Mock; getMonthlySummary: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn(),
      findByPeriod: jest.fn(),
      getMonthlySummary: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    handler = new DeleteTransactionHandler(mockRepo as any, mockEventBus as any);
  });

  it('deletes the transaction and publishes transaction.events', async () => {
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

    await handler.execute(new DeleteTransactionCommand('tx-1', 'user-1'));

    expect(mockRepo.delete).toHaveBeenCalledWith('tx-1');
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'transaction.events',
      expect.objectContaining({ eventType: 'transaction.deleted' }),
    );
  });

  it('throws NotFoundException and skips publish when transaction does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(new DeleteTransactionCommand('missing', 'user-1'))).rejects.toThrow(NotFoundException);
    expect(mockRepo.delete).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});