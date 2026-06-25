// ponytail: TypeORM implementation of CategoryRepository
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from '@money-manager/shared-kernel';
import { Category } from '../../domain/aggregates/category.aggregate';
import { CategoryRepository } from '../../domain/repositories/category.repository.port';
import { CategoryEntity } from './category.entity';
import { CategoryMapper } from './category.mapper';

@Injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity) private readonly repo: Repository<CategoryEntity>,
  ) {}

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async save(category: Category): Promise<Category> {
    const entity = CategoryMapper.toEntity(category);
    const saved = await this.repo.save(entity);
    return CategoryMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const entities = await this.repo.find({ where: { userId } });
    return entities.map(CategoryMapper.toDomain);
  }

  async findByName(userId: string, name: string, type: TransactionType): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { userId, name, type } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }
}
