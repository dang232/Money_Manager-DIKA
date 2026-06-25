// ponytail: command to update an existing transaction
import { TransactionType, UserId } from '@money-manager/shared-kernel';

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

  // ponytail: command builds itself from raw DTO shape — no presentation layer import
  static fromDto(id: string, dto: { amount?: number; currency?: string; type?: TransactionType; categoryId?: string; description?: string; date?: string }, userId: UserId): UpdateTransactionCommand {
    return new UpdateTransactionCommand(
      id,
      userId.value,
      dto.amount,
      dto.currency,
      dto.type,
      dto.categoryId,
      dto.description,
      dto.date ? new Date(dto.date) : undefined,
    );
  }
}
