// ponytail: shared base entity — id, timestamps, soft delete for all tables
import { PrimaryKey, Property, BaseEntity as MikroBaseEntity } from '@mikro-orm/core';

export abstract class BaseEntity extends MikroBaseEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'Date', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'Date', onUpdate: () => new Date(), onCreate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'Date', nullable: true })
  deletedAt?: Date;
}
