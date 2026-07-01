// ponytail: handler for DeleteBudgetCommand
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BudgetPeriod } from '@money-manager/shared-kernel';
import { DeleteBudgetCommand } from '../commands/delete-budget.command';
import { BudgetRepository, BUDGET_REPOSITORY } from '../../domain/repositories/budget.repository.port';

@Injectable()
export class DeleteBudgetHandler {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
  ) {}

  async execute(command: DeleteBudgetCommand): Promise<void> {
    const now = new Date();
    const year = command.year ?? now.getFullYear();
    const month = command.month ?? now.getMonth() + 1;
    const period = new BudgetPeriod(year, month);
    const budget = await this.budgetRepo.findByUserCategoryPeriod(command.userId, command.categoryId, period);
    if (!budget) {
      throw new NotFoundException(`Budget for category ${command.categoryId} not found`);
    }
    await this.budgetRepo.delete(budget.id);
  }
}
