export declare class Money {
    readonly amount: number;
    readonly currency: string;
    constructor(amount: number, currency?: string);
    add(other: Money): Money;
    subtract(other: Money): Money;
    isZero(): boolean;
    isPositive(): boolean;
    equals(other: Money): boolean;
    private assertSameCurrency;
}
//# sourceMappingURL=money.d.ts.map