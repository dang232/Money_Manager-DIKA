// ponytail: DTO for updating a transaction — all fields optional
import { IsNumber, IsEnum, IsUUID, IsString, MaxLength, IsDateString, IsOptional, Min } from 'class-validator';
import { TransactionType } from '@money-manager/shared-kernel';

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
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
