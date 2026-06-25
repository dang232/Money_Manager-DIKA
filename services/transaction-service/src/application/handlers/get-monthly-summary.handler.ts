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
    return this.repo.getMonthlySummary(query.userId, query.year, query.month);
  }
}
