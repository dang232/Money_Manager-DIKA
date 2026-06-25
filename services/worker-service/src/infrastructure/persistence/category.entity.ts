import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity({ tableName: 'categories' })
export class CategoryEntity extends BaseEntity {
  @Property({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Property({ type: 'varchar', length: 100 })
  name!: string;

  @Property({ type: 'varchar', length: 10 })
  type!: string;

  @Property({ type: 'varchar', length: 50, default: 'default' })
  icon!: string;

  @Property({ type: 'varchar', length: 7, default: '#808080' })
  color!: string;
}
