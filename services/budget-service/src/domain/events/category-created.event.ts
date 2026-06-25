// ponytail: domain event emitted when a category is created
import { DomainEvent, TransactionType, createEventMeta } from '@money-manager/shared-kernel';

export class CategoryCreatedEvent implements DomainEvent {
  readonly eventType = 'category.created';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly categoryId: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly type: TransactionType,
  ) {
    const meta = createEventMeta(categoryId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}
