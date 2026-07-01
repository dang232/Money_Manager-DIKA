// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { DatabaseModule, EventBusModule, CacheModule, LoggerModule } from '@money-manager/infrastructure';
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
import { DeleteBudgetHandler } from './application/handlers/delete-budget.handler';
import { UpdateRunningTotalHandler } from './application/handlers/update-running-total.handler';
import { TransactionCreatedConsumer } from './application/consumers/transaction-created.consumer';
import { TransactionDeletedConsumer } from './application/consumers/transaction-deleted.consumer';
import { CategoryController } from './presentation/controllers/category.controller';
import { BudgetController } from './presentation/controllers/budget.controller';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [
    DatabaseModule.forRoot({
      host: process.env['BUDGET_DB_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['BUDGET_DB_PORT'] ?? process.env['DB_PORT'] ?? 5432),
      dbName: process.env['BUDGET_DB_NAME'] ?? process.env['DB_NAME'] ?? 'budget_db',
      user: process.env['BUDGET_DB_USER'] ?? process.env['DB_USER'] ?? 'postgres',
      password: process.env['BUDGET_DB_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [CategoryEntity, BudgetEntity],
      debug: process.env['NODE_ENV'] !== 'production',
    }),
    DatabaseModule.forFeature([CategoryEntity, BudgetEntity]),
    EventBusModule.forRoot(),
    CacheModule.forRoot({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: Number(process.env['REDIS_PORT'] ?? 6379),
      password: process.env['REDIS_PASSWORD'],
    }),
    LoggerModule,
  ],
  controllers: [CategoryController, BudgetController, HealthController],
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
    DeleteBudgetHandler,
    UpdateRunningTotalHandler,
    // consumers
    TransactionCreatedConsumer,
    TransactionDeletedConsumer,
  ],
})
export class AppModule {}
