// ponytail: mapper between domain Transaction and MikroORM TransactionEntity
import { TransactionType } from '@money-manager/shared-kernel';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';
import { TransactionEntity } from './transaction.entity';

export class TransactionMapper {
  static toDomain(entity: TransactionEntity): Transaction {
    return Transaction.reconstitute({
      id: entity.id,
      userId: entity.userId,
      amount: Number(entity.amount),
      currency: entity.currency,
      type: entity.type as TransactionType,
      categoryId: entity.categoryId,
      description: entity.description,
      date: new Date(entity.transactionDate),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toEntity(domain: Transaction): TransactionEntity {
    const entity = new TransactionEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.amount = domain.amount;
    entity.currency = domain.currency;
    entity.type = domain.type;
    entity.categoryId = domain.categoryId;
    entity.description = domain.description;
    entity.transactionDate = domain.date;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
