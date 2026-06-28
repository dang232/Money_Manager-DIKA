// ponytail: response DTO for period stats
export class PeriodStatsResponseDto {
  avgDailySpend!: number;
  largestExpense!: { amount: number; description: string; categoryId: string } | null;
  mostActiveDay!: { dayOfWeek: number; count: number } | null;
}
