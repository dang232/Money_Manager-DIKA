// ponytail: Worker service app module — two MikroORM connections (txn_db + budget_db)
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ScheduleModule } from '@nestjs/schedule';
import { EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { TransactionEntity } from './infrastructure/persistence/transaction.entity';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { SeedDataJob } from './jobs/seed-data.job';
import { DlqRetryJob } from './jobs/dlq-retry.job';

const BUDGET_DB = 'budget';

@Module({
  imports: [
    // ponytail: default context = txn_db so middleware/request-scoped EM work out of the box
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 5432),
      dbName: process.env['DB_NAME'] ?? 'txn_db',
      user: process.env['DB_USER'] ?? 'postgres',
      password: process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [TransactionEntity],
      debug: process.env['NODE_ENV'] !== 'production',
      allowGlobalContext: true,
    }),
    MikroOrmModule.forFeature([TransactionEntity]),
    MikroOrmModule.forRoot({
      contextName: BUDGET_DB,
      driver: PostgreSqlDriver,
      host: process.env['BUDGET_DB_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['BUDGET_DB_PORT'] ?? process.env['DB_PORT'] ?? 5432),
      dbName: process.env['BUDGET_DB_NAME'] ?? 'budget_db',
      user: process.env['BUDGET_DB_USER'] ?? process.env['DB_USER'] ?? 'postgres',
      password: process.env['BUDGET_DB_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [CategoryEntity],
      debug: process.env['NODE_ENV'] !== 'production',
      allowGlobalContext: true,
    }),
    MikroOrmModule.forFeature([CategoryEntity], BUDGET_DB),
    ScheduleModule.forRoot(),
    EventBusModule.forRoot(),
    LoggerModule,
  ],
  providers: [
    SeedDataJob,
    DlqRetryJob,
  ],
})
export class AppModule {}
