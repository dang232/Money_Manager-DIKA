// ponytail: Budget repository port — persistence contract
import { RepositoryPort, BudgetPeriod } from '@money-manager/shared-kernel';
import { Budget } from '../aggregates/budget.aggregate';

export const BUDGET_REPOSITORY = 'BUDGET_REPOSITORY';

export interface BudgetRepository extends RepositoryPort<Budget> {
  findByUserAndPeriod(userId: string, period: BudgetPeriod): Promise<Budget[]>;
  findByUserCategoryPeriod(userId: string, categoryId: string, period: BudgetPeriod): Promise<Budget | null>;
}
