// ponytail: TypeORM entity for budgets table
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity('budgets')
@Unique(['userId', 'categoryId', 'periodYear', 'periodMonth'])
export class BudgetEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ name: 'monthly_limit', type: 'decimal', precision: 12, scale: 2 })
  monthlyLimit!: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @Column({ name: 'period_year', type: 'int' })
  periodYear!: number;

  @Column({ name: 'period_month', type: 'int' })
  periodMonth!: number;

  @Column({ name: 'running_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  runningTotal!: number;
}
