// ponytail: regression lock for the Money value object — most-used primitive in the domain
import { Money } from '@money-manager/shared-kernel';

describe('Money', () => {
  describe('construction', () => {
    it('defaults to VND when no currency provided', () => {
      const m = new Money(1000);
      expect(m.amount).toBe(1000);
      expect(m.currency).toBe('VND');
    });

    it('normalizes currency to uppercase', () => {
      expect(new Money(100, 'usd').currency).toBe('USD');
    });

    it('accepts zero amount', () => {
      expect(new Money(0).isZero()).toBe(true);
    });

    it('throws on negative amount', () => {
      expect(() => new Money(-1)).toThrow('cannot be negative');
    });
  });

  describe('add / subtract', () => {
    it('adds two same-currency amounts', () => {
      const sum = new Money(100, 'USD').add(new Money(50, 'USD'));
      expect(sum.amount).toBe(150);
      expect(sum.currency).toBe('USD');
    });

    it('subtracts and clamps isPositive to false', () => {
      const diff = new Money(100, 'USD').subtract(new Money(30, 'USD'));
      expect(diff.amount).toBe(70);
      expect(diff.isPositive()).toBe(true);
    });

    it('throws when adding across currencies', () => {
      expect(() => new Money(100, 'USD').add(new Money(100, 'VND'))).toThrow(/Currency mismatch/);
    });

    it('throws when subtracting across currencies', () => {
      expect(() => new Money(100, 'USD').subtract(new Money(100, 'EUR'))).toThrow(/Currency mismatch/);
    });
  });

  describe('equality', () => {
    it('equals when amount and currency match', () => {
      expect(new Money(100, 'USD').equals(new Money(100, 'USD'))).toBe(true);
    });

    it('not equals when amount differs', () => {
      expect(new Money(100, 'USD').equals(new Money(99, 'USD'))).toBe(false);
    });

    it('not equals when currency differs', () => {
      expect(new Money(100, 'USD').equals(new Money(100, 'VND'))).toBe(false);
    });
  });
});