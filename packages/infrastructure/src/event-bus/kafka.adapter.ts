// ponytail: KafkaEventBusAdapter — kafkajs producer/consumer wiring
import { Injectable, OnModuleDestroy, OnApplicationBootstrap } from '@nestjs/common';
import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs';
import type { DomainEvent, EventBusPort, EventHandler } from '@money-manager/shared-kernel';

interface PendingSub {
  topic: string;
  handler: EventHandler;
}

@Injectable()
export class KafkaEventBusAdapter implements EventBusPort, OnApplicationBootstrap, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  // ponytail: one consumer per groupId; subscribe() before onApplicationBootstrap, run() after
  private readonly consumers: Map<string, Consumer> = new Map();
  private readonly pendingByGroup: Map<string, PendingSub[]> = new Map();

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config);
    this.producer = this.kafka.producer();
  }

  async onApplicationBootstrap(): Promise<void> {
    console.log('[KafkaEventBusAdapter] Connecting producer...');
    await this.producer.connect();
    console.log('[KafkaEventBusAdapter] Producer connected');
    // ponytail: topics auto-created by Kafka (KAFKA_AUTO_CREATE_TOPICS_ENABLE=true)

    for (const [group, pending] of this.pendingByGroup.entries()) {
      const consumer = this.kafka.consumer({ groupId: group });
      await consumer.connect();
      for (const sub of pending) {
        await consumer.subscribe({ topic: sub.topic, fromBeginning: false });
      }
      this.consumers.set(group, consumer);
      const handlerMap = new Map(pending.map((p) => [p.topic, p.handler]));
      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          const handler = handlerMap.get(topic);
          if (!handler || !message.value) return;
          const event: DomainEvent = JSON.parse(message.value.toString());
          await handler(event);
        },
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
    console.log('[KafkaEventBusAdapter] Publishing to topic:', topic, 'eventType:', event.eventType);
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
    if (!this.pendingByGroup.has(group)) {
      this.pendingByGroup.set(group, []);
    }
    this.pendingByGroup.get(group)!.push({ topic, handler });
  }

  // kafkajs uses auto-commit; explicit ack is a no-op
  async ack(_messageId: string): Promise<void> {
    // no-op
  }
}
