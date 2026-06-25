// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventBusModule, CacheModule, LoggerModule } from '@money-manager/infrastructure';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { BudgetEntity } from './infrastructure/persistence/budget.entity';
import { CategoryRepositoryImpl } from './infrastructure/persistence/category.repository.impl';
import { BudgetRepositoryImpl } from './infrastructure/persistence/budget.repository.impl';
import { BudgetCacheService } from './infrastructure/cache/budget-cache.service';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.port';
import { BUDGET_REPOSITORY } from './domain/repositories/budget.repository.port';
import { BudgetProjectionService } from './domain/services/budget-projection.service';
import { CreateCategoryHandler } from './application/handlers/create-category.handler';
import { UpdateCategoryHandler } from './application/handlers/update-category.handler';
import { DeleteCategoryHandler } from './application/handlers/delete-category.handler';
import { GetCategoriesHandler } from './application/handlers/get-categories.handler';
import { SetBudgetHandler } from './application/handlers/set-budget.handler';
import { GetBudgetStatusHandler } from './application/handlers/get-budget-status.handler';
import { GetBudgetProjectionsHandler } from './application/handlers/get-budget-projections.handler';
import { UpdateRunningTotalHandler } from './application/handlers/update-running-total.handler';
import { TransactionCreatedConsumer } from './application/consumers/transaction-created.consumer';
import { TransactionDeletedConsumer } from './application/consumers/transaction-deleted.consumer';
import { CategoryController } from './presentation/controllers/category.controller';
import { BudgetController } from './presentation/controllers/budget.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 5432),
      username: process.env['DB_USERNAME'] ?? 'money_manager',
      password: process.env['DB_PASSWORD'] ?? 'money_manager',
      database: process.env['DB_NAME'] ?? 'money_manager',
      entities: [CategoryEntity, BudgetEntity],
      synchronize: process.env['NODE_ENV'] !== 'production',
    }),
    TypeOrmModule.forFeature([CategoryEntity, BudgetEntity]),
    EventBusModule.forRoot(),
    CacheModule.forRoot({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: Number(process.env['REDIS_PORT'] ?? 6379),
      password: process.env['REDIS_PASSWORD'],
    }),
    LoggerModule,
  ],
  controllers: [CategoryController, BudgetController],
  providers: [
    // repositories
    { provide: CATEGORY_REPOSITORY, useClass: CategoryRepositoryImpl },
    { provide: BUDGET_REPOSITORY, useClass: BudgetRepositoryImpl },
    // domain services
    BudgetProjectionService,
    // cache
    BudgetCacheService,
    // handlers
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    GetCategoriesHandler,
    SetBudgetHandler,
    GetBudgetStatusHandler,
    GetBudgetProjectionsHandler,
    UpdateRunningTotalHandler,
    // consumers
    TransactionCreatedConsumer,
    TransactionDeletedConsumer,
  ],
})
export class AppModule {}
