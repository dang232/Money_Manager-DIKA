// ponytail: command to create a new category
import { TransactionType } from '@money-manager/shared-kernel';

export class CreateCategoryCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly type: TransactionType,
    public readonly icon?: string,
    public readonly color?: string,
  ) {}
}
