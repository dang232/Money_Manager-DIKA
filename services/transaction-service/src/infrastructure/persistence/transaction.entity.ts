// ponytail: TypeORM entity for transactions table
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity('transactions')
@Index(['userId', 'transactionDate'])
@Index(['userId', 'categoryId'])
export class TransactionEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate!: Date;
}
