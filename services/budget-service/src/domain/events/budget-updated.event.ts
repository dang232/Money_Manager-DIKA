// ponytail: domain event emitted when a budget's running total is updated
import { DomainEvent, createEventMeta } from '@money-manager/shared-kernel';

export class BudgetUpdatedEvent implements DomainEvent {
  readonly eventType = 'budget.updated';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly budgetId: string,
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly runningTotal: number,
    public readonly monthlyLimit: number,
    public readonly currency: string,
    public readonly period: string,
  ) {
    const meta = createEventMeta(budgetId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}
