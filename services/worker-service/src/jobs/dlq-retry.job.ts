// ponytail: DLQ retry job — exponential backoff for failed events
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { EventBusPort, DomainEvent } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT, LOGGER_TOKEN } from '@money-manager/infrastructure';

interface Logger { info(msg: string, meta?: any): void; warn(msg: string, meta?: any): void; error(msg: string, meta?: any): void; }

const DLQ_TOPIC = 'dlq';
const DLQ_GROUP = 'worker-dlq-retry';

const RETRY_DELAYS = [60_000, 300_000, 1_800_000]; // 1min, 5min, 30min

@Injectable()
export class DlqRetryJob implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventBus.subscribe(DLQ_TOPIC, DLQ_GROUP, (event) => this.handle(event));
    this.logger.info('DlqRetryJob subscribed to DLQ topic');
  }

  private async handle(event: DomainEvent): Promise<void> {
    const metadata = (event.payload as any)?.metadata ?? {};
    const retryCount: number = metadata.retry_count ?? 0;
    const originalTopic: string = metadata.original_topic ?? '';

    if (!originalTopic) {
      this.logger.warn('DLQ event missing original_topic, skipping', { eventId: event.eventId });
      return;
    }

    if (retryCount >= 3) {
      this.logger.error('DLQ event permanently failed after 3 retries', {
        eventId: event.eventId,
        originalTopic,
      });
      return;
    }

    const delay = RETRY_DELAYS[retryCount];
    this.logger.info(`DLQ retry attempt ${retryCount + 1} in ${delay / 1000}s`, {
      eventId: event.eventId,
      originalTopic,
    });

    await this.sleep(delay);

    // Republish with incremented retry count
    const republishEvent: DomainEvent = {
      ...event,
      payload: {
        ...(event.payload as any),
        metadata: { ...metadata, retry_count: retryCount + 1 },
      },
    };

    await this.eventBus.publish(originalTopic, republishEvent);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
