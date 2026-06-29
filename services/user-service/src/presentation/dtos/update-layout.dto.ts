// ponytail: DTO for PATCH /layout
import { IsObject, IsNumber, Validate } from 'class-validator';

export class UpdateLayoutDto {
  @IsObject()
  layout!: {
    categories: string[];
    budgets: string[];
  };

  @IsNumber()
  clientVersion!: number;

  @IsNumber()
  clientTimestamp!: number;
}