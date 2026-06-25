import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TransactionType, generateUuid, EventBusPort, ApiExceptionFilter } from '@money-manager/shared-kernel';
import { Transaction } from '../src/domain/aggregates/transaction.aggregate';
import {
  TransactionRepository,
  TransactionFilters,
  MonthlySummary,
  TRANSACTION_REPOSITORY,
} from '../src/domain/repositories/transaction.repository.port';
import { EVENT_BUS_PORT } from '@money-manager/infrastructure';
import { TransactionController } from '../src/presentation/controllers/transaction.controller';
import { CreateTransactionHandler } from '../src/application/handlers/create-transaction.handler';
import { UpdateTransactionHandler } from '../src/application/handlers/update-transaction.handler';
import { DeleteTransactionHandler } from '../src/application/handlers/delete-transaction.handler';
import { GetTransactionsHandler } from '../src/application/handlers/get-transactions.handler';
import { GetTransactionByIdHandler } from '../src/application/handlers/get-transaction-by-id.handler';
import { GetMonthlySummaryHandler } from '../src/application/handlers/get-monthly-summary.handler';

class InMemoryTransactionRepository implements TransactionRepository {
  private store = new Map<string, Transaction>();

  async findById(id: string): Promise<Transaction | null> {
    return this.store.get(id) ?? null;
  }

  async save(entity: Transaction): Promise<Transaction> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    let results = Array.from(this.store.values()).filter((t) => t.userId === userId);

    if (filters?.categoryId) {
      results = results.filter((t) => t.categoryId === filters.categoryId);
    }
    if (filters?.type) {
      results = results.filter((t) => t.type === filters.type);
    }
    if (filters?.dateFrom) {
      results = results.filter((t) => t.date >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      results = results.filter((t) => t.date <= filters.dateTo!);
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const start = (page - 1) * limit;
    return results.slice(start, start + limit);
  }

  async findByPeriod(userId: string, year: number, month: number): Promise<Transaction[]> {
    return Array.from(this.store.values()).filter((t) => {
      if (t.userId !== userId) return false;
      return t.date.getFullYear() === year && t.date.getMonth() + 1 === month;
    });
  }

  async getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary> {
    const transactions = await this.findByPeriod(userId, year, month);
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === TransactionType.INCOME) {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Transactions E2E', () => {
  let app: INestApplication;
  let repo: InMemoryTransactionRepository;
  let mockEventBus: EventBusPort;

  beforeAll(async () => {
    repo = new InMemoryTransactionRepository();
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        { provide: TRANSACTION_REPOSITORY, useValue: repo },
        { provide: EVENT_BUS_PORT, useValue: mockEventBus },
        CreateTransactionHandler,
        UpdateTransactionHandler,
        DeleteTransactionHandler,
        GetTransactionsHandler,
        GetTransactionByIdHandler,
        GetMonthlySummaryHandler,
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
    repo.clear();
    jest.clearAllMocks();
  });

  const validCategoryId = '11111111-1111-4111-a111-111111111111';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const validCreateDto = {
    amount: 50000,
    type: TransactionType.EXPENSE,
    categoryId: validCategoryId,
    description: 'Test transaction',
    date: yesterdayStr,
  };

  describe('POST /transactions', () => {
    it('creates a transaction and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/transactions')
        .send(validCreateDto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.amount).toBe(50000);
      expect(res.body.data.type).toBe(TransactionType.EXPENSE);
      expect(res.body.data.categoryId).toBe(validCategoryId);
      expect(res.body.data.description).toBe('Test transaction');
      expect(res.body.data.currency).toBe('VND');
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('returns 400 for amount of 0', async () => {
      const res = await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, amount: 0 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('message');
    });

    it('returns 400 for negative amount', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, amount: -100 })
        .expect(400);
    });

    it('returns 400 for future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, date: futureDate.toISOString().split('T')[0] })
        .expect(400);
    });

    it('returns 400 for description exceeding 255 characters', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, description: 'a'.repeat(256) })
        .expect(400);
    });

    it('returns 400 for invalid type', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, type: 'INVALID' })
        .expect(400);
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({})
        .expect(400);
    });
  });

  describe('GET /transactions', () => {
    it('returns paginated list of transactions', async () => {
      await request(app.getHttpServer()).post('/transactions').send(validCreateDto);
      await request(app.getHttpServer()).post('/transactions').send({
        ...validCreateDto,
        amount: 100000,
        type: TransactionType.INCOME,
      });

      const res = await request(app.getHttpServer())
        .get('/transactions')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('returns empty array when no transactions exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/transactions')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('supports pagination via query params', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/transactions')
          .send({ ...validCreateDto, amount: (i + 1) * 10000 });
      }

      const res = await request(app.getHttpServer())
        .get('/transactions?page=1&limit=2')
        .expect(200);

      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /transactions/:id', () => {
    it('returns a single transaction', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/transactions')
        .send(validCreateDto);

      const res = await request(app.getHttpServer())
        .get(`/transactions/${createRes.body.data.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createRes.body.data.id);
      expect(res.body.data.amount).toBe(50000);
    });

    it('returns 404 for non-existent transaction', async () => {
      const fakeId = generateUuid();
      const res = await request(app.getHttpServer())
        .get(`/transactions/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/transactions/not-a-uuid')
        .expect(400);
    });
  });

  describe('PUT /transactions/:id', () => {
    it('updates a transaction and returns 200', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/transactions')
        .send(validCreateDto);

      const res = await request(app.getHttpServer())
        .put(`/transactions/${createRes.body.data.id}`)
        .send({ amount: 75000, description: 'Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(75000);
      expect(res.body.data.description).toBe('Updated');
    });

    it('returns 404 for non-existent transaction', async () => {
      const fakeId = generateUuid();
      const res = await request(app.getHttpServer())
        .put(`/transactions/${fakeId}`)
        .send({ amount: 75000 })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('deletes a transaction and returns 204', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/transactions')
        .send(validCreateDto);

      await request(app.getHttpServer())
        .delete(`/transactions/${createRes.body.data.id}`)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/transactions/${createRes.body.data.id}`)
        .expect(404);
    });

    it('returns 404 for non-existent transaction', async () => {
      const fakeId = generateUuid();
      await request(app.getHttpServer())
        .delete(`/transactions/${fakeId}`)
        .expect(404);
    });
  });

  describe('GET /transactions/summary', () => {
    it('returns monthly summary with totals', async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, amount: 200000, type: TransactionType.INCOME });

      await request(app.getHttpServer())
        .post('/transactions')
        .send({ ...validCreateDto, amount: 50000, type: TransactionType.EXPENSE });

      const res = await request(app.getHttpServer())
        .get(`/transactions/summary?year=${currentYear}&month=${currentMonth}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalIncome');
      expect(res.body.data).toHaveProperty('totalExpense');
      expect(res.body.data).toHaveProperty('net');
      expect(res.body.data).toHaveProperty('transactionCount');
      expect(res.body.data).toHaveProperty('period');
    });

    it('returns zero totals for empty period', async () => {
      const res = await request(app.getHttpServer())
        .get('/transactions/summary?year=2020&month=1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.totalExpense).toBe(0);
      expect(res.body.data.net).toBe(0);
      expect(res.body.data.transactionCount).toBe(0);
    });
  });
});
