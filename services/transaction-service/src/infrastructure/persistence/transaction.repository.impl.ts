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
}
