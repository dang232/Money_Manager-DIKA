// ponytail: budget REST controller
import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { UserId } from '@money-manager/shared-kernel';
import { SetBudgetHandler } from '../../application/handlers/set-budget.handler';
import { GetBudgetStatusHandler } from '../../application/handlers/get-budget-status.handler';
import { GetBudgetProjectionsHandler } from '../../application/handlers/get-budget-projections.handler';
import { SetBudgetCommand } from '../../application/commands/set-budget.command';
import { GetBudgetStatusQuery } from '../../application/queries/get-budget-status.query';
import { GetBudgetProjectionsQuery } from '../../application/queries/get-budget-projections.query';
import { SetBudgetDto, BudgetStatusResponseDto, BudgetProjectionResponseDto } from '../dtos/budget.dto';

@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly setHandler: SetBudgetHandler,
    private readonly statusHandler: GetBudgetStatusHandler,
    private readonly projectionsHandler: GetBudgetProjectionsHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async setBudget(@Body() dto: SetBudgetDto): Promise<BudgetStatusResponseDto> {
    const userId = UserId.DEFAULT.value;
    const budget = await this.setHandler.execute(
      new SetBudgetCommand(userId, dto.categoryId, dto.monthlyLimit, dto.currency, dto.year, dto.month),
    );
    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      monthlyLimit: budget.monthlyLimit.amount,
      currency: budget.monthlyLimit.currency,
      runningTotal: budget.runningTotal.amount,
      usagePercentage: budget.usagePercentage(),
      isExceeded: budget.isExceeded(),
    };
  }

  @Get()
  async getStatus(
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ): Promise<BudgetStatusResponseDto[]> {
    const userId = UserId.DEFAULT.value;
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    return this.statusHandler.execute(new GetBudgetStatusQuery(userId, year, month));
  }

  @Get('projections')
  async getProjections(
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ): Promise<BudgetProjectionResponseDto[]> {
    const userId = UserId.DEFAULT.value;
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    return this.projectionsHandler.execute(new GetBudgetProjectionsQuery(userId, year, month));
  }
}
