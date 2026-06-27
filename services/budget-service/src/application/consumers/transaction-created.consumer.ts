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
      const payload = event as unknown as {
        userId: string;
        categoryId: string;
        amount: number;
        currency: string;
        type: TransactionType;
        date: string;
      };

      const txDate = new Date(payload.date);
      await this.handler.execute(new UpdateRunningTotalCommand(
        payload.userId,
        payload.categoryId,
        payload.amount,
        payload.currency,
        payload.type,
        txDate.getFullYear(),
        txDate.getMonth() + 1,
      ));
    });
  }
}
