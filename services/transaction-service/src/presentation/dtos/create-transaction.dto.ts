// ponytail: DTO for creating a transaction — class-validator decorated
import { IsNumber, IsEnum, IsUUID, IsString, MaxLength, IsDateString, IsOptional, Min } from 'class-validator';
import { TransactionType } from '@money-manager/shared-kernel';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

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
