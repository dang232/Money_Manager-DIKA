// ponytail: unit tests for SeedDataJob
import { SeedDataJob } from './seed-data.job';
import { TransactionType } from '@money-manager/shared-kernel';

describe('SeedDataJob', () => {
  let job: SeedDataJob;
  let savedTransactions: any[];
  let savedCategories: any[];

  const mockTxRepo = {
    save: jest.fn((entity: any) => {
      savedTransactions.push(entity);
      return Promise.resolve(entity);
    }),
  };

  const mockCatRepo = {
    save: jest.fn((entity: any) => {
      savedCategories.push(entity);
      return Promise.resolve(entity);
    }),
  };

  beforeEach(() => {
    savedTransactions = [];
    savedCategories = [];
    jest.clearAllMocks();
    job = new SeedDataJob(mockTxRepo as any, mockCatRepo as any);
  });

  it('generates correct number of transactions (15-25 expenses per month * 3 + 3 salaries)', async () => {
    await job.execute();

    // 3 salary + (15-25)*3 expenses = min 48, max 78
    expect(savedTransactions.length).toBeGreaterThanOrEqual(48);
    expect(savedTransactions.length).toBeLessThanOrEqual(78);
  });

  it('seeds 6 categories', async () => {
    await job.execute();
    expect(savedCategories.length).toBe(6);
  });

  it('all expense amounts are within 10,000 - 500,000 range', async () => {
    await job.execute();

    const expenses = savedTransactions.filter(t => t.type === TransactionType.EXPENSE);
    for (const tx of expenses) {
      expect(tx.amount).toBeGreaterThanOrEqual(10_000);
      expect(tx.amount).toBeLessThanOrEqual(500_000);
    }
  });

  it('salary is 15,000,000 VND', async () => {
    await job.execute();

    const incomes = savedTransactions.filter(t => t.type === TransactionType.INCOME);
    expect(incomes.length).toBe(3);
    for (const tx of incomes) {
      expect(tx.amount).toBe(15_000_000);
    }
  });

  it('all dates are within past 3 months', async () => {
    await job.execute();

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    for (const tx of savedTransactions) {
      const txDate = new Date(tx.transactionDate);
      expect(txDate.getTime()).toBeGreaterThanOrEqual(threeMonthsAgo.getTime());
      expect(txDate.getTime()).toBeLessThanOrEqual(endOfCurrentMonth.getTime());
    }
  });
});
