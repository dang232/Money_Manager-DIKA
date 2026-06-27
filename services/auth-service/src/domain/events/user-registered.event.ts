// ponytail: domain event emitted when a user registers
import { DomainEvent, createEventMeta } from '@money-manager/shared-kernel';

export class UserRegisteredEvent implements DomainEvent {
  readonly eventType = 'user.registered';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    const meta = createEventMeta(userId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}