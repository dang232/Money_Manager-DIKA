// ponytail: AI controller — exposes POST /ai/suggest endpoint
import { Controller, Post, Body } from '@nestjs/common';
import { ApiResponse, CurrentUser, UserId } from '@money-manager/shared-kernel';
import { SuggestCategoryHandler } from '../../application/handlers/suggest-category.handler';
import { SuggestCategoryCommand } from '../../application/commands/suggest-category.command';
import { CategoryInfo } from '../../domain/interfaces/ai-provider.port';

interface SuggestRequestBody {
  transactionId: string;
  description: string;
  categories: CategoryInfo[];
}

@Controller('ai')
export class AiController {
  constructor(private readonly suggestHandler: SuggestCategoryHandler) {}

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
}
