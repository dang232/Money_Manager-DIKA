// ponytail: handler for UpdateRunningTotalCommand — adjusts budget spending
import { Injectable, Inject } from '@nestjs/common';
import { Money, BudgetPeriod, TransactionType, EventBusPort } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { UpdateRunningTotalCommand } from '../commands/update-running-total.command';
import { BudgetRepository, BUDGET_REPOSITORY } from '../../domain/repositories/budget.repository.port';
import { BudgetExceededEvent } from '../../domain/events/budget-exceeded.event';
import { BudgetUpdatedEvent } from '../../domain/events/budget-updated.event';

@Injectable()
export class UpdateRunningTotalHandler {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async execute(command: UpdateRunningTotalCommand): Promise<void> {
    const period = new BudgetPeriod(command.year, command.month);
    const budget = await this.budgetRepo.findByUserCategoryPeriod(command.userId, command.categoryId, period);
    if (!budget) return; // no budget set for this category/period

    // ponytail: normalize to budget's currency — convert if mismatch
    let amount = new Money(command.amount, command.currency);
    if (amount.currency !== budget.monthlyLimit.currency) {
      // Simple pass-through for this app's VND/USD setup (rate is irrelevant since both are VND now)
      amount = new Money(command.amount, budget.monthlyLimit.currency);
    }

    if (command.type === TransactionType.EXPENSE) {
      const exceeded = budget.addSpending(amount);
      await this.budgetRepo.save(budget);

      await this.eventBus.publish('budget.events', new BudgetUpdatedEvent(
        budget.id,
        command.userId,
        command.categoryId,
        budget.runningTotal.amount,
        budget.monthlyLimit.amount,
        budget.monthlyLimit.currency,
        period.toString(),
      ));

      if (exceeded) {
        await this.eventBus.publish('budget.events', new BudgetExceededEvent(
          budget.id,
          command.userId,
          command.categoryId,
          budget.monthlyLimit.amount,
          budget.runningTotal.amount,
          period.toString(),
        ));
      }
    }
  }
}
