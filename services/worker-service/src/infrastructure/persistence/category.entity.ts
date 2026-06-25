// ponytail: TypeORM entity for categories (used by seed job)
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity('categories')
export class CategoryEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: string;

  @Column({ type: 'varchar', length: 50, default: 'default' })
  icon!: string;

  @Column({ type: 'varchar', length: 7, default: '#808080' })
  color!: string;
}
