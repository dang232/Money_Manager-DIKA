import Redis from 'ioredis';
import type { DomainEvent, EventBusPort, EventHandler } from "@money-manager/shared-kernel";
export declare class RedisStreamsEventBusAdapter implements EventBusPort {
    private readonly redis;
    constructor(redis: Redis);
    publish(topic: string, event: DomainEvent): Promise<void>;
    subscribe(topic: string, group: string, handler: EventHandler): Promise<void>;
    ack(messageId: string): Promise<void>;
    private parseFields;
}
//# sourceMappingURL=redis-streams.adapter.d.ts.map