// ponytail: MikroORM entity for user_profiles table
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ name: 'display_name', type: 'varchar', length: 100, nullable: true })
  displayName!: string | null;

  @Property({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Property({ type: 'varchar', length: 10, default: 'en-US' })
  locale!: string;

  @Property({ type: 'varchar', length: 50, default: 'UTC' })
  timezone!: string;

  @Property({ name: 'default_currency', type: 'varchar', length: 3, default: 'VND' })
  defaultCurrency!: string;

  @Property({ name: 'budget_anchor_day', type: 'int', default: 1 })
  budgetAnchorDay!: number;

  @Property({ name: 'notification_prefs', type: 'jsonb', default: '{}' })
  notificationPrefs!: Record<string, unknown>;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'Date', onUpdate: () => new Date(), onCreate: () => new Date() })
  updatedAt: Date = new Date();
}