// ponytail: Category aggregate — spending classification with icon and color
import { UserId, TransactionType, DomainException, generateUuid } from '@money-manager/shared-kernel';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export interface CreateCategoryProps {
  userId: UserId;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export class Category {
  readonly id: string;
  readonly userId: UserId;
  name: string;
  readonly type: TransactionType;
  icon: string;
  color: string;
  readonly createdAt: Date;

  private constructor(id: string, userId: UserId, name: string, type: TransactionType, icon: string, color: string, createdAt: Date) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.type = type;
    this.icon = icon;
    this.color = color;
    this.createdAt = createdAt;
  }

  static create(props: CreateCategoryProps): Category {
    Category.validateName(props.name);
    Category.validateColor(props.color);
    return new Category(generateUuid(), props.userId, props.name.trim(), props.type, props.icon, props.color, new Date());
  }

  static reconstitute(id: string, userId: UserId, name: string, type: TransactionType, icon: string, color: string, createdAt: Date): Category {
    return new Category(id, userId, name, type, icon, color, createdAt);
  }

  update(partial: Partial<Pick<Category, 'name' | 'icon' | 'color'>>): void {
    if (partial.name !== undefined) {
      Category.validateName(partial.name);
      this.name = partial.name.trim();
    }
    if (partial.color !== undefined) {
      Category.validateColor(partial.color);
      this.color = partial.color;
    }
    if (partial.icon !== undefined) {
      this.icon = partial.icon;
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Category name cannot be empty', 'CATEGORY_NAME_EMPTY');
    }
    if (name.trim().length > 100) {
      throw new DomainException('Category name cannot exceed 100 characters', 'CATEGORY_NAME_TOO_LONG');
    }
  }

  private static validateColor(color: string): void {
    if (!HEX_COLOR_REGEX.test(color)) {
      throw new DomainException('Color must be a valid hex color (e.g. #FF0000)', 'INVALID_COLOR');
    }
  }
}
