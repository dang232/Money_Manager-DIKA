"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetPeriod = void 0;
// ponytail: BudgetPeriod value object — year+month pair for budget tracking
class BudgetPeriod {
    year;
    month;
    constructor(year, month) {
        if (month < 1 || month > 12) {
            throw new Error('Month must be between 1 and 12');
        }
        if (year < 2000 || year > 2100) {
            throw new Error('Year must be between 2000 and 2100');
        }
        this.year = year;
        this.month = month;
    }
    toString() {
        return `${this.year}-${String(this.month).padStart(2, '0')}`;
    }
    equals(other) {
        return this.year === other.year && this.month === other.month;
    }
    static current() {
        const now = new Date();
        return new BudgetPeriod(now.getFullYear(), now.getMonth() + 1);
    }
}
exports.BudgetPeriod = BudgetPeriod;
//# sourceMappingURL=budget-period.js.map