// ponytail: AI controller — exposes suggest, chat, and insights endpoints
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiResponse, CurrentUser, UserId } from '@money-manager/shared-kernel';
import { SuggestCategoryHandler } from '../../application/handlers/suggest-category.handler';
import { SuggestCategoryCommand } from '../../application/commands/suggest-category.command';
import { ChatHandler } from '../../application/handlers/chat.handler';
import { InsightsHandler } from '../../application/handlers/insights.handler';
import { CategoryInfo, ChatMessage } from '../../domain/interfaces/ai-provider.port';

interface SuggestRequestBody {
  transactionId: string;
  description: string;
  categories: CategoryInfo[];
}

@Controller('ai')
export class AiController {
  constructor(
    private readonly suggestHandler: SuggestCategoryHandler,
    private readonly chatHandler: ChatHandler,
    private readonly insightsHandler: InsightsHandler,
  ) {}

  @Post('suggest')
  async suggest(@CurrentUser() userId: UserId, @Body() body: SuggestRequestBody) {
    const cmd = new SuggestCategoryCommand(
      body.transactionId,
      body.description,
      userId.value,
      body.categories,
    );
    const result = await this.suggestHandler.execute(cmd);
    return ApiResponse.ok(result);
  }

  @Post('chat')
  async chat(@Body() body: { messages: ChatMessage[] }) {
    const result = await this.chatHandler.execute(body.messages);
    return ApiResponse.ok(result);
  }

  @Get('insights')
  async getInsights(@CurrentUser() userId: UserId) {
    const insights = await this.insightsHandler.getInsights(userId.value);
    return ApiResponse.ok({ insights });
  }

  @Post('insights')
  async generateInsights(@CurrentUser() userId: UserId) {
    const insights = await this.insightsHandler.generateInsights(userId.value);
    return ApiResponse.ok({ insights });
  }
}
