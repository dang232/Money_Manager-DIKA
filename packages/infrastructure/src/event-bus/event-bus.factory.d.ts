import { DynamicModule } from '@nestjs/common';
import { KafkaConfig } from 'kafkajs';
export interface EventBusConfig {
    adapter?: 'kafka' | 'redis-streams';
    kafka?: KafkaConfig;
    redis?: {
        host: string;
        port: number;
        password?: string;
    };
}
export declare const EVENT_BUS_PORT = "EVENT_BUS_PORT";
export declare class EventBusModule {
    static forRoot(config?: EventBusConfig): DynamicModule;
}
//# sourceMappingURL=event-bus.factory.d.ts.map