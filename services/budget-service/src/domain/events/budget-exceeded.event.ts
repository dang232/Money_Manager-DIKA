// ponytail: domain event emitted when a budget is exceeded
import { DomainEvent, createEventMeta } from '@money-manager/shared-kernel';

export class BudgetExceededEvent implements DomainEvent {
  readonly eventType = 'budget.exceeded';
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;

  constructor(
    public readonly budgetId: string,
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly limit: number,
    public readonly runningTotal: number,
    public readonly period: string,
  ) {
    const meta = createEventMeta(budgetId);
    this.eventId = meta.eventId;
    this.aggregateId = meta.aggregateId;
    this.timestamp = meta.timestamp;
    this.occurredAt = meta.occurredAt;
  }
}
