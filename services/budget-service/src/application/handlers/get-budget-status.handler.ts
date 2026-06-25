// ponytail: handler for GetBudgetStatusQuery
import { Injectable, Inject } from '@nestjs/common';
import { BudgetPeriod } from '@money-manager/shared-kernel';
import { GetBudgetStatusQuery } from '../queries/get-budget-status.query';
import { BudgetRepository, BUDGET_REPOSITORY } from '../../domain/repositories/budget.repository.port';

export interface BudgetStatusDto {
  budgetId: string;
  categoryId: string;
  monthlyLimit: number;
  currency: string;
  runningTotal: number;
  usagePercentage: number;
  isExceeded: boolean;
}

@Injectable()
export class GetBudgetStatusHandler {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
  ) {}

  async execute(query: GetBudgetStatusQuery): Promise<BudgetStatusDto[]> {
    const period = new BudgetPeriod(query.year, query.month);
    const budgets = await this.budgetRepo.findByUserAndPeriod(query.userId, period);

    return budgets.map((b) => ({
      budgetId: b.id,
      categoryId: b.categoryId,
      monthlyLimit: b.monthlyLimit.amount,
      currency: b.monthlyLimit.currency,
      runningTotal: b.runningTotal.amount,
      usagePercentage: b.usagePercentage(),
      isExceeded: b.isExceeded(),
    }));
  }
}
