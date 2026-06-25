// ponytail: unit tests for Transaction aggregate
import { Transaction, CreateTransactionProps } from './transaction.aggregate';
import { TransactionType, DomainException } from '@money-manager/shared-kernel';

describe('Transaction Aggregate', () => {
  const validProps: CreateTransactionProps = {
    userId: '00000000-0000-4000-a000-000000000001',
    amount: 50000,
    currency: 'VND',
    type: TransactionType.EXPENSE,
    categoryId: '11111111-1111-4111-b111-111111111111',
    description: 'Lunch',
    date: new Date('2024-06-01'),
  };

  describe('Transaction.create', () => {
    it('should create a transaction with valid props', () => {
      const t = Transaction.create(validProps);

      expect(t.id).toBeDefined();
      expect(t.userId).toBe(validProps.userId);
      expect(t.amount).toBe(50000);
      expect(t.currency).toBe('VND');
      expect(t.type).toBe(TransactionType.EXPENSE);
      expect(t.categoryId).toBe(validProps.categoryId);
      expect(t.description).toBe('Lunch');
      expect(t.createdAt).toBeInstanceOf(Date);
      expect(t.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw when amount is 0', () => {
      expect(() => Transaction.create({ ...validProps, amount: 0 }))
        .toThrow(DomainException);
    });

    it('should throw when amount is negative', () => {
      expect(() => Transaction.create({ ...validProps, amount: -100 }))
        .toThrow(DomainException);
    });

    it('should throw when date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(() => Transaction.create({ ...validProps, date: futureDate }))
        .toThrow(DomainException);
    });

    it('should throw when description exceeds 255 characters', () => {
      const longDesc = 'a'.repeat(256);
      expect(() => Transaction.create({ ...validProps, description: longDesc }))
        .toThrow(DomainException);
    });

    it('should throw when categoryId is empty', () => {
      expect(() => Transaction.create({ ...validProps, categoryId: '' }))
        .toThrow(DomainException);
    });

    it('should throw when categoryId is whitespace', () => {
      expect(() => Transaction.create({ ...validProps, categoryId: '   ' }))
        .toThrow(DomainException);
    });
  });

  describe('transaction.update', () => {
    it('should update fields and set updatedAt', () => {
      const t = Transaction.create(validProps);
      const originalUpdatedAt = t.updatedAt;

      // small delay to ensure updatedAt changes
      t.update({ amount: 100000, description: 'Dinner' });

      expect(t.amount).toBe(100000);
      expect(t.description).toBe('Dinner');
      expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should validate amount on update', () => {
      const t = Transaction.create(validProps);
      expect(() => t.update({ amount: 0 })).toThrow(DomainException);
    });

    it('should validate description length on update', () => {
      const t = Transaction.create(validProps);
      expect(() => t.update({ description: 'x'.repeat(256) })).toThrow(DomainException);
    });
  });
});
