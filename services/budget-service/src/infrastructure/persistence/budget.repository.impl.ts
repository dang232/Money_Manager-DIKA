import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BudgetPeriod } from '@money-manager/shared-kernel';
import { Budget } from '../../domain/aggregates/budget.aggregate';
import { BudgetRepository } from '../../domain/repositories/budget.repository.port';
import { BudgetEntity } from './budget.entity';
import { BudgetMapper } from './budget.mapper';

@Injectable()
export class BudgetRepositoryImpl implements BudgetRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Budget | null> {
    const entity = await this.em.findOne(BudgetEntity, { id });
    return entity ? BudgetMapper.toDomain(entity) : null;
  }

  async save(budget: Budget): Promise<Budget> {
    const entity = BudgetMapper.toEntity(budget);
    const saved = await this.em.upsert(BudgetEntity, entity);
    await this.em.flush();
    return BudgetMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.em.nativeDelete(BudgetEntity, { id });
  }

  async findByUserAndPeriod(userId: string, period: BudgetPeriod): Promise<Budget[]> {
    const entities = await this.em.find(BudgetEntity, {
      userId,
      periodYear: period.year,
      periodMonth: period.month,
    });
    return entities.map(BudgetMapper.toDomain);
  }

  async findByUserCategoryPeriod(userId: string, categoryId: string, period: BudgetPeriod): Promise<Budget | null> {
    const entity = await this.em.findOne(BudgetEntity, {
      userId,
      categoryId,
      periodYear: period.year,
      periodMonth: period.month,
    });
    return entity ? BudgetMapper.toDomain(entity) : null;
  }
}
