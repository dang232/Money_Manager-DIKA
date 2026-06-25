// ponytail: mapper between Budget domain aggregate and BudgetEntity
import { UserId, Money, BudgetPeriod } from '@money-manager/shared-kernel';
import { Budget } from '../../domain/aggregates/budget.aggregate';
import { BudgetEntity } from './budget.entity';

export class BudgetMapper {
  static toDomain(entity: BudgetEntity): Budget {
    return Budget.reconstitute(
      entity.id,
      new UserId(entity.userId),
      entity.categoryId,
      new Money(Number(entity.monthlyLimit), entity.currency),
      new BudgetPeriod(entity.periodYear, entity.periodMonth),
      new Money(Number(entity.runningTotal), entity.currency),
      entity.createdAt,
    );
  }

  static toEntity(domain: Budget): BudgetEntity {
    const entity = new BudgetEntity();
    entity.id = domain.id;
    entity.userId = domain.userId.value;
    entity.categoryId = domain.categoryId;
    entity.monthlyLimit = domain.monthlyLimit.amount;
    entity.currency = domain.monthlyLimit.currency;
    entity.periodYear = domain.period.year;
    entity.periodMonth = domain.period.month;
    entity.runningTotal = domain.runningTotal.amount;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
