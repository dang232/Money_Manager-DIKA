// ponytail: response DTO for a single transaction
import { TransactionType } from '@money-manager/shared-kernel';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';

export class TransactionResponseDto {
  id!: string;
  amount!: number;
  currency!: string;
  type!: TransactionType;
  categoryId!: string;
  description!: string;
  date!: string;
  createdAt!: string;
  updatedAt!: string;

  static from(t: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = t.id;
    dto.amount = t.amount;
    dto.currency = t.currency;
    dto.type = t.type;
    dto.categoryId = t.categoryId;
    dto.description = t.description;
    dto.date = t.date.toISOString();
    dto.createdAt = t.createdAt.toISOString();
    dto.updatedAt = t.updatedAt.toISOString();
    return dto;
  }
}
