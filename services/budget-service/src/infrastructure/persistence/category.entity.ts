// ponytail: TypeORM entity for categories table
import { Entity, PrimaryColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('categories')
@Unique(['userId', 'name', 'type'])
export class CategoryEntity {
  @PrimaryColumn('uuid')
  id!: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
