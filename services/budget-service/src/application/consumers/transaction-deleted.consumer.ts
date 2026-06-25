// ponytail: consumes transaction.deleted events → removes spending from budget
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { EventBusPort, DomainEvent, TransactionType, BudgetPeriod, Money } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/infrastructure';
import { BudgetRepository, BUDGET_REPOSITORY } from '../../domain/repositories/budget.repository.port';

const TRANSACTION_EVENTS_TOPIC = 'transaction.events';

@Injectable()
export class TransactionDeletedConsumer implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepo: BudgetRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventBus.subscribe(TRANSACTION_EVENTS_TOPIC, 'budget-service-deleted', async (event: DomainEvent) => {
      if (event.eventType !== 'transaction.deleted') return;
      const payload = event as unknown as {
        userId: string;
        categoryId: string;
        amount: number;
        currency: string;
        type: TransactionType;
      };

      if (payload.type !== TransactionType.EXPENSE) return;

      // Use current period since deleted events don't carry date
      const now = new Date();
      const period = new BudgetPeriod(now.getFullYear(), now.getMonth() + 1);
      const budget = await this.budgetRepo.findByUserCategoryPeriod(payload.userId, payload.categoryId, period);
      if (!budget) return;

      budget.removeSpending(new Money(payload.amount, payload.currency));
      await this.budgetRepo.save(budget);
    });
  }
}
