// ponytail: KafkaEventBusAdapter — kafkajs producer/consumer wiring
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs';
import type { DomainEvent, EventBusPort, EventHandler } from '@money-manager/shared-kernel';

@Injectable()
export class KafkaEventBusAdapter implements EventBusPort, OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumers: Map<string, Consumer> = new Map();

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config);
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
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

  async subscribe(topic: string, group: string, handler: EventHandler): Promise<void> {
    const consumerKey = `${topic}:${group}`;
    const consumer = this.kafka.consumer({ groupId: group });
    this.consumers.set(consumerKey, consumer);

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const event: DomainEvent = JSON.parse(message.value.toString());
        await handler(event);
      },
    });
  }

  // kafkajs uses auto-commit; explicit ack is a no-op
  async ack(_messageId: string): Promise<void> {
    // no-op
  }
}
