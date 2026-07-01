// ponytail: handles SuggestCategoryCommand — calls AI provider, publishes if confident
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EventBusPort, createEventMeta } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { AiProviderPort, AI_PROVIDER, CategorySuggestion } from '../../domain/interfaces/ai-provider.port';
import { SuggestCategoryCommand } from '../commands/suggest-category.command';
import { aiConfig } from '../../config/ai.config';

const SUGGESTION_TOPIC = 'ai.category.suggested';

@Injectable()
export class SuggestCategoryHandler {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProviderPort,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    @Inject(aiConfig.KEY) private readonly config: ConfigType<typeof aiConfig>,
  ) {}

  async execute(cmd: SuggestCategoryCommand): Promise<CategorySuggestion> {
    const suggestion = await this.aiProvider.suggestCategory(cmd.description, cmd.categories);

    // Use config threshold instead of hardcoded 0.7
    if (suggestion.confidence > this.config.confidenceThreshold) {
      await this.eventBus.publish(SUGGESTION_TOPIC, {
        ...createEventMeta(cmd.transactionId),
        eventType: 'ai.category.suggested',
        payload: {
          transactionId: cmd.transactionId,
          userId: cmd.userId,
          categoryId: suggestion.categoryId,
          categoryName: suggestion.categoryName,
          confidence: suggestion.confidence,
        },
      });
    }

    return suggestion;
  }
}
