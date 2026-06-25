// ponytail: EventBus port — publish domain events to messaging infra
import { generateUuid } from '../utils/uuid';

export interface DomainEvent {
  readonly eventType: string;
  readonly eventId: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly occurredAt: Date;
  readonly correlationId?: string;
  readonly payload?: unknown;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface EventBusPort {
  publish(topic: string, event: DomainEvent): Promise<void>;
  subscribe(topic: string, group: string, handler: EventHandler): Promise<void>;
}

// helper to create base event fields
export function createEventMeta(aggregateId: string): Pick<DomainEvent, 'eventId' | 'aggregateId' | 'timestamp' | 'occurredAt'> {
  const now = new Date();
  return { eventId: generateUuid(), aggregateId, timestamp: now, occurredAt: now };
}
