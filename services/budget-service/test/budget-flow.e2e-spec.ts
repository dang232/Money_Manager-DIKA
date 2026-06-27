import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import {
  TransactionType,
  generateUuid,
  EventBusPort,
  UserId,
  Money,
  BudgetPeriod,
  ApiExceptionFilter,
} from '@money-manager/shared-kernel';
import { Category } from '../src/domain/aggregates/category.aggregate';
import { Budget } from '../src/domain/aggregates/budget.aggregate';
import { CategoryRepository, CATEGORY_REPOSITORY } from '../src/domain/repositories/category.repository.port';
import { BudgetRepository, BUDGET_REPOSITORY } from '../src/domain/repositories/budget.repository.port';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { CategoryController } from '../src/presentation/controllers/category.controller';
import { BudgetController } from '../src/presentation/controllers/budget.controller';
import { CreateCategoryHandler } from '../src/application/handlers/create-category.handler';
import { UpdateCategoryHandler } from '../src/application/handlers/update-category.handler';
import { DeleteCategoryHandler } from '../src/application/handlers/delete-category.handler';
import { GetCategoriesHandler } from '../src/application/handlers/get-categories.handler';
import { SetBudgetHandler } from '../src/application/handlers/set-budget.handler';
import { GetBudgetStatusHandler } from '../src/application/handlers/get-budget-status.handler';
import { GetBudgetProjectionsHandler } from '../src/application/handlers/get-budget-projections.handler';
import { BudgetProjectionService } from '../src/domain/services/budget-projection.service';

class InMemoryCategoryRepository implements CategoryRepository {
  private store = new Map<string, Category>();

  async findById(id: string): Promise<Category | null> {
    return this.store.get(id) ?? null;
  }

  async save(entity: Category): Promise<Category> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return Array.from(this.store.values()).filter(
      (c) => c.userId.value === userId || c.userId.toString() === userId,
    );
  }

  async findByName(userId: string, name: string, type: TransactionType): Promise<Category | null> {
    return (
      Array.from(this.store.values()).find(
        (c) =>
          (c.userId.value === userId || c.userId.toString() === userId) &&
          c.name.toLowerCase() === name.toLowerCase() &&
          c.type === type,
      ) ?? null
    );
  }

  clear(): void {
    this.store.clear();
  }
}

class InMemoryBudgetRepository implements BudgetRepository {
  private store = new Map<string, Budget>();

  async findById(id: string): Promise<Budget | null> {
    return this.store.get(id) ?? null;
  }

  async save(entity: Budget): Promise<Budget> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findByUserAndPeriod(userId: string, period: BudgetPeriod): Promise<Budget[]> {
    return Array.from(this.store.values()).filter(
      (b) =>
        (b.userId.value === userId || b.userId.toString() === userId) &&
        b.period.equals(period),
    );
  }

