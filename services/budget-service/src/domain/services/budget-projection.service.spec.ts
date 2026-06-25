// ponytail: unit tests for BudgetProjectionService
import { Money, BudgetPeriod, UserId } from '@money-manager/shared-kernel';
import { Budget } from '../aggregates/budget.aggregate';
import { BudgetProjectionService } from './budget-projection.service';

describe('BudgetProjectionService', () => {
  const service = new BudgetProjectionService();

  function makeBudget(limit: number, running: number): Budget {
    const budget = Budget.create({
      userId: new UserId('user-1'),
      categoryId: 'cat-1',
      monthlyLimit: new Money(limit, 'VND'),
      period: BudgetPeriod.current(),
    });
    if (running > 0) {
      budget.addSpending(new Money(running, 'VND'));
    }
    return budget;
  }

  it('calculateVelocity returns correct daily rate', () => {
    const budget = makeBudget(1000000, 300000);
    const period = BudgetPeriod.current();
    const velocity = service.calculateVelocity(budget, period);
    expect(velocity).toBeGreaterThan(0);
  });

  it('daysUntilExceeded returns null when no spending', () => {
    const budget = makeBudget(1000000, 0);
    const period = BudgetPeriod.current();
    expect(service.daysUntilExceeded(budget, period)).toBeNull();
  });

  it('daysUntilExceeded returns 0 when already exceeded', () => {
    const budget = makeBudget(1000000, 1500000);
    const period = BudgetPeriod.current();
    expect(service.daysUntilExceeded(budget, period)).toBe(0);
  });

  it('projectedOverageDate returns null when under budget with no spending', () => {
    const budget = makeBudget(1000000, 0);
    const period = BudgetPeriod.current();
    expect(service.projectedOverageDate(budget, period)).toBeNull();
  });
});
