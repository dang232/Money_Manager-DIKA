// ponytail: REST controller for card layout operations
import { Controller, Get, Patch, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse, CurrentUser, UserId } from '@money-manager/shared-kernel';
import { GetCardLayoutHandler } from '../../application/handlers/get-card-layout.handler';
import { UpdateCardLayoutHandler } from '../../application/handlers/update-card-layout.handler';
import { GetCardLayoutQuery } from '../../application/queries/get-card-layout.query';
import { UpdateCardLayoutCommand } from '../../application/commands/update-card-layout.command';
import { UpdateLayoutDto } from '../dtos/update-layout.dto';

@Controller('layout')
export class CardLayoutController {
  constructor(
    private readonly getHandler: GetCardLayoutHandler,
    private readonly updateHandler: UpdateCardLayoutHandler,
  ) {}

  @Get()
  async get(@CurrentUser() userId: UserId) {
    const layout = await this.getHandler.execute(new GetCardLayoutQuery(userId.value));
    return ApiResponse.ok({
      layout: layout.layout,
      version: layout.version,
      updatedAt: layout.updatedAt.toISOString(),
    });
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async update(@CurrentUser() userId: UserId, @Body() dto: UpdateLayoutDto) {
    const layout = await this.updateHandler.execute(
      new UpdateCardLayoutCommand(
        userId.value,
        dto.layout,
        dto.clientVersion,
        dto.clientTimestamp,
      ),
    );
    return ApiResponse.ok({
      layout: layout.layout,
      version: layout.version,
      updatedAt: layout.updatedAt.toISOString(),
    });
  }

  @Post('beacon')
  @HttpCode(HttpStatus.ACCEPTED)
  async beacon(@CurrentUser() userId: UserId, @Body() dto: UpdateLayoutDto) {
    // Async, fire-and-forget
    setImmediate(async () => {
      try {
        await this.updateHandler.execute(
          new UpdateCardLayoutCommand(
            userId.value,
            dto.layout,
            dto.clientVersion,
            dto.clientTimestamp,
          ),
        );
      } catch (e) {
        console.error('Beacon sync failed:', e);
      }
    });
    return ApiResponse.ok({ received: true });
  }
}