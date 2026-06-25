// ponytail: Worker service app module — TypeORM + EventBus + jobs
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { TransactionEntity } from './infrastructure/persistence/transaction.entity';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { SeedDataJob } from './jobs/seed-data.job';
import { DlqRetryJob } from './jobs/dlq-retry.job';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 5432),
      username: process.env['DB_USERNAME'] ?? 'money_manager',
      password: process.env['DB_PASSWORD'] ?? 'money_manager',
      database: process.env['DB_NAME'] ?? 'money_manager',
      entities: [TransactionEntity, CategoryEntity],
      synchronize: process.env['NODE_ENV'] !== 'production',
    }),
    TypeOrmModule.forFeature([TransactionEntity, CategoryEntity]),
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
