"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
// ponytail: Money value object — immutable, non-negative amount + currency
class Money {
    amount;
    currency;
    constructor(amount, currency = 'VND') {
        if (amount < 0) {
            throw new Error('Money amount cannot be negative');
        }
        this.amount = amount;
        this.currency = currency.toUpperCase();
    }
    add(other) {
        this.assertSameCurrency(other);
        return new Money(this.amount + other.amount, this.currency);
    }
    subtract(other) {
        this.assertSameCurrency(other);
        return new Money(this.amount - other.amount, this.currency);
    }
    isZero() {
        return this.amount === 0;
    }
    isPositive() {
        return this.amount > 0;
    }
    equals(other) {
        return this.amount === other.amount && this.currency === other.currency;
    }
    assertSameCurrency(other) {
        if (this.currency !== other.currency) {
            throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
        }
    }
}
exports.Money = Money;
//# sourceMappingURL=money.js.map