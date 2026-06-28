// ponytail: handler for GetMonthlyTrendQuery
import { Injectable, Inject } from '@nestjs/common';
import { GetMonthlyTrendQuery } from '../queries/get-monthly-trend.query';
import { MonthlyTrendItem, TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';

@Injectable()
export class GetMonthlyTrendHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
  ) {}

  async execute(query: GetMonthlyTrendQuery): Promise<MonthlyTrendItem[]> {
    const months = query.months > 0 ? query.months : 6;
    return this.repo.getMonthlyTrend(query.userId, months);
  }
}
