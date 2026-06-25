import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity({ tableName: 'transactions' })
export class TransactionEntity extends BaseEntity {
  @Property({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Property({ type: 'decimal', columnType: 'decimal(12,2)' })
  amount!: number;

  @Property({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @Property({ type: 'varchar', length: 10 })
  type!: string;

  @Property({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Property({ type: 'varchar', length: 255 })
  description!: string;

  @Property({ name: 'transaction_date', type: 'date' })
  transactionDate!: Date;
}
