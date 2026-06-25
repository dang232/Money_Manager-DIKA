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
import { TransactionType, UserId } from '@money-manager/shared-kernel';
import { CreateTransactionHandler } from '../../application/handlers/create-transaction.handler';
import { UpdateTransactionHandler } from '../../application/handlers/update-transaction.handler';
import { DeleteTransactionHandler } from '../../application/handlers/delete-transaction.handler';
import { GetTransactionsHandler } from '../../application/handlers/get-transactions.handler';
import { GetTransactionByIdHandler } from '../../application/handlers/get-transaction-by-id.handler';
import { GetMonthlySummaryHandler } from '../../application/handlers/get-monthly-summary.handler';
import { CreateTransactionCommand } from '../../application/commands/create-transaction.command';
import { UpdateTransactionCommand } from '../../application/commands/update-transaction.command';
import { DeleteTransactionCommand } from '../../application/commands/delete-transaction.command';
import { GetTransactionsQuery } from '../../application/queries/get-transactions.query';
import { GetTransactionByIdQuery } from '../../application/queries/get-transaction-by-id.query';
import { GetMonthlySummaryQuery } from '../../application/queries/get-monthly-summary.query';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { UpdateTransactionDto } from '../dtos/update-transaction.dto';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';
import { MonthlySummaryResponseDto } from '../dtos/monthly-summary-response.dto';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createHandler: CreateTransactionHandler,
    private readonly updateHandler: UpdateTransactionHandler,
    private readonly deleteHandler: DeleteTransactionHandler,
    private readonly getTransactionsHandler: GetTransactionsHandler,
    private readonly getByIdHandler: GetTransactionByIdHandler,
    private readonly getMonthlySummaryHandler: GetMonthlySummaryHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    const cmd = new CreateTransactionCommand(
      UserId.DEFAULT.value,
      dto.amount,
      dto.currency ?? 'VND',
      dto.type,
      dto.categoryId,
      dto.description,
      new Date(dto.date),
    );
    const transaction = await this.createHandler.execute(cmd);
    return TransactionResponseDto.from(transaction);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: TransactionType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<TransactionResponseDto[]> {
    const query = new GetTransactionsQuery(
      UserId.DEFAULT.value,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      categoryId,
      type,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
    const transactions = await this.getTransactionsHandler.execute(query);
    return transactions.map(TransactionResponseDto.from);
  }

  @Get('summary')
  async getMonthlySummary(
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<MonthlySummaryResponseDto> {
    const query = new GetMonthlySummaryQuery(
      UserId.DEFAULT.value,
      Number(year),
      Number(month),
    );
    const summary = await this.getMonthlySummaryHandler.execute(query);
    const dto = new MonthlySummaryResponseDto();
    dto.totalIncome = summary.totalIncome;
    dto.totalExpense = summary.totalExpense;
    dto.net = summary.net;
    dto.transactionCount = summary.transactionCount;
    dto.period = `${year}-${String(Number(month)).padStart(2, '0')}`;
    return dto;
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<TransactionResponseDto> {
    const query = new GetTransactionByIdQuery(id, UserId.DEFAULT.value);
    const transaction = await this.getByIdHandler.execute(query);
    return TransactionResponseDto.from(transaction);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const cmd = new UpdateTransactionCommand(
      id,
      UserId.DEFAULT.value,
      dto.amount,
      dto.currency,
      dto.type,
      dto.categoryId,
      dto.description,
      dto.date ? new Date(dto.date) : undefined,
    );
    const transaction = await this.updateHandler.execute(cmd);
    return TransactionResponseDto.from(transaction);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const cmd = new DeleteTransactionCommand(id, UserId.DEFAULT.value);
    await this.deleteHandler.execute(cmd);
  }
}
