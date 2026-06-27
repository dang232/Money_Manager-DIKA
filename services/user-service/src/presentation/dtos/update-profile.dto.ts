// ponytail: DTOs for PUT /users/me
import { IsOptional, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  defaultCurrency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  budgetAnchorDay?: number;
}