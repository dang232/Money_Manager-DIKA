// ponytail: Worker service app module — MikroORM + EventBus + jobs
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ScheduleModule } from '@nestjs/schedule';
import { EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { TransactionEntity } from './infrastructure/persistence/transaction.entity';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { SeedDataJob } from './jobs/seed-data.job';
import { DlqRetryJob } from './jobs/dlq-retry.job';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 5432),
      dbName: process.env['DB_NAME'] ?? 'money_manager',
      user: process.env['DB_USER'] ?? 'money_manager',
      password: process.env['DB_PASSWORD'] ?? 'money_manager',
      entities: [TransactionEntity, CategoryEntity],
      debug: process.env['NODE_ENV'] !== 'production',
      allowGlobalContext: true,
    }),
    MikroOrmModule.forFeature([TransactionEntity, CategoryEntity]),
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
