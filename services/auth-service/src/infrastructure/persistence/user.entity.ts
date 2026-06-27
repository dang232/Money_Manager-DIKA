// ponytail: MikroORM entity for users table
import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity({ tableName: 'users' })
@Unique({ properties: ['email'] })
export class UserEntity extends BaseEntity {
  @Property({ type: 'varchar', length: 254 })
  email!: string;

  @Property({ name: 'password_hash', type: 'varchar', length: 60 })
  passwordHash!: string;

  @Property({ name: 'display_name', type: 'varchar', length: 100 })
  displayName!: string;
}