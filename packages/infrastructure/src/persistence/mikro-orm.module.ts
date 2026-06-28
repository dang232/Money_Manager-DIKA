import { DynamicModule, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import type { MaybePromise } from '@mikro-orm/core';

export interface MikroOrmConfig {
  host: string;
  port: number;
  dbName: string;
  user: string;
  password: string;
  entities: any[];
  debug?: boolean;
  // ponytail: contextName for multi-DB services (worker-service uses two connections)
  contextName?: string;
}

@Module({})
export class DatabaseModule {
  static forRoot(config: MikroOrmConfig): MaybePromise<DynamicModule> {
    return MikroOrmModule.forRoot({
      ...(config.contextName ? { contextName: config.contextName } : {}),
      driver: PostgreSqlDriver,
      host: config.host,
      port: config.port,
      dbName: config.dbName,
      user: config.user,
      password: config.password,
      entities: config.entities,
      debug: config.debug ?? false,
      allowGlobalContext: true,
      schemaGenerator: { disableForeignKeys: false },
    });
  }

  static forFeature(entities: any[], contextName?: string): DynamicModule {
    return contextName
      ? MikroOrmModule.forFeature(entities, contextName)
      : MikroOrmModule.forFeature(entities);
  }
}
