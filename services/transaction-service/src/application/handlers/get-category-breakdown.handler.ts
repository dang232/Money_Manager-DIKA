// ponytail: handler for GetCategoryBreakdownQuery
import { Injectable, Inject } from '@nestjs/common';
import { GetCategoryBreakdownQuery } from '../queries/get-category-breakdown.query';
import { CategoryBreakdownItem, TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';

@Injectable()
export class GetCategoryBreakdownHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
  ) {}

  async execute(query: GetCategoryBreakdownQuery): Promise<CategoryBreakdownItem[]> {
    return this.repo.getCategoryBreakdown(query.userId, query.year, query.month);
  }
}
