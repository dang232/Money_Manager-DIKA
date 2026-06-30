// ponytail: DTOs for category endpoints
import { IsString, IsNotEmpty, MaxLength, IsEnum, IsOptional, Matches, ValidateIf } from 'class-validator';
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

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) => normalizeType(value))
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ValidateIf((o) => o.color !== undefined)
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;
}

export class CategoryResponseDto {
  id!: string;
  name!: string;
  type!: string;
  icon!: string;
  color!: string;
  createdAt!: string;
}
