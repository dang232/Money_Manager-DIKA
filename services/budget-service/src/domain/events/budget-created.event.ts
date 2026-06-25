// ponytail: domain event emitted when a budget is created
import { DomainEvent, createEventMeta } from '@money-manager/shared-kernel';

export class BudgetCreatedEvent implements DomainEvent {
  readonly eventType = 'budget.created';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly budgetId: string,
    public readonly categoryId: string,
    public readonly limit: number,
    public readonly period: string,
  ) {
    const meta = createEventMeta(budgetId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}
