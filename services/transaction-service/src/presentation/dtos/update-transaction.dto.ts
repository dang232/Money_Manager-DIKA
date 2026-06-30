// ponytail: DTO for updating a transaction — all fields optional
import { IsNumber, IsEnum, IsUUID, IsString, MaxLength, IsDateString, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '@money-manager/shared-kernel';

// ponytail: normalize type to uppercase (frontend sends lowercase)
function normalizeType(v: unknown): TransactionType | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'string') {
    const upper = v.toUpperCase();
    if (upper === 'INCOME' || upper === 'EXPENSE') return upper as TransactionType;
  }
  return v as TransactionType;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeType(value))
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
