// ponytail: unit tests for SetBudgetHandler
import { Money, BudgetPeriod, UserId } from '@money-manager/shared-kernel';
import { SetBudgetHandler } from './set-budget.handler';
import { SetBudgetCommand } from '../commands/set-budget.command';
import { Budget } from '../../domain/aggregates/budget.aggregate';

describe('SetBudgetHandler', () => {
  const mockBudgetRepo = {
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findByUserAndPeriod: jest.fn(),
    findByUserCategoryPeriod: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
    subscribe: jest.fn(),
  };

  let handler: SetBudgetHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new SetBudgetHandler(mockBudgetRepo as any, mockEventBus as any);
    mockBudgetRepo.save.mockImplementation((b) => Promise.resolve(b));
  });

  it('creates a new budget when none exists', async () => {
    mockBudgetRepo.findByUserCategoryPeriod.mockResolvedValue(null);

    const command = new SetBudgetCommand('user-1', 'cat-1', 500000, 'VND', 2025, 6);
    const result = await handler.execute(command);

    expect(result.monthlyLimit.amount).toBe(500000);
    expect(result.runningTotal.amount).toBe(0);
    expect(mockEventBus.publish).toHaveBeenCalledWith('budget.events', expect.objectContaining({ eventType: 'budget.created' }));
  });

  it('updates existing budget limit', async () => {
    const existing = Budget.create({
      userId: new UserId('user-1'),
      categoryId: 'cat-1',
      monthlyLimit: new Money(300000, 'VND'),
      period: new BudgetPeriod(2025, 6),
    });
    mockBudgetRepo.findByUserCategoryPeriod.mockResolvedValue(existing);

    const command = new SetBudgetCommand('user-1', 'cat-1', 700000, 'VND', 2025, 6);
    const result = await handler.execute(command);

    expect(result.monthlyLimit.amount).toBe(700000);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
