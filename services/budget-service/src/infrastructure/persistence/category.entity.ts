// ponytail: TypeORM entity for categories table
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity('categories')
@Unique(['userId', 'name', 'type'])
export class CategoryEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: string;

  @Column({ type: 'varchar', length: 50 })
  icon!: string;

  @Column({ type: 'varchar', length: 7 })
  color!: string;
}
