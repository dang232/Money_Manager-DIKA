// ponytail: SeedDataJob — generates 3 months of realistic Vietnamese transaction data
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TransactionEntity } from '../infrastructure/persistence/transaction.entity';
import { CategoryEntity } from '../infrastructure/persistence/category.entity';
import { UserId, TransactionType } from '@money-manager/shared-kernel';
import { v4 as uuid } from 'uuid';

interface SeedCategory {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: SeedCategory[] = [
  { name: 'Ăn uống', type: TransactionType.EXPENSE, icon: 'utensils', color: '#FF6B6B' },
  { name: 'Di chuyển', type: TransactionType.EXPENSE, icon: 'car', color: '#4ECDC4' },
  { name: 'Mua sắm', type: TransactionType.EXPENSE, icon: 'shopping-bag', color: '#45B7D1' },
  { name: 'Giải trí', type: TransactionType.EXPENSE, icon: 'gamepad', color: '#96CEB4' },
  { name: 'Sức khỏe', type: TransactionType.EXPENSE, icon: 'heart', color: '#FFEAA7' },
  { name: 'Lương', type: TransactionType.INCOME, icon: 'wallet', color: '#00B894' },
];

const EXPENSE_DESCRIPTIONS = [
  'Grab Food - Bún bò',
  'Highland Coffee',
  'Shopee - Áo thun',
  'CGV Cinema',
  'Pharmacity',
  'Grab Car đi làm',
  'Circle K',
  'Bách Hóa Xanh',
  'Điện thoại Viettel',
  'Gym California',
];

@Injectable()
export class SeedDataJob {
  constructor(private readonly em: EntityManager) {}

  async execute(userId?: string): Promise<void> {
    const uid = userId ?? UserId.DEFAULT.value;

    // Seed categories
    const categoryIds: Record<string, string> = {};
    for (const cat of DEFAULT_CATEGORIES) {
      const id = uuid();
      categoryIds[cat.name] = id;
      const entity = new CategoryEntity();
      entity.id = id;
      entity.userId = uid;
      entity.name = cat.name;
      entity.type = cat.type;
      entity.icon = cat.icon;
      entity.color = cat.color;
      this.em.persist(entity);
    }

    const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === TransactionType.EXPENSE);
    const incomeCategory = DEFAULT_CATEGORIES.find(c => c.type === TransactionType.INCOME)!;

    let totalTransactions = 0;
    const now = new Date();

    // Generate 3 months of data
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

      // 1 salary per month
      const salaryDay = Math.min(25, this.daysInMonth(monthDate));
      const salaryTxn = new TransactionEntity();
      salaryTxn.id = uuid();
      salaryTxn.userId = uid;
      salaryTxn.amount = 15_000_000;
      salaryTxn.currency = 'VND';
      salaryTxn.type = TransactionType.INCOME;
      salaryTxn.categoryId = categoryIds[incomeCategory.name];
      salaryTxn.description = 'Lương tháng';
      salaryTxn.transactionDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), salaryDay);
      this.em.persist(salaryTxn);
      totalTransactions++;

      // 15-25 random expenses
      const expenseCount = 15 + Math.floor(Math.random() * 11);
      const maxDay = this.daysInMonth(monthDate);

      for (let i = 0; i < expenseCount; i++) {
        const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const desc = EXPENSE_DESCRIPTIONS[Math.floor(Math.random() * EXPENSE_DESCRIPTIONS.length)];
        const amount = Math.round((10_000 + Math.random() * 490_000) / 1000) * 1000;
        const day = 1 + Math.floor(Math.random() * maxDay);

        const txn = new TransactionEntity();
        txn.id = uuid();
        txn.userId = uid;
        txn.amount = amount;
        txn.currency = 'VND';
        txn.type = TransactionType.EXPENSE;
        txn.categoryId = categoryIds[cat.name];
        txn.description = desc;
        txn.transactionDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        this.em.persist(txn);
        totalTransactions++;
      }
    }

    await this.em.flush(); // single batch insert
    console.log(`Seeded ${totalTransactions} transactions for 3 months`);
  }

  private daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}
