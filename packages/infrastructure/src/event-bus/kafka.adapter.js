"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaEventBusAdapter = void 0;
// ponytail: KafkaEventBusAdapter — kafkajs producer/consumer wiring
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
let KafkaEventBusAdapter = class KafkaEventBusAdapter {
    kafka;
    producer;
    consumers = new Map();
    constructor(config) {
        this.kafka = new kafkajs_1.Kafka(config);
        this.producer = this.kafka.producer();
    }
    async onModuleInit() {
        await this.producer.connect();
    }
    async onModuleDestroy() {
        await this.producer.disconnect();
        for (const consumer of this.consumers.values()) {
            await consumer.disconnect();
        }
    }
    async publish(topic, event) {
        await this.producer.send({
            topic,
            messages: [
                {
                    key: event.aggregateId,
                    value: JSON.stringify(event),
                    headers: {
                        eventId: event.eventId,
                        eventType: event.eventType,
                        correlationId: event.correlationId ?? '',
                    },
                },
            ],
        });
    }
    async subscribe(topic, group, handler) {
        const consumerKey = `${topic}:${group}`;
        const consumer = this.kafka.consumer({ groupId: group });
        this.consumers.set(consumerKey, consumer);
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async ({ message }) => {
                if (!message.value)
                    return;
                const event = JSON.parse(message.value.toString());
                await handler(event);
            },
        });
    }
    // kafkajs uses auto-commit; explicit ack is a no-op
    async ack(_messageId) {
        // no-op
    }
};
exports.KafkaEventBusAdapter = KafkaEventBusAdapter;
exports.KafkaEventBusAdapter = KafkaEventBusAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], KafkaEventBusAdapter);
//# sourceMappingURL=kafka.adapter.js.map