// ponytail: wraps EventBusPort for transaction-specific event publishing
import { Injectable, Inject } from '@nestjs/common';
import { EventBusPort } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/infrastructure';
import { TransactionCreatedEvent } from '../../domain/events/transaction-created.event';
import { TransactionUpdatedEvent } from '../../domain/events/transaction-updated.event';
import { TransactionDeletedEvent } from '../../domain/events/transaction-deleted.event';

export const TRANSACTION_EVENTS_TOPIC = 'transaction.events';

@Injectable()
export class TransactionEventPublisher {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async publishCreated(event: TransactionCreatedEvent): Promise<void> {
    await this.eventBus.publish(TRANSACTION_EVENTS_TOPIC, event);
  }

  async publishUpdated(event: TransactionUpdatedEvent): Promise<void> {
    await this.eventBus.publish(TRANSACTION_EVENTS_TOPIC, event);
  }

  async publishDeleted(event: TransactionDeletedEvent): Promise<void> {
    await this.eventBus.publish(TRANSACTION_EVENTS_TOPIC, event);
  }
}
