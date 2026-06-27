// ponytail: Budget aggregate — monthly spending limit per category
import { UserId, Money, BudgetPeriod, DomainException, generateUuid, INVALID_BUDGET_LIMIT } from '@money-manager/shared-kernel';

export interface CreateBudgetProps {
  userId: UserId;
  categoryId: string;
  monthlyLimit: Money;
  period: BudgetPeriod;
}

export class Budget {
  readonly id: string;
  readonly userId: UserId;
  readonly categoryId: string;
  monthlyLimit: Money;
  readonly period: BudgetPeriod;
  runningTotal: Money;
  readonly createdAt: Date;

  private constructor(id: string, userId: UserId, categoryId: string, monthlyLimit: Money, period: BudgetPeriod, runningTotal: Money, createdAt: Date) {
    this.id = id;
    this.userId = userId;
    this.categoryId = categoryId;
    this.monthlyLimit = monthlyLimit;
    this.period = period;
    this.runningTotal = runningTotal;
    this.createdAt = createdAt;
  }

  static create(props: CreateBudgetProps): Budget {
    Budget.validateLimit(props.monthlyLimit);
    const runningTotal = new Money(0, props.monthlyLimit.currency);
    return new Budget(generateUuid(), props.userId, props.categoryId, props.monthlyLimit, props.period, runningTotal, new Date());
  }

  static reconstitute(id: string, userId: UserId, categoryId: string, monthlyLimit: Money, period: BudgetPeriod, runningTotal: Money, createdAt: Date): Budget {
    return new Budget(id, userId, categoryId, monthlyLimit, period, runningTotal, createdAt);
  }

  addSpending(amount: Money): boolean {
    this.runningTotal = this.runningTotal.add(amount);
    return this.isExceeded();
  }

  removeSpending(amount: Money): void {
    const result = this.runningTotal.amount - amount.amount;
    this.runningTotal = new Money(Math.max(0, result), this.runningTotal.currency);
  }

  isExceeded(): boolean {
    return this.runningTotal.amount > this.monthlyLimit.amount;
  }

  usagePercentage(): number {
    if (this.monthlyLimit.amount === 0) return 0;
    return (this.runningTotal.amount / this.monthlyLimit.amount) * 100;
  }

  private static validateLimit(limit: Money): void {
    if (limit.amount <= 0) {
      throw DomainException.fromError(INVALID_BUDGET_LIMIT);
    }
  }
}
