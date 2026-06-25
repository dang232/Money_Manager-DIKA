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
export declare function createEventMeta(aggregateId: string): Pick<DomainEvent, 'eventId' | 'aggregateId' | 'timestamp' | 'occurredAt'>;
//# sourceMappingURL=event-bus.port.d.ts.map