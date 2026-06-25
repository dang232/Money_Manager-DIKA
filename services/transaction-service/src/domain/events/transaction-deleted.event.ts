// ponytail: domain event emitted when a transaction is deleted
import { DomainEvent, TransactionType, createEventMeta } from '@money-manager/shared-kernel';

export class TransactionDeletedEvent implements DomainEvent {
  readonly eventType = 'transaction.deleted';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly type: TransactionType,
  ) {
    const meta = createEventMeta(transactionId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}
