// ponytail: command to update an existing transaction
import { TransactionType } from '@money-manager/shared-kernel';

export class UpdateTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount?: number,
    public readonly currency?: string,
    public readonly type?: TransactionType,
    public readonly categoryId?: string,
    public readonly description?: string,
    public readonly date?: Date,
  ) {}
}
