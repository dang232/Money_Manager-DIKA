// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EventBusModule, LoggerModule } from '@money-manager/infrastructure';
import { TransactionEntity } from './infrastructure/persistence/transaction.entity';
import { TransactionRepositoryImpl } from './infrastructure/persistence/transaction.repository.impl';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.port';
import { CreateTransactionHandler } from './application/handlers/create-transaction.handler';
import { UpdateTransactionHandler } from './application/handlers/update-transaction.handler';
import { DeleteTransactionHandler } from './application/handlers/delete-transaction.handler';
import { GetTransactionsHandler } from './application/handlers/get-transactions.handler';
import { GetTransactionByIdHandler } from './application/handlers/get-transaction-by-id.handler';
import { GetMonthlySummaryHandler } from './application/handlers/get-monthly-summary.handler';
import { TransactionController } from './presentation/controllers/transaction.controller';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 5432),
      dbName: process.env['DB_NAME'] ?? 'money_manager',
      user: process.env['DB_USERNAME'] ?? 'money_manager',
      password: process.env['DB_PASSWORD'] ?? 'money_manager',
      entities: [TransactionEntity],
      debug: process.env['NODE_ENV'] !== 'production',
      allowGlobalContext: true,
    }),
    MikroOrmModule.forFeature([TransactionEntity]),
    EventBusModule.forRoot(),
    LoggerModule,
  ],
  controllers: [TransactionController],
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
  ],
})
export class AppModule {}
