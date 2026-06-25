// ponytail: TypeORM implementation of TransactionRepository
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly ormRepo: Repository<TransactionEntity>,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const entity = TransactionMapper.toEntity(transaction);
    const saved = await this.ormRepo.save(entity);
    return TransactionMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  async findByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const qb = this.ormRepo.createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (filters?.categoryId) {
      qb.andWhere('t.category_id = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters?.type) {
      qb.andWhere('t.type = :type', { type: filters.type });
    }
    if (filters?.dateFrom) {
      qb.andWhere('t.transaction_date >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters?.dateTo) {
      qb.andWhere('t.transaction_date <= :dateTo', { dateTo: filters.dateTo });
    }

    qb.orderBy('t.transaction_date', 'DESC');

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const entities = await qb.getMany();
    return entities.map(TransactionMapper.toDomain);
  }

  async findByPeriod(userId: string, year: number, month: number): Promise<Transaction[]> {
    const entities = await this.ormRepo.createQueryBuilder('t')
      .where('t.user_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM t.transaction_date) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM t.transaction_date) = :month', { month })
      .orderBy('t.transaction_date', 'DESC')
      .getMany();

    return entities.map(TransactionMapper.toDomain);
  }

  async getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary> {
    const result = await this.ormRepo.createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('t.user_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM t.transaction_date) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM t.transaction_date) = :month', { month })
      .groupBy('t.type')
      .getRawMany();

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
