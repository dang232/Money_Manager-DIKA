// ponytail: MikroORM implementation of TransactionRepository
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { raw } from '@mikro-orm/core';
import { TransactionType } from '@money-manager/shared-kernel';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';
import {
  TransactionRepository,
  TransactionFilters,
  MonthlySummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  PeriodStats,
} from '../../domain/repositories/transaction.repository.port';
import { TransactionEntity } from './transaction.entity';
import { TransactionMapper } from './transaction.mapper';

@Injectable()
export class TransactionRepositoryImpl implements TransactionRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.em.findOne(TransactionEntity, { id });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const entity = TransactionMapper.toEntity(transaction);
    await this.em.upsert(TransactionEntity, entity);
    await this.em.flush();
    return transaction;
  }

  async delete(id: string): Promise<void> {
    await this.em.nativeDelete(TransactionEntity, { id });
  }

  async findByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const where: Record<string, unknown> = { userId };

    if (filters?.categoryId) {
      where['categoryId'] = filters.categoryId;
    }
    if (filters?.type) {
      where['type'] = filters.type;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (filters.dateFrom) dateFilter['$gte'] = filters.dateFrom;
      if (filters.dateTo) dateFilter['$lte'] = filters.dateTo;
      where['transactionDate'] = dateFilter;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const entities = await this.em.find(TransactionEntity, where, {
      orderBy: { transactionDate: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    return entities.map(TransactionMapper.toDomain);
  }

  async findByPeriod(userId: string, year: number, month: number): Promise<Transaction[]> {
    const entities = await this.em.find(
      TransactionEntity,
      {
        userId,
        $and: [
          raw(`EXTRACT(YEAR FROM transaction_date) = ${year}`),
          raw(`EXTRACT(MONTH FROM transaction_date) = ${month}`),
        ],
      },
      { orderBy: { transactionDate: 'DESC' } },
    );

    return entities.map(TransactionMapper.toDomain);
  }

  async getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary> {
    const conn = this.em.getConnection();
    const result = await conn.execute<Array<{ type: string; total: string; count: string }>>(
      `SELECT type, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = ?
         AND EXTRACT(YEAR FROM transaction_date) = ?
         AND EXTRACT(MONTH FROM transaction_date) = ?
       GROUP BY type`,
      [userId, year, month],
    );

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    for (const row of result) {
      const total = Number(row.total) || 0;
      const count = Number(row.count) || 0;
      transactionCount += count;

      if (row.type === TransactionType.INCOME) {
        totalIncome = total;
      } else {
        totalExpense = total;
      }
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      transactionCount,
    };
  }

  async getCategoryBreakdown(userId: string, year: number, month: number): Promise<CategoryBreakdownItem[]> {
    const conn = this.em.getConnection();
    const result = await conn.execute<Array<{ category_id: string; total: string; count: string }>>(
      `SELECT category_id, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = ?
         AND type = 'EXPENSE'
         AND EXTRACT(YEAR FROM transaction_date) = ?
         AND EXTRACT(MONTH FROM transaction_date) = ?
       GROUP BY category_id
       ORDER BY total DESC`,
      [userId, year, month],
    );

    return result.map((row) => ({
      categoryId: row.category_id,
      total: Number(row.total) || 0,
      count: Number(row.count) || 0,
    }));
  }

  async getMonthlyTrend(userId: string, months: number): Promise<MonthlyTrendItem[]> {
    const conn = this.em.getConnection();
    const result = await conn.execute<Array<{ year: string; month: string; type: string; total: string }>>(
      `SELECT EXTRACT(YEAR FROM transaction_date) AS year,
              EXTRACT(MONTH FROM transaction_date) AS month,
              type,
              SUM(amount) AS total
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= (CURRENT_DATE - ? * INTERVAL '1 month')
       GROUP BY year, month, type
       ORDER BY year, month`,
      [userId, months],
    );

    const map = new Map<string, MonthlyTrendItem>();
    for (const row of result) {
      const key = `${row.year}-${row.month}`;
      if (!map.has(key)) {
        map.set(key, { year: Number(row.year), month: Number(row.month), totalIncome: 0, totalExpense: 0 });
      }
      const item = map.get(key)!;
      if (row.type === TransactionType.INCOME) {
        item.totalIncome = Number(row.total) || 0;
      } else {
        item.totalExpense = Number(row.total) || 0;
      }
    }

    return Array.from(map.values());
  }

  async getPeriodStats(userId: string, dateFrom: Date, dateTo: Date): Promise<PeriodStats> {
    const conn = this.em.getConnection();
    // Use ISO date strings to avoid timezone drift with DATE columns
    const fromStr = dateFrom.toISOString().slice(0, 10);
    const toStr = dateTo.toISOString().slice(0, 10);

    // Average daily spend
    const avgResult = await conn.execute<Array<{ avg_daily: string }>>(
      `SELECT COALESCE(SUM(amount) / NULLIF(COUNT(DISTINCT transaction_date), 0), 0) AS avg_daily
       FROM transactions
       WHERE user_id = ?
         AND type = 'EXPENSE'
         AND transaction_date >= ?::date
         AND transaction_date <= ?::date`,
      [userId, fromStr, toStr],
    );
    const avgDailySpend = Number(avgResult[0]?.avg_daily) || 0;

    // Largest single expense
    const largestResult = await conn.execute<Array<{ amount: string; description: string; category_id: string }>>(
      `SELECT amount, description, category_id
       FROM transactions
       WHERE user_id = ?
         AND type = 'EXPENSE'
         AND transaction_date >= ?::date
         AND transaction_date <= ?::date
       ORDER BY amount DESC
       LIMIT 1`,
      [userId, fromStr, toStr],
    );
    const largestExpense = largestResult.length > 0
      ? { amount: Number(largestResult[0].amount), description: largestResult[0].description, categoryId: largestResult[0].category_id }
      : null;

    // Most active day of week
    const dowResult = await conn.execute<Array<{ dow: string; count: string }>>(
      `SELECT EXTRACT(DOW FROM transaction_date) AS dow, COUNT(*) AS count
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= ?::date
         AND transaction_date <= ?::date
       GROUP BY dow
       ORDER BY count DESC
       LIMIT 1`,
      [userId, fromStr, toStr],
    );
    const mostActiveDay = dowResult.length > 0
      ? { dayOfWeek: Number(dowResult[0].dow), count: Number(dowResult[0].count) }
      : null;

    return { avgDailySpend, largestExpense, mostActiveDay };
  }
}
