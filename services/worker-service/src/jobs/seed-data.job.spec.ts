// ponytail: unit tests for SeedDataJob
import { SeedDataJob } from './seed-data.job';
import { TransactionType } from '@money-manager/shared-kernel';

const TEST_USER_ID = '11111111-1111-4111-a111-111111111111';

describe('SeedDataJob', () => {
  let job: SeedDataJob;
  let persistedEntities: any[];

  const mockEm = {
    persist: jest.fn((entity: any) => {
      persistedEntities.push(entity);
    }),
    flush: jest.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    persistedEntities = [];
    jest.clearAllMocks();
    job = new SeedDataJob(mockEm as any, mockEm as any);
  });

  it('generates correct number of transactions (15-25 expenses per month * 3 + 3 salaries)', async () => {
    await job.execute(TEST_USER_ID);

    const { TransactionEntity } = require('../infrastructure/persistence/transaction.entity');
    const transactions = persistedEntities.filter(e => e instanceof TransactionEntity);

    // 3 salary + (15-25)*3 expenses = min 48, max 78
    expect(transactions.length).toBeGreaterThanOrEqual(48);
    expect(transactions.length).toBeLessThanOrEqual(78);
  });

  it('seeds 6 categories', async () => {
    await job.execute(TEST_USER_ID);

    const { CategoryEntity } = require('../infrastructure/persistence/category.entity');
    const categories = persistedEntities.filter(e => e instanceof CategoryEntity);
    expect(categories.length).toBe(6);
  });

  it('all expense amounts are within 10,000 - 500,000 range', async () => {
    await job.execute(TEST_USER_ID);

    const { TransactionEntity } = require('../infrastructure/persistence/transaction.entity');
    const expenses = persistedEntities
      .filter(e => e instanceof TransactionEntity)
      .filter((t: any) => t.type === TransactionType.EXPENSE);

    for (const tx of expenses) {
      expect(tx.amount).toBeGreaterThanOrEqual(10_000);
      expect(tx.amount).toBeLessThanOrEqual(500_000);
    }
  });

  it('salary is 15,000,000 VND', async () => {
    await job.execute(TEST_USER_ID);

    const { TransactionEntity } = require('../infrastructure/persistence/transaction.entity');
    const incomes = persistedEntities
      .filter(e => e instanceof TransactionEntity)
      .filter((t: any) => t.type === TransactionType.INCOME);

    expect(incomes.length).toBe(3);
    for (const tx of incomes) {
      expect(tx.amount).toBe(15_000_000);
    }
  });

  it('all dates are within past 3 months', async () => {
    await job.execute(TEST_USER_ID);

    const { TransactionEntity } = require('../infrastructure/persistence/transaction.entity');
    const transactions = persistedEntities.filter(e => e instanceof TransactionEntity);

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    for (const tx of transactions) {
      const txDate = new Date(tx.transactionDate);
      expect(txDate.getTime()).toBeGreaterThanOrEqual(threeMonthsAgo.getTime());
      expect(txDate.getTime()).toBeLessThanOrEqual(endOfCurrentMonth.getTime());
    }
  });

  it('calls flush for batch insert', async () => {
    await job.execute(TEST_USER_ID);
    // ponytail: flushes both txnEm and budgetEm
    expect(mockEm.flush).toHaveBeenCalledTimes(2);
  });
});
