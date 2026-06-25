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

export interface TransactionRepository extends RepositoryPort<Transaction> {
  findByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  findByPeriod(userId: string, year: number, month: number): Promise<Transaction[]>;
  getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary>;
}

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';
