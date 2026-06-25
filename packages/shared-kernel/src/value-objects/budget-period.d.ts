export declare class BudgetPeriod {
    readonly year: number;
    readonly month: number;
    constructor(year: number, month: number);
    toString(): string;
    equals(other: BudgetPeriod): boolean;
    static current(): BudgetPeriod;
}
//# sourceMappingURL=budget-period.d.ts.map