// ponytail: AI service app module — wires providers, consumers, controller
import { Module } from '@nestjs/common';
import { EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { AiController } from './presentation/controllers/ai.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { SuggestCategoryHandler } from './application/handlers/suggest-category.handler';
import { TransactionCreatedConsumer } from './application/consumers/transaction-created.consumer';
import { aiProviderFactory } from './infrastructure/providers/ai-provider.factory';

@Module({
  imports: [
    EventBusModule.forRoot(),
    LoggerModule,
  ],
  controllers: [AiController, HealthController],
  providers: [
    aiProviderFactory,
    SuggestCategoryHandler,
    TransactionCreatedConsumer,
  ],
})
export class AppModule {}
