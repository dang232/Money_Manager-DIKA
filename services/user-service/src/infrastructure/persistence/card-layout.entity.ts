// ponytail: MikroORM entity for card_layouts table
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'card_layouts' })
export class CardLayoutEntity {
  @PrimaryKey({ type: 'uuid' })
  userId!: string;

  @Property({ type: 'jsonb', default: '[]' })
  layout!: { categories: string[]; budgets: string[] };

  @Property({ type: 'int', default: 1 })
  version!: number;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'Date', onUpdate: () => new Date(), onCreate: () => new Date() })
  updatedAt: Date = new Date();
}