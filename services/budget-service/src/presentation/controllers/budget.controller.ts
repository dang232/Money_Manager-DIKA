// ponytail: budget REST controller
import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { UserId, ApiResponse, CurrentUser } from '@money-manager/shared-kernel';
import { SetBudgetHandler } from '../../application/handlers/set-budget.handler';
import { GetBudgetStatusHandler } from '../../application/handlers/get-budget-status.handler';
import { GetBudgetProjectionsHandler } from '../../application/handlers/get-budget-projections.handler';
import { DeleteBudgetHandler } from '../../application/handlers/delete-budget.handler';
import { SetBudgetCommand } from '../../application/commands/set-budget.command';
import { DeleteBudgetCommand } from '../../application/commands/delete-budget.command';
import { GetBudgetStatusQuery } from '../../application/queries/get-budget-status.query';
import { GetBudgetProjectionsQuery } from '../../application/queries/get-budget-projections.query';
import { SetBudgetDto, BudgetStatusResponseDto, BudgetProjectionResponseDto } from '../dtos/budget.dto';

@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly setHandler: SetBudgetHandler,
    private readonly statusHandler: GetBudgetStatusHandler,
    private readonly projectionsHandler: GetBudgetProjectionsHandler,
    private readonly deleteHandler: DeleteBudgetHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async setBudget(@CurrentUser() userId: UserId, @Body() dto: SetBudgetDto) {
    const budget = await this.setHandler.execute(
      new SetBudgetCommand(userId.value, dto.categoryId, dto.monthlyLimit, dto.currency, dto.year, dto.month),
    );
    const result: BudgetStatusResponseDto = {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      monthlyLimit: budget.monthlyLimit.amount,
      currency: budget.monthlyLimit.currency,
      runningTotal: budget.runningTotal.amount,
      usagePercentage: budget.usagePercentage(),
      isExceeded: budget.isExceeded(),
    };
    return ApiResponse.ok(result);
  }

  @Get()
  async getStatus(
    @CurrentUser() userId: UserId,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const statuses = await this.statusHandler.execute(new GetBudgetStatusQuery(userId.value, year, month));
    return ApiResponse.ok(statuses);
  }

  @Get('projections')
  async getProjections(
    @CurrentUser() userId: UserId,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const projections = await this.projectionsHandler.execute(new GetBudgetProjectionsQuery(userId.value, year, month));
    return ApiResponse.ok(projections);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() userId: UserId,
    @Query('categoryId') categoryId: string,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    await this.deleteHandler.execute(new DeleteBudgetCommand(categoryId, userId.value, year, month));
  }
}
