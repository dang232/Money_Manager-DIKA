// ponytail: response DTO for monthly summary
export class MonthlySummaryResponseDto {
  totalIncome!: number;
  totalExpense!: number;
  net!: number;
  transactionCount!: number;
  period!: string;
}
