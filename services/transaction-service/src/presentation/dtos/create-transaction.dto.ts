// ponytail: DTO for creating a transaction — class-validator decorated
import { IsNumber, IsEnum, IsUUID, IsString, MaxLength, IsDateString, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '@money-manager/shared-kernel';

// ponytail: normalize type to uppercase (frontend sends lowercase)
function normalizeType(v: unknown): TransactionType {
  if (typeof v === 'string') {
    const upper = v.toUpperCase();
    if (upper === 'INCOME' || upper === 'EXPENSE') return upper as TransactionType;
  }
  return v as TransactionType;
}

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @Transform(({ value }) => normalizeType(value))
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsUUID()
  categoryId!: string;

  @IsString()
  @MaxLength(255)
  description!: string;

  @IsDateString()
  date!: string;
}
