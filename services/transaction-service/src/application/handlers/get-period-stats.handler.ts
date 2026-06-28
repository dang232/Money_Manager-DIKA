// ponytail: handler for GetPeriodStatsQuery
import { Injectable, Inject } from '@nestjs/common';
import { GetPeriodStatsQuery } from '../queries/get-period-stats.query';
import { PeriodStats, TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';

@Injectable()
export class GetPeriodStatsHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
  ) {}

  async execute(query: GetPeriodStatsQuery): Promise<PeriodStats> {
    return this.repo.getPeriodStats(query.userId, query.dateFrom, query.dateTo);
  }
}
