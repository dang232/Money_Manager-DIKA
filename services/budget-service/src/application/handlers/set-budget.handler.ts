// ponytail: handler for SetBudgetCommand — creates or updates a budget
import { Injectable, Inject } from '@nestjs/common';
import { UserId, Money, BudgetPeriod, EventBusPort } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { SetBudgetCommand } from '../commands/set-budget.command';
import { Budget } from '../../domain/aggregates/budget.aggregate';
import { BudgetRepository, BUDGET_REPOSITORY } from '../../domain/repositories/budget.repository.port';
import { BudgetCreatedEvent } from '../../domain/events/budget-created.event';

@Injectable()
export class SetBudgetHandler {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async execute(command: SetBudgetCommand): Promise<Budget> {
    const period = new BudgetPeriod(command.year, command.month);
    const existing = await this.budgetRepo.findByUserCategoryPeriod(command.userId, command.categoryId, period);

    if (existing) {
      existing.monthlyLimit = new Money(command.monthlyLimit, command.currency);
      return this.budgetRepo.save(existing);
    }

    const budget = Budget.create({
      userId: new UserId(command.userId),
      categoryId: command.categoryId,
      monthlyLimit: new Money(command.monthlyLimit, command.currency),
      period,
    });

    const saved = await this.budgetRepo.save(budget);
    await this.eventBus.publish('budget.events', new BudgetCreatedEvent(saved.id, saved.categoryId, saved.monthlyLimit.amount, period.toString()));
    return saved;
  }
}
