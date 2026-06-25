// ponytail: Transaction aggregate — core domain entity
import { Money, UserId, TransactionType, DomainException, generateUuid } from '@money-manager/shared-kernel';

export interface CreateTransactionProps {
  userId: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: Date;
}

export interface UpdateTransactionProps {
  amount?: number;
  currency?: string;
  type?: TransactionType;
  categoryId?: string;
  description?: string;
  date?: Date;
}

export class Transaction {
  readonly id: string;
  readonly userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: Date;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    categoryId: string;
    description: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.type = props.type;
    this.categoryId = props.categoryId;
    this.description = props.description;
    this.date = props.date;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateTransactionProps): Transaction {
    Transaction.validateAmount(props.amount);
    Transaction.validateDate(props.date);
    Transaction.validateDescription(props.description);
    Transaction.validateCategoryId(props.categoryId);

    const now = new Date();
    return new Transaction({
      id: generateUuid(),
      userId: props.userId,
      amount: props.amount,
      currency: props.currency ?? 'VND',
      type: props.type,
      categoryId: props.categoryId,
      description: props.description,
      date: props.date,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    categoryId: string;
    description: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Transaction {
    return new Transaction(props);
  }

  update(props: UpdateTransactionProps): void {
    if (props.amount !== undefined) {
      Transaction.validateAmount(props.amount);
      this.amount = props.amount;
    }
    if (props.currency !== undefined) {
      this.currency = props.currency;
    }
    if (props.type !== undefined) {
      this.type = props.type;
    }
    if (props.categoryId !== undefined) {
      Transaction.validateCategoryId(props.categoryId);
      this.categoryId = props.categoryId;
    }
    if (props.description !== undefined) {
      Transaction.validateDescription(props.description);
      this.description = props.description;
    }
    if (props.date !== undefined) {
      Transaction.validateDate(props.date);
      this.date = props.date;
    }
    this.updatedAt = new Date();
  }

  private static validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new DomainException('Transaction amount must be greater than 0', 'INVALID_AMOUNT');
    }
  }

  private static validateDate(date: Date): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (date >= tomorrow) {
      throw new DomainException('Transaction date cannot be in the future', 'INVALID_DATE');
    }
  }

  private static validateDescription(description: string): void {
    if (description.length > 255) {
      throw new DomainException('Description must not exceed 255 characters', 'INVALID_DESCRIPTION');
    }
  }

  private static validateCategoryId(categoryId: string): void {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new DomainException('Category ID must not be empty', 'INVALID_CATEGORY');
    }
  }
}
