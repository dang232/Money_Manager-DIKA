// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { DatabaseModule, EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { TransactionEntity } from './infrastructure/persistence/transaction.entity';
import { TransactionRepositoryImpl } from './infrastructure/persistence/transaction.repository.impl';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.port';
import { CreateTransactionHandler } from './application/handlers/create-transaction.handler';
import { UpdateTransactionHandler } from './application/handlers/update-transaction.handler';
import { DeleteTransactionHandler } from './application/handlers/delete-transaction.handler';
import { GetTransactionsHandler } from './application/handlers/get-transactions.handler';
import { GetTransactionByIdHandler } from './application/handlers/get-transaction-by-id.handler';
import { GetMonthlySummaryHandler } from './application/handlers/get-monthly-summary.handler';
import { GetCategoryBreakdownHandler } from './application/handlers/get-category-breakdown.handler';
import { GetMonthlyTrendHandler } from './application/handlers/get-monthly-trend.handler';
import { GetPeriodStatsHandler } from './application/handlers/get-period-stats.handler';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [
    DatabaseModule.forRoot({
      host: process.env['TXN_DB_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['TXN_DB_PORT'] ?? process.env['DB_PORT'] ?? 5432),
      dbName: process.env['TXN_DB_NAME'] ?? process.env['DB_NAME'] ?? 'txn_db',
      user: process.env['TXN_DB_USER'] ?? process.env['DB_USER'] ?? 'postgres',
      password: process.env['TXN_DB_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [TransactionEntity],
      debug: process.env['NODE_ENV'] !== 'production',
    }),
    DatabaseModule.forFeature([TransactionEntity]),
    EventBusModule.forRoot(),
    LoggerModule,
  ],
  controllers: [TransactionController, HealthController],
  providers: [
    // repository
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepositoryImpl,
    },
    // handlers
    CreateTransactionHandler,
    UpdateTransactionHandler,
    DeleteTransactionHandler,
    GetTransactionsHandler,
    GetTransactionByIdHandler,
    GetMonthlySummaryHandler,
    GetCategoryBreakdownHandler,
    GetMonthlyTrendHandler,
    GetPeriodStatsHandler,
  ],
})
export class AppModule {}
