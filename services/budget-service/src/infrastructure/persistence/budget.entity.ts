import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity({ tableName: 'budgets' })
@Unique({ properties: ['userId', 'categoryId', 'periodYear', 'periodMonth'] })
export class BudgetEntity extends BaseEntity {
  @Property({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Property({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Property({ name: 'monthly_limit', type: 'decimal', columnType: 'decimal(12,2)' })
  monthlyLimit!: number;

  @Property({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @Property({ name: 'period_year', type: 'int' })
  periodYear!: number;

  @Property({ name: 'period_month', type: 'int' })
  periodMonth!: number;

  @Property({ name: 'running_total', type: 'decimal', columnType: 'decimal(12,2)', default: 0 })
  runningTotal!: number;
}
