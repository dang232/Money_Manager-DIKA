// FIXED: handler for GetTransactionByIdQuery - validates userId ownership
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetTransactionByIdQuery } from '../queries/get-transaction-by-id.query';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';
import { TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';

@Injectable()
export class GetTransactionByIdHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
  ) {}

  async execute(query: GetTransactionByIdQuery): Promise<Transaction> {
    const transaction = await this.repo.findById(query.id);
    if (!transaction) {
      throw new NotFoundException('Transaction', query.id);
    }
    // FIXED: Verify the transaction belongs to the requesting user
    if (transaction.userId !== query.userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }
    return transaction;
  }
}
