// ponytail: listens for transaction.created events, triggers AI suggestion
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { EventBusPort, DomainEvent } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT, LOGGER_TOKEN } from '@money-manager/infrastructure';
import { SuggestCategoryHandler } from '../handlers/suggest-category.handler';
import { SuggestCategoryCommand } from '../commands/suggest-category.command';

interface Logger { info(msg: string, meta?: any): void; error(msg: string, meta?: any): void; }

const TRANSACTION_TOPIC = 'transaction.events';
const CONSUMER_GROUP = 'ai-service-suggestions';

@Injectable()
export class TransactionCreatedConsumer implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
    private readonly suggestHandler: SuggestCategoryHandler,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventBus.subscribe(TRANSACTION_TOPIC, CONSUMER_GROUP, (event) => this.handle(event));
    this.logger.info('TransactionCreatedConsumer subscribed to transaction.events');
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'transaction.created') return;

    const payload = event.payload as { description?: string; userId?: string; categoryId?: string } | undefined;
    if (!payload?.description) return;

    // Fetch categories from budget-service
    const categories = await this.fetchCategories(payload.userId ?? '');
    if (categories.length === 0) return;

    const cmd = new SuggestCategoryCommand(
      event.aggregateId,
      payload.description,
      payload.userId ?? '',
      categories,
    );

    try {
      await this.suggestHandler.execute(cmd);
    } catch (err) {
      this.logger.error('Failed to suggest category', { transactionId: event.aggregateId, error: String(err) });
    }
  }

  private async fetchCategories(userId: string): Promise<{ id: string; name: string; type: any }[]> {
    const budgetServiceUrl = process.env['BUDGET_SERVICE_URL'] ?? 'http://localhost:3002';
    try {
      const res = await fetch(`${budgetServiceUrl}/categories?userId=${userId}`);
      if (!res.ok) return [];
      return await res.json() as any[];
    } catch {
      return [];
    }
  }
}
