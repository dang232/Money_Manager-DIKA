// ponytail: BudgetProjectionService — velocity and overage projection for budgets
import { BudgetPeriod } from '@money-manager/shared-kernel';
import { Budget } from '../aggregates/budget.aggregate';

export class BudgetProjectionService {
  calculateVelocity(budget: Budget, period: BudgetPeriod): number {
    const daysElapsed = this.daysElapsedInPeriod(period);
    if (daysElapsed === 0) return 0;
    return budget.runningTotal.amount / daysElapsed;
  }

  projectedOverageDate(budget: Budget, period: BudgetPeriod): Date | null {
    const days = this.daysUntilExceeded(budget, period);
    if (days === null) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  daysUntilExceeded(budget: Budget, period: BudgetPeriod): number | null {
    const dailyRate = this.calculateVelocity(budget, period);
    if (dailyRate <= 0) return null;

    const remaining = budget.monthlyLimit.amount - budget.runningTotal.amount;
    if (remaining <= 0) return 0;

    return Math.ceil(remaining / dailyRate);
  }

  private daysElapsedInPeriod(period: BudgetPeriod): number {
    const now = new Date();
    const periodStart = new Date(period.year, period.month - 1, 1);
    const diffMs = now.getTime() - periodStart.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  }
}
