// ponytail: AI controller — exposes POST /ai/suggest endpoint
import { Controller, Post, Body } from '@nestjs/common';
import { SuggestCategoryHandler } from '../../application/handlers/suggest-category.handler';
import { SuggestCategoryCommand } from '../../application/commands/suggest-category.command';
import { CategoryInfo, CategorySuggestion } from '../../domain/interfaces/ai-provider.port';

interface SuggestRequestBody {
  transactionId: string;
  description: string;
  userId?: string;
  categories: CategoryInfo[];
}

@Controller('ai')
export class AiController {
  constructor(private readonly suggestHandler: SuggestCategoryHandler) {}

  @Post('suggest')
  async suggest(@Body() body: SuggestRequestBody): Promise<CategorySuggestion> {
    const cmd = new SuggestCategoryCommand(
      body.transactionId,
      body.description,
      body.userId ?? '',
      body.categories,
    );
    return this.suggestHandler.execute(cmd);
  }
}
