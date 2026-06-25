// ponytail: command to delete a transaction
import { UserId } from '@money-manager/shared-kernel';

export class DeleteTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}

  static from(id: string, userId: UserId): DeleteTransactionCommand {
    return new DeleteTransactionCommand(id, userId.value);
  }
}
