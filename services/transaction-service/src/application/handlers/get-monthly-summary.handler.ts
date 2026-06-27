// ponytail: handler for GetMonthlySummaryQuery
import { Injectable, Inject } from '@nestjs/common';
import { GetMonthlySummaryQuery } from '../queries/get-monthly-summary.query';
import { MonthlySummary, TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';

@Injectable()
export class GetMonthlySummaryHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
  ) {}

  async execute(query: GetMonthlySummaryQuery): Promise<MonthlySummary> {
    const now = new Date();
    // ponytail: default to current month when caller doesn't pass year/month
    const year = Number.isFinite(query.year) ? query.year : now.getFullYear();
    const month = Number.isFinite(query.month) ? query.month : now.getMonth() + 1;
    return this.repo.getMonthlySummary(query.userId, year, month);
  }
}
