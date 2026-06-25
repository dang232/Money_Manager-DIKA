// ponytail: unit tests for Budget aggregate
import { Money, BudgetPeriod, UserId } from '@money-manager/shared-kernel';
import { Budget } from './budget.aggregate';

describe('Budget', () => {
  const validProps = () => ({
    userId: new UserId('user-1'),
    categoryId: 'cat-1',
    monthlyLimit: new Money(1000000, 'VND'),
    period: new BudgetPeriod(2025, 6),
  });

  it('creates with valid props and runningTotal at 0', () => {
    const budget = Budget.create(validProps());
    expect(budget.id).toBeDefined();
    expect(budget.runningTotal.amount).toBe(0);
    expect(budget.monthlyLimit.amount).toBe(1000000);
    expect(budget.isExceeded()).toBe(false);
  });

  it('throws when limit is 0', () => {
    expect(() =>
      Budget.create({ ...validProps(), monthlyLimit: new Money(0, 'VND') }),
    ).toThrow('Monthly limit must be greater than 0');
  });

  it('addSpending updates running total', () => {
    const budget = Budget.create(validProps());
    budget.addSpending(new Money(500000, 'VND'));
    expect(budget.runningTotal.amount).toBe(500000);
  });

  it('isExceeded returns true when over limit', () => {
    const budget = Budget.create(validProps());
    budget.addSpending(new Money(1000001, 'VND'));
    expect(budget.isExceeded()).toBe(true);
  });

  it('removeSpending decreases running total (min 0)', () => {
    const budget = Budget.create(validProps());
    budget.addSpending(new Money(300000, 'VND'));
    budget.removeSpending(new Money(500000, 'VND'));
    expect(budget.runningTotal.amount).toBe(0);
  });

  it('usagePercentage returns correct value', () => {
    const budget = Budget.create(validProps());
    budget.addSpending(new Money(250000, 'VND'));
    expect(budget.usagePercentage()).toBe(25);
  });
});
