// ponytail: consumes transaction.created events → updates budget running total
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { EventBusPort, DomainEvent, TransactionType } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { UpdateRunningTotalHandler } from '../handlers/update-running-total.handler';
import { UpdateRunningTotalCommand } from '../commands/update-running-total.command';

const TRANSACTION_EVENTS_TOPIC = 'transaction.events';

@Injectable()
export class TransactionCreatedConsumer implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly handler: UpdateRunningTotalHandler,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventBus.subscribe(TRANSACTION_EVENTS_TOPIC, 'budget-service-created', async (event: DomainEvent) => {
      if (event.eventType !== 'transaction.created') return;

      // Extract properties from event directly (not from payload)
      const userId = (event as any).userId;
      const categoryId = (event as any).categoryId;
      const amount = (event as any).amount;
      const currency = (event as any).currency;
      const type = (event as any).type;
      const date = (event as any).date;

      if (!userId || !categoryId) return;

      const txDate = new Date(date);
      await this.handler.execute(new UpdateRunningTotalCommand(
        userId,
        categoryId,
        amount,
        currency,
        type,
        txDate.getFullYear(),
        txDate.getMonth() + 1,
      ));
    });
  }
}
