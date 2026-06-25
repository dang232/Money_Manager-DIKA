// ponytail: handler for GetTransactionsQuery
import { Injectable, Inject } from '@nestjs/common';
import { GetTransactionsQuery } from '../queries/get-transactions.query';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';
import { TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';

@Injectable()
export class GetTransactionsHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
  ) {}

  async execute(query: GetTransactionsQuery): Promise<Transaction[]> {
    return this.repo.findByUserId(query.userId, {
      page: query.page,
      limit: query.limit,
      categoryId: query.categoryId,
      type: query.type,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }
}
