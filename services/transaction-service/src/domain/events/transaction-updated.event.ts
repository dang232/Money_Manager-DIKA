// ponytail: domain event emitted when a transaction is updated
import { DomainEvent, createEventMeta } from '@money-manager/shared-kernel';

export class TransactionUpdatedEvent implements DomainEvent {
  readonly eventType = 'transaction.updated';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly changes: Record<string, unknown>,
  ) {
    const meta = createEventMeta(transactionId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}
