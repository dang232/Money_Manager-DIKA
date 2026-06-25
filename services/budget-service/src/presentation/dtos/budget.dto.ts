// ponytail: DTOs for budget endpoints
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, Min, Max } from 'class-validator';

export class SetBudgetDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsNumber()
  @IsPositive()
  monthlyLimit!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}

export class BudgetStatusResponseDto {
  budgetId!: string;
  categoryId!: string;
  monthlyLimit!: number;
  currency!: string;
  runningTotal!: number;
  usagePercentage!: number;
  isExceeded!: boolean;
}

export class BudgetProjectionResponseDto {
  budgetId!: string;
  categoryId!: string;
  dailyVelocity!: number;
  projectedOverageDate!: string | null;
  daysUntilExceeded!: number | null;
}
