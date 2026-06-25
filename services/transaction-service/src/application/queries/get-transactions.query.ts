// ponytail: query to list transactions with filters
import { TransactionType } from '@money-manager/shared-kernel';

export class GetTransactionsQuery {
  constructor(
    public readonly userId: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly categoryId?: string,
    public readonly type?: TransactionType,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
  ) {}
}
