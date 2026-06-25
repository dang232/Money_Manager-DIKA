// ponytail: mapper between Category domain aggregate and CategoryEntity
import { UserId, TransactionType } from '@money-manager/shared-kernel';
import { Category } from '../../domain/aggregates/category.aggregate';
import { CategoryEntity } from './category.entity';

export class CategoryMapper {
  static toDomain(entity: CategoryEntity): Category {
    return Category.reconstitute(
      entity.id,
      new UserId(entity.userId),
      entity.name,
      entity.type as TransactionType,
      entity.icon,
      entity.color,
      entity.createdAt,
    );
  }

  static toEntity(domain: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.id = domain.id;
    entity.userId = domain.userId.value;
    entity.name = domain.name;
    entity.type = domain.type;
    entity.icon = domain.icon;
    entity.color = domain.color;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
