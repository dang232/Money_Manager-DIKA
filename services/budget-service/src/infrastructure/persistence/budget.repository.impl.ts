// ponytail: TypeORM implementation of BudgetRepository
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetPeriod } from '@money-manager/shared-kernel';
import { Budget } from '../../domain/aggregates/budget.aggregate';
import { BudgetRepository } from '../../domain/repositories/budget.repository.port';
import { BudgetEntity } from './budget.entity';
import { BudgetMapper } from './budget.mapper';

@Injectable()
export class BudgetRepositoryImpl implements BudgetRepository {
  constructor(
    @InjectRepository(BudgetEntity) private readonly repo: Repository<BudgetEntity>,
  ) {}

  async findById(id: string): Promise<Budget | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? BudgetMapper.toDomain(entity) : null;
  }

  async save(budget: Budget): Promise<Budget> {
    const entity = BudgetMapper.toEntity(budget);
    const saved = await this.repo.save(entity);
    return BudgetMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByUserAndPeriod(userId: string, period: BudgetPeriod): Promise<Budget[]> {
    const entities = await this.repo.find({
      where: { userId, periodYear: period.year, periodMonth: period.month },
    });
    return entities.map(BudgetMapper.toDomain);
  }

  async findByUserCategoryPeriod(userId: string, categoryId: string, period: BudgetPeriod): Promise<Budget | null> {
    const entity = await this.repo.findOne({
      where: { userId, categoryId, periodYear: period.year, periodMonth: period.month },
    });
    return entity ? BudgetMapper.toDomain(entity) : null;
  }
}
