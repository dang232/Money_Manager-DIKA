import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KafkaConfig } from 'kafkajs';
import type { DomainEvent, EventBusPort, EventHandler } from "@money-manager/shared-kernel";
export declare class KafkaEventBusAdapter implements EventBusPort, OnModuleInit, OnModuleDestroy {
    private readonly kafka;
    private readonly producer;
    private readonly consumers;
    constructor(config: KafkaConfig);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publish(topic: string, event: DomainEvent): Promise<void>;
    subscribe(topic: string, group: string, handler: EventHandler): Promise<void>;
    ack(_messageId: string): Promise<void>;
}
//# sourceMappingURL=kafka.adapter.d.ts.map