// ponytail: command to create a new transaction
import { TransactionType, UserId } from '@money-manager/shared-kernel';

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

  // ponytail: command builds itself from raw DTO shape — no presentation layer import
  static fromDto(dto: { amount: number; currency?: string; type: TransactionType; categoryId: string; description: string; date: string }, userId: UserId): CreateTransactionCommand {
    return new CreateTransactionCommand(
      userId.value,
      dto.amount,
      dto.currency ?? 'VND',
      dto.type,
      dto.categoryId,
      dto.description,
      new Date(dto.date),
    );
  }
}
