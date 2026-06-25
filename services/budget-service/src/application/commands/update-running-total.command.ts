// ponytail: command to update budget running total from transaction events
import { TransactionType } from '@money-manager/shared-kernel';

export class UpdateRunningTotalCommand {
  constructor(
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly type: TransactionType,
    public readonly year: number,
    public readonly month: number,
  ) {}
}
