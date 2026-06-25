// ponytail: SeedDataJob — generates 3 months of realistic Vietnamese transaction data
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  constructor(
    @InjectRepository(TransactionEntity) private readonly txRepo: Repository<TransactionEntity>,
    @InjectRepository(CategoryEntity) private readonly catRepo: Repository<CategoryEntity>,
  ) {}

  async execute(userId?: string): Promise<void> {
    const uid = userId ?? UserId.DEFAULT.value;

    // Seed categories
    const categoryIds: Record<string, string> = {};
    for (const cat of DEFAULT_CATEGORIES) {
      const id = uuid();
      categoryIds[cat.name] = id;
      await this.catRepo.save({
        id,
        userId: uid,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
      });
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
      await this.txRepo.save({
        id: uuid(),
        userId: uid,
        amount: 15_000_000,
        currency: 'VND',
        type: TransactionType.INCOME,
        categoryId: categoryIds[incomeCategory.name],
        description: 'Lương tháng',
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), salaryDay),
      });
      totalTransactions++;

      // 15-25 random expenses
      const expenseCount = 15 + Math.floor(Math.random() * 11);
      const maxDay = this.daysInMonth(monthDate);

      for (let i = 0; i < expenseCount; i++) {
        const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const desc = EXPENSE_DESCRIPTIONS[Math.floor(Math.random() * EXPENSE_DESCRIPTIONS.length)];
        const amount = Math.round((10_000 + Math.random() * 490_000) / 1000) * 1000;
        const day = 1 + Math.floor(Math.random() * maxDay);

        await this.txRepo.save({
          id: uuid(),
          userId: uid,
          amount,
          currency: 'VND',
          type: TransactionType.EXPENSE,
          categoryId: categoryIds[cat.name],
          description: desc,
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
        });
        totalTransactions++;
      }
    }

    console.log(`Seeded ${totalTransactions} transactions for 3 months`);
  }

  private daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}
