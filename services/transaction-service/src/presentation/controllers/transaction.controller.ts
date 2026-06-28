// ponytail: REST controller for transaction operations
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TransactionType, UserId, ApiResponse, CurrentUser } from '@money-manager/shared-kernel';
import { CreateTransactionHandler } from '../../application/handlers/create-transaction.handler';
import { UpdateTransactionHandler } from '../../application/handlers/update-transaction.handler';
import { DeleteTransactionHandler } from '../../application/handlers/delete-transaction.handler';
import { GetTransactionsHandler } from '../../application/handlers/get-transactions.handler';
import { GetTransactionByIdHandler } from '../../application/handlers/get-transaction-by-id.handler';
import { GetMonthlySummaryHandler } from '../../application/handlers/get-monthly-summary.handler';
import { GetCategoryBreakdownHandler } from '../../application/handlers/get-category-breakdown.handler';
import { GetMonthlyTrendHandler } from '../../application/handlers/get-monthly-trend.handler';
import { GetPeriodStatsHandler } from '../../application/handlers/get-period-stats.handler';
import { CreateTransactionCommand } from '../../application/commands/create-transaction.command';
import { UpdateTransactionCommand } from '../../application/commands/update-transaction.command';
import { DeleteTransactionCommand } from '../../application/commands/delete-transaction.command';
import { GetTransactionsQuery } from '../../application/queries/get-transactions.query';
import { GetTransactionByIdQuery } from '../../application/queries/get-transaction-by-id.query';
import { GetMonthlySummaryQuery } from '../../application/queries/get-monthly-summary.query';
import { GetCategoryBreakdownQuery } from '../../application/queries/get-category-breakdown.query';
import { GetMonthlyTrendQuery } from '../../application/queries/get-monthly-trend.query';
import { GetPeriodStatsQuery } from '../../application/queries/get-period-stats.query';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { UpdateTransactionDto } from '../dtos/update-transaction.dto';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';
import { MonthlySummaryResponseDto } from '../dtos/monthly-summary-response.dto';
import { CategoryBreakdownResponseDto } from '../dtos/category-breakdown-response.dto';
import { MonthlyTrendResponseDto } from '../dtos/monthly-trend-response.dto';
import { PeriodStatsResponseDto } from '../dtos/period-stats-response.dto';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createHandler: CreateTransactionHandler,
    private readonly updateHandler: UpdateTransactionHandler,
    private readonly deleteHandler: DeleteTransactionHandler,
    private readonly getTransactionsHandler: GetTransactionsHandler,
    private readonly getByIdHandler: GetTransactionByIdHandler,
    private readonly getMonthlySummaryHandler: GetMonthlySummaryHandler,
    private readonly getCategoryBreakdownHandler: GetCategoryBreakdownHandler,
    private readonly getMonthlyTrendHandler: GetMonthlyTrendHandler,
    private readonly getPeriodStatsHandler: GetPeriodStatsHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() userId: UserId, @Body() dto: CreateTransactionDto) {
    const transaction = await this.createHandler.execute(CreateTransactionCommand.fromDto(dto, userId));
    return ApiResponse.ok(TransactionResponseDto.from(transaction));
  }

  @Get()
  async findAll(
    @CurrentUser() userId: UserId,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: TransactionType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const query = new GetTransactionsQuery(
      userId.value,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      categoryId,
      type,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
    const transactions = await this.getTransactionsHandler.execute(query);
    return ApiResponse.ok(transactions.map(TransactionResponseDto.from));
  }

  @Get('summary')
  async getMonthlySummary(
    @CurrentUser() userId: UserId,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    const y = Number.isFinite(Number(year)) ? Number(year) : now.getFullYear();
    const m = Number.isFinite(Number(month)) ? Number(month) : now.getMonth() + 1;
    const query = new GetMonthlySummaryQuery(userId.value, y, m);
    const summary = await this.getMonthlySummaryHandler.execute(query);
    const dto = new MonthlySummaryResponseDto();
    dto.totalIncome = summary.totalIncome;
    dto.totalExpense = summary.totalExpense;
    dto.net = summary.net;
    dto.transactionCount = summary.transactionCount;
    dto.period = `${y}-${String(m).padStart(2, '0')}`;
    return ApiResponse.ok(dto);
  }

  @Get('category-breakdown')
  async getCategoryBreakdown(
    @CurrentUser() userId: UserId,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    const y = Number.isFinite(Number(year)) ? Number(year) : now.getFullYear();
    const m = Number.isFinite(Number(month)) ? Number(month) : now.getMonth() + 1;
    const query = new GetCategoryBreakdownQuery(userId.value, y, m);
    const breakdown = await this.getCategoryBreakdownHandler.execute(query);
    return ApiResponse.ok(breakdown.map((item) => {
      const dto = new CategoryBreakdownResponseDto();
      dto.categoryId = item.categoryId;
      dto.total = item.total;
      dto.count = item.count;
      return dto;
    }));
  }

  @Get('monthly-trend')
  async getMonthlyTrend(
    @CurrentUser() userId: UserId,
    @Query('months') months?: string,
  ) {
    const m = Number.isFinite(Number(months)) && Number(months) > 0 ? Number(months) : 6;
    const query = new GetMonthlyTrendQuery(userId.value, m);
    const trend = await this.getMonthlyTrendHandler.execute(query);
    return ApiResponse.ok(trend.map((item) => {
      const dto = new MonthlyTrendResponseDto();
      dto.year = item.year;
      dto.month = item.month;
      dto.totalIncome = item.totalIncome;
      dto.totalExpense = item.totalExpense;
      return dto;
    }));
  }

  @Get('stats')
  async getPeriodStats(
    @CurrentUser() userId: UserId,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = dateTo ? new Date(dateTo) : now;
    const query = new GetPeriodStatsQuery(userId.value, from, to);
    const stats = await this.getPeriodStatsHandler.execute(query);
    const dto = new PeriodStatsResponseDto();
    dto.avgDailySpend = stats.avgDailySpend;
    dto.largestExpense = stats.largestExpense;
    dto.mostActiveDay = stats.mostActiveDay;
    return ApiResponse.ok(dto);
  }

  @Get(':id')
  async findById(@CurrentUser() userId: UserId, @Param('id', ParseUUIDPipe) id: string) {
    const query = new GetTransactionByIdQuery(id, userId.value);
    const transaction = await this.getByIdHandler.execute(query);
    return ApiResponse.ok(TransactionResponseDto.from(transaction));
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const transaction = await this.updateHandler.execute(UpdateTransactionCommand.fromDto(id, dto, userId));
    return ApiResponse.ok(TransactionResponseDto.from(transaction));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() userId: UserId, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteHandler.execute(DeleteTransactionCommand.from(id, userId));
  }
}
