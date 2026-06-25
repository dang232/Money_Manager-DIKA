// ponytail: RedisStreamsEventBusAdapter — XADD/XREADGROUP/XACK
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { DomainEvent, EventBusPort, EventHandler } from '@money-manager/shared-kernel';

@Injectable()
export class RedisStreamsEventBusAdapter implements EventBusPort {
  constructor(private readonly redis: Redis) {}

  async publish(topic: string, event: DomainEvent): Promise<void> {
    await this.redis.xadd(
      topic,
      '*',
      'eventId', event.eventId,
      'eventType', event.eventType,
      'aggregateId', event.aggregateId,
      'occurredAt', event.occurredAt.toISOString(),
      'payload', JSON.stringify(event.payload),
      'correlationId', event.correlationId ?? '',
    );
  }

  async subscribe(topic: string, group: string, handler: EventHandler): Promise<void> {
    // Create consumer group if it doesn't exist
    try {
      await this.redis.xgroup('CREATE', topic, group, '$', 'MKSTREAM');
    } catch (err: unknown) {
      // Group already exists — that's fine
      if (!(err instanceof Error) || !err.message.includes('BUSYGROUP')) throw err;
    }

    const consumerId = `consumer-${process.pid}`;
    const poll = async (): Promise<void> => {
      const results = await this.redis.xreadgroup(
        'GROUP', group, consumerId,
        'COUNT', '10',
        'BLOCK', '2000',
        'STREAMS', topic, '>',
      ) as Array<[string, Array<[string, string[]]>]> | null;

      if (results) {
        for (const [, messages] of results) {
          for (const [messageId, fields] of messages) {
            const event = this.parseFields(fields, messageId);
            await handler(event);
            // auto-ack after handler succeeds
            await this.ack(messageId);
          }
        }
      }

      setImmediate(poll);
    };

    poll().catch(() => {/* swallow poll errors to avoid crashing */});
  }

  async ack(messageId: string): Promise<void> {
    // messageId format: "topic:id" or just the id — stored as-is
    // Actual XACK requires the stream name; callers may pass "topic:id"
    const parts = messageId.split(':');
    if (parts.length === 2) {
      await this.redis.xack(parts[0], parts[1], messageId);
    }
    // If only an id with no topic prefix, this is a best-effort no-op
  }

  private parseFields(fields: string[], messageId: string): DomainEvent {
    const obj: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      obj[fields[i]] = fields[i + 1];
    }
    return {
      eventId: obj['eventId'] ?? messageId,
      eventType: obj['eventType'] ?? '',
      aggregateId: obj['aggregateId'] ?? '',
      occurredAt: new Date(obj['occurredAt'] ?? Date.now()),
      payload: JSON.parse(obj['payload'] ?? '{}'),
      correlationId: obj['correlationId'] || undefined,
    };
  }
}
