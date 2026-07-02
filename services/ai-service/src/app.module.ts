// ponytail: AI service app module — wires providers, consumers, controller
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { aiConfig } from './config/ai.config';
import { AiController } from './presentation/controllers/ai.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { SuggestCategoryHandler } from './application/handlers/suggest-category.handler';
import { ChatHandler } from './application/handlers/chat.handler';
import { InsightsHandler } from './application/handlers/insights.handler';
import { TransactionCreatedConsumer } from './application/consumers/transaction-created.consumer';
import { aiProviderFactory } from './infrastructure/providers/ai-provider.factory';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [aiConfig] }),
    EventBusModule.forRoot({
      redis: {
        host: process.env['REDIS_HOST'] ?? 'localhost',
        port: Number(process.env['REDIS_PORT'] ?? 6379),
        password: process.env['REDIS_PASSWORD'],
      },
    }),
    LoggerModule,
  ],
  controllers: [AiController, HealthController],
  providers: [
    aiProviderFactory,
    SuggestCategoryHandler,
    ChatHandler,
    InsightsHandler,
    TransactionCreatedConsumer,
  ],
})
export class AppModule {}
