// ponytail: handler for GetBudgetProjectionsQuery
import { Injectable, Inject } from '@nestjs/common';
import { BudgetPeriod } from '@money-manager/shared-kernel';
import { GetBudgetProjectionsQuery } from '../queries/get-budget-projections.query';
import { BudgetRepository, BUDGET_REPOSITORY } from '../../domain/repositories/budget.repository.port';
import { BudgetProjectionService } from '../../domain/services/budget-projection.service';

export interface BudgetProjectionDto {
  budgetId: string;
  categoryId: string;
  dailyVelocity: number;
  projectedOverageDate: string | null;
  daysUntilExceeded: number | null;
}

@Injectable()
export class GetBudgetProjectionsHandler {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
    private readonly projectionService: BudgetProjectionService,
  ) {}

  async execute(query: GetBudgetProjectionsQuery): Promise<BudgetProjectionDto[]> {
    const period = new BudgetPeriod(query.year, query.month);
    const budgets = await this.budgetRepo.findByUserAndPeriod(query.userId, period);

    return budgets.map((b) => {
      const overageDate = this.projectionService.projectedOverageDate(b, period);
      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        dailyVelocity: this.projectionService.calculateVelocity(b, period),
        projectedOverageDate: overageDate ? overageDate.toISOString() : null,
        daysUntilExceeded: this.projectionService.daysUntilExceeded(b, period),
      };
    });
  }
}