  async findByUserCategoryPeriod(
    userId: string,
    categoryId: string,
    period: BudgetPeriod,
  ): Promise<Budget | null> {
    return (
      Array.from(this.store.values()).find(
        (b) =>
          (b.userId.value === userId || b.userId.toString() === userId) &&
          b.categoryId === categoryId &&
          b.period.equals(period),
      ) ?? null
    );
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Budget Flow E2E', () => {
  let app: INestApplication;
  let categoryRepo: InMemoryCategoryRepository;
  let budgetRepo: InMemoryBudgetRepository;
  let mockEventBus: EventBusPort;

  beforeAll(async () => {
    categoryRepo = new InMemoryCategoryRepository();
    budgetRepo = new InMemoryBudgetRepository();
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController, BudgetController],
      providers: [
        { provide: CATEGORY_REPOSITORY, useValue: categoryRepo },
        { provide: BUDGET_REPOSITORY, useValue: budgetRepo },
        { provide: EVENT_BUS_PORT, useValue: mockEventBus },
        BudgetProjectionService,
        CreateCategoryHandler,
        UpdateCategoryHandler,
        DeleteCategoryHandler,
        GetCategoriesHandler,
        SetBudgetHandler,
        GetBudgetStatusHandler,
        GetBudgetProjectionsHandler,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    categoryRepo.clear();
    budgetRepo.clear();
    jest.clearAllMocks();
  });

  const validCategoryDto = {
    name: 'Food & Dining',
    type: TransactionType.EXPENSE,
    icon: 'utensils',
    color: '#FF5733',
  };

  describe('POST /categories', () => {
    it('creates a category and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send(validCategoryDto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Food & Dining');
      expect(res.body.data.type).toBe(TransactionType.EXPENSE);
      expect(res.body.data.icon).toBe('utensils');
      expect(res.body.data.color).toBe('#FF5733');
      expect(res.body.data).toHaveProperty('createdAt');
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('returns 400 for duplicate name+type combination', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send(validCategoryDto)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/categories')
        .send(validCategoryDto)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error.code).toBe('CATEGORY_DUPLICATE');
    });

    it('allows same name with different type', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send(validCategoryDto)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/categories')
        .send({ ...validCategoryDto, type: TransactionType.INCOME })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('returns 400 for invalid color format', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ ...validCategoryDto, color: 'not-a-color' })
        .expect(400);
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({})
        .expect(400);
    });

    it('returns 400 for empty name', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ ...validCategoryDto, name: '' })
        .expect(400);
    });
  });

  describe('GET /categories', () => {
    it('returns all categories', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send(validCategoryDto);

      await request(app.getHttpServer())
        .post('/categories')
        .send({ ...validCategoryDto, name: 'Transport', icon: 'car', color: '#00FF00' });

      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('returns empty array when no categories exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /budgets', () => {
    it('creates a budget for a category and returns 201', async () => {
      const now = new Date();
      const categoryId = generateUuid();

      const res = await request(app.getHttpServer())
        .post('/budgets')
        .send({
          categoryId,
          monthlyLimit: 5000000,
          currency: 'VND',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('budgetId');
      expect(res.body.data.categoryId).toBe(categoryId);
      expect(res.body.data.monthlyLimit).toBe(5000000);
      expect(res.body.data.currency).toBe('VND');
      expect(res.body.data.runningTotal).toBe(0);
      expect(res.body.data.usagePercentage).toBe(0);
      expect(res.body.data.isExceeded).toBe(false);
    });

    it('updates existing budget for same category+period', async () => {
      const now = new Date();
      const categoryId = generateUuid();
      const budgetDto = {
        categoryId,
        monthlyLimit: 5000000,
        currency: 'VND',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      };

      await request(app.getHttpServer())
        .post('/budgets')
        .send(budgetDto)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/budgets')
        .send({ ...budgetDto, monthlyLimit: 8000000 })
        .expect(201);

      expect(res.body.data.monthlyLimit).toBe(8000000);
    });

    it('returns 400 for invalid monthlyLimit', async () => {
      await request(app.getHttpServer())
        .post('/budgets')
        .send({
          categoryId: generateUuid(),
          monthlyLimit: -100,
          currency: 'VND',
          year: 2025,
          month: 6,
        })
        .expect(400);
    });

    it('returns 400 for invalid month', async () => {
      await request(app.getHttpServer())
        .post('/budgets')
        .send({
          categoryId: generateUuid(),
          monthlyLimit: 5000000,
          currency: 'VND',
          year: 2025,
          month: 13,
        })
        .expect(400);
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/budgets')
        .send({})
        .expect(400);
    });
  });

  describe('GET /budgets', () => {
    it('returns budget status with usage percentage', async () => {
      const now = new Date();
      const categoryId = generateUuid();

      await request(app.getHttpServer())
        .post('/budgets')
        .send({
          categoryId,
          monthlyLimit: 5000000,
          currency: 'VND',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        });

      const res = await request(app.getHttpServer())
        .get(`/budgets?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty('budgetId');
      expect(res.body.data[0]).toHaveProperty('categoryId');
      expect(res.body.data[0]).toHaveProperty('monthlyLimit');
      expect(res.body.data[0]).toHaveProperty('runningTotal');
      expect(res.body.data[0]).toHaveProperty('usagePercentage');
      expect(res.body.data[0]).toHaveProperty('isExceeded');
    });

    it('returns empty array when no budgets exist for period', async () => {
      const res = await request(app.getHttpServer())
        .get('/budgets?year=2020&month=1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /budgets/projections', () => {
    it('returns projection data for budgets', async () => {
      const now = new Date();
      const categoryId = generateUuid();

      await request(app.getHttpServer())
        .post('/budgets')
        .send({
          categoryId,
          monthlyLimit: 5000000,
          currency: 'VND',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        });

      const res = await request(app.getHttpServer())
        .get(`/budgets/projections?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty('budgetId');
      expect(res.body.data[0]).toHaveProperty('categoryId');
      expect(res.body.data[0]).toHaveProperty('dailyVelocity');
      expect(res.body.data[0]).toHaveProperty('projectedOverageDate');
      expect(res.body.data[0]).toHaveProperty('daysUntilExceeded');
    });

    it('returns empty array when no budgets exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/budgets/projections?year=2020&month=1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });
});
