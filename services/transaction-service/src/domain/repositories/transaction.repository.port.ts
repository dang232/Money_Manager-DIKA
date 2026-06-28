// ponytail: repository port for Transaction aggregate
import { RepositoryPort, TransactionType } from '@money-manager/shared-kernel';
import { Transaction } from '../aggregates/transaction.aggregate';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  total: number;
  count: number;
}

export interface MonthlyTrendItem {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
}

export interface PeriodStats {
  avgDailySpend: number;
  largestExpense: { amount: number; description: string; categoryId: string } | null;
  mostActiveDay: { dayOfWeek: number; count: number } | null;
}

export interface TransactionRepository extends RepositoryPort<Transaction> {
  findByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  findByPeriod(userId: string, year: number, month: number): Promise<Transaction[]>;
  getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary>;
  getCategoryBreakdown(userId: string, year: number, month: number): Promise<CategoryBreakdownItem[]>;
  getMonthlyTrend(userId: string, months: number): Promise<MonthlyTrendItem[]>;
  getPeriodStats(userId: string, dateFrom: Date, dateTo: Date): Promise<PeriodStats>;
}

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';
