// ponytail: unit tests for UpdateRunningTotalHandler
import { UpdateRunningTotalHandler } from './update-running-total.handler';
import { UpdateRunningTotalCommand } from '../commands/update-running-total.command';
import { TransactionType, UserId, Money, BudgetPeriod, Budget } from '@money-manager/shared-kernel';

describe('UpdateRunningTotalHandler', () => {
  let handler: UpdateRunningTotalHandler;
  let mockBudgetRepo: { findByUserCategoryPeriod: jest.Mock; save: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockBudgetRepo = {
      findByUserCategoryPeriod: jest.fn(),
      save: jest.fn().mockImplementation((b: Budget) => Promise.resolve(b)),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    handler = new UpdateRunningTotalHandler(mockBudgetRepo as any, mockEventBus as any);
  });

  it('publishes BudgetExceededEvent when expense pushes budget over limit', async () => {
    const budget = Budget.create({
      userId: new UserId('user-1'),
      categoryId: 'cat-1',
      monthlyLimit: new Money(1000, 'VND'),
      period: new BudgetPeriod(2026, 6),
    });
    budget.addSpending(new Money(900, 'VND')); // 90% used
    mockBudgetRepo.findByUserCategoryPeriod.mockResolvedValue(budget);

    await handler.execute(new UpdateRunningTotalCommand(
      'user-1', 'cat-1', 200, 'VND', TransactionType.EXPENSE, 2026, 6,
    ));

    expect(mockBudgetRepo.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'budget.events',
      expect.objectContaining({ eventType: 'budget.exceeded' }),
    );
  });

  it('does NOT publish when expense stays under the limit', async () => {
    const budget = Budget.create({
      userId: new UserId('user-1'),
      categoryId: 'cat-1',
      monthlyLimit: new Money(1000, 'VND'),
      period: new BudgetPeriod(2026, 6),
    });
    mockBudgetRepo.findByUserCategoryPeriod.mockResolvedValue(budget);

    await handler.execute(new UpdateRunningTotalCommand(
      'user-1', 'cat-1', 100, 'VND', TransactionType.EXPENSE, 2026, 6,
    ));

    expect(mockBudgetRepo.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('does nothing when no budget exists for the user/category/period', async () => {
    mockBudgetRepo.findByUserCategoryPeriod.mockResolvedValue(null);

    await handler.execute(new UpdateRunningTotalCommand(
      'user-1', 'cat-1', 100, 'VND', TransactionType.EXPENSE, 2026, 6,
    ));

    expect(mockBudgetRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ignores income transactions (does not adjust spending or publish)', async () => {
    const budget = Budget.create({
      userId: new UserId('user-1'),
      categoryId: 'cat-1',
      monthlyLimit: new Money(1000, 'VND'),
      period: new BudgetPeriod(2026, 6),
    });
    mockBudgetRepo.findByUserCategoryPeriod.mockResolvedValue(budget);

    await handler.execute(new UpdateRunningTotalCommand(
      'user-1', 'cat-1', 500, 'VND', 2026, 6, TransactionType.INCOME,
    ));

    expect(mockBudgetRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});