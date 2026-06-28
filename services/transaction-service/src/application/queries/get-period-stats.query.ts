// ponytail: query to get spending stats for a date range
export class GetPeriodStatsQuery {
  constructor(
    public readonly userId: string,
    public readonly dateFrom: Date,
    public readonly dateTo: Date,
  ) {}
}
