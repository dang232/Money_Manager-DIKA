// ponytail: DTOs for category endpoints
import { IsString, IsNotEmpty, MaxLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { TransactionType } from '@money-manager/shared-kernel';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
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
