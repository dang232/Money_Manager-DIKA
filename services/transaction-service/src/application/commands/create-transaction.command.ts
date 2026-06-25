// ponytail: command to create a new transaction
import { TransactionType } from '@money-manager/shared-kernel';

export class CreateTransactionCommand {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly type: TransactionType,
    public readonly categoryId: string,
    public readonly description: string,
    public readonly date: Date,
  ) {}
}
