# Card Layout Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full three-layer persistence system for draggable card layouts (categories & budgets) with Redis caching, version-based conflict resolution, and offline support.

**Architecture:** Card layouts stored per-user in PostgreSQL with Redis caching. Frontend uses localStorage + debounced API + sendBeacon for reliable persistence across devices and network interruptions.

**Tech Stack:** NestJS v11, Vue 3, PostgreSQL JSONB, Redis, vue-draggable-plus

---

## File Structure

```
services/user-service/src/
├── domain/
│   └── card-layout.entity.ts          # Domain entity
├── application/
│   ├── handlers/
│   │   ├── get-card-layout.handler.ts
│   │   ├── update-card-layout.handler.ts
│   │   └── beacon-card-layout.handler.ts
│   ├── commands/
│   │   └── update-card-layout.command.ts
│   └── queries/
│       └── get-card-layout.query.ts
├── infrastructure/
│   ├── repositories/
│   │   └── card-layout.repository.ts  # PostgreSQL + Redis
│   └── cache/
│       └── layout-cache.service.ts     # Redis caching
└── presentation/
    ├── controllers/
    │   └── card-layout.controller.ts  # PATCH, GET, POST /beacon
    └── dtos/
        ├── update-layout.dto.ts
        └── layout-response.dto.ts

frontend/src/
├── composables/
│   └── useLayoutPersistence.ts         # Three-layer persistence
├── stores/
│   └── layout.store.ts                # Pinia store for layout state
└── api/
    └── layout.api.ts                  # API client

infra/
├── migrations/
│   └── 001_create_card_layouts.sql     # Database migration
└── redis/
    └── layout-cache.lua               # Lua script for atomic ops
```

---

## Task 1: Database Migration

**Files:**
- Create: `infra/migrations/001_create_card_layouts.sql`
- Modify: `docker-compose.yml` (add migration step)

- [ ] **Step 1: Create migration SQL**

```sql
-- Card layouts table for persisting user card order preferences
CREATE TABLE IF NOT EXISTS card_layouts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    layout JSONB NOT NULL DEFAULT '{"categories": [], "budgets": []}',
    version BIGSERIAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_card_layouts_user_id ON card_layouts(user_id);

-- GIN index for JSONB queries (if needed for future features)
CREATE INDEX idx_card_layouts_layout ON card_layouts USING GIN (layout);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update
DROP TRIGGER IF EXISTS update_card_layouts_updated_at ON card_layouts;
CREATE TRIGGER update_card_layouts_updated_at
    BEFORE UPDATE ON card_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 2: Run migration**

```bash
docker compose exec postgres-txn psql -U postgres -d txn_db -f /docker-entrypoint-initdb.d/001_create_card_layouts.sql
```

---

## Task 2: Domain Entity

**Files:**
- Create: `services/user-service/src/domain/card-layout.entity.ts`
- Modify: `services/user-service/src/domain/index.ts`

- [ ] **Step 1: Write entity**

```typescript
export interface CardLayoutData {
  categories: string[];  // Array of category IDs in order
  budgets: string[];   // Array of budget IDs in order
}

export class CardLayout {
  constructor(
    public readonly userId: string,
    public readonly layout: CardLayoutData,
    public readonly version: bigint,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(userId: string): CardLayout {
    const now = new Date();
    return new CardLayout(
      userId,
      { categories: [], budgets: [] },
      BigInt(1),
      now,
      now,
    );
  }

  updateLayout(newLayout: CardLayoutData): CardLayout {
    return new CardLayout(
      this.userId,
      newLayout,
      this.version + BigInt(1),
      this.createdAt,
      new Date(),
    );
  }
}
```

---

## Task 3: Repository

**Files:**
- Create: `services/user-service/src/infrastructure/repositories/card-layout.repository.ts`
- Create: `services/user-service/src/infrastructure/cache/layout-cache.service.ts`
- Modify: `services/user-service/src/infrastructure/index.ts`

- [ ] **Step 1: Write Redis cache service**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CardLayout } from '../../domain/card-layout.entity';

@Injectable()
export class LayoutCacheService {
  private readonly TTL = 3600; // 1 hour

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private key(userId: string): string {
    return `layout:${userId}`;
  }

  async get(userId: string): Promise<{ layout: CardLayout; version: bigint } | null> {
    const data = await this.redis.get(this.key(userId));
    if (!data) return null;
    return JSON.parse(data);
  }

  async set(layout: CardLayout): Promise<void> {
    const data = JSON.stringify({
      layout: {
        userId: layout.userId,
        layout: layout.layout,
        version: layout.version.toString(),
        createdAt: layout.createdAt.toISOString(),
        updatedAt: layout.updatedAt.toISOString(),
      },
      version: layout.version.toString(),
    });
    await this.redis.setex(this.key(layout.userId), this.TTL, data);
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }
}
```

- [ ] **Step 2: Write repository**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardLayout, CardLayoutData } from '../../domain/card-layout.entity';
import { LayoutCacheService } from '../cache/layout-cache.service';

@Injectable()
export class CardLayoutRepository {
  constructor(
    @InjectRepository(CardLayoutEntity)
    private readonly db: Repository<CardLayoutEntity>,
    private readonly cache: LayoutCacheService,
  ) {}

  async findByUserId(userId: string): Promise<CardLayout | null> {
    // Check cache first
    const cached = await this.cache.get(userId);
    if (cached) {
      return cached.layout;
    }

    // Query database
    const entity = await this.db.findOne({ where: { userId } });
    if (!entity) return null;

    const layout = entity.toDomain();
    // Cache for next request
    await this.cache.set(layout);
    return layout;
  }

  async save(layout: CardLayout): Promise<CardLayout> {
    const entity = CardLayoutEntity.fromDomain(layout);
    const saved = await this.db.save(entity);
    // Invalidate cache (will be re-populated on next read)
    await this.cache.invalidate(layout.userId);
    return saved.toDomain();
  }

  async upsert(layout: CardLayout): Promise<CardLayout> {
    const existing = await this.db.findOne({ where: { userId: layout.userId } });
    if (existing) {
      existing.layout = layout.layout as any;
      existing.version = Number(layout.version);
      const saved = await this.db.save(existing);
      await this.cache.invalidate(layout.userId);
      return saved.toDomain();
    } else {
      const newEntity = CardLayoutEntity.fromDomain(layout);
      const saved = await this.db.save(newEntity);
      await this.cache.set(saved.toDomain());
      return saved.toDomain();
    }
  }
}
```

---

## Task 4: Handlers & Commands

**Files:**
- Create: `services/user-service/src/application/handlers/get-card-layout.handler.ts`
- Create: `services/user-service/src/application/handlers/update-card-layout.handler.ts`
- Create: `services/user-service/src/application/commands/update-card-layout.command.ts`
- Create: `services/user-service/src/application/queries/get-card-layout.query.ts`
- Modify: `services/user-service/src/application/index.ts`

- [ ] **Step 1: Write Get handler**

```typescript
import { Handler } from '../handler.decorator';
import { GetCardLayoutQuery } from '../queries/get-card-layout.query';
import { CardLayoutRepository } from '../../infrastructure/repositories/card-layout.repository';

@Handler(GetCardLayoutQuery)
export class GetCardLayoutHandler {
  constructor(private readonly repo: CardLayoutRepository) {}

  async execute(query: GetCardLayoutQuery) {
    let layout = await this.repo.findByUserId(query.userId);
    if (!layout) {
      // Create default layout if none exists
      layout = CardLayout.create(query.userId);
      await this.repo.save(layout);
    }
    return layout;
  }
}
```

- [ ] **Step 2: Write Update handler with conflict resolution**

```typescript
import { Handler } from '../handler.decorator';
import { UpdateCardLayoutCommand } from '../commands/update-card-layout.command';
import { CardLayoutRepository } from '../../infrastructure/repositories/card-layout.repository';
import { CardLayout } from '../../domain/card-layout.entity';

@Handler(UpdateCardLayoutCommand)
export class UpdateCardLayoutHandler {
  constructor(private readonly repo: CardLayoutRepository) {}

  async execute(command: UpdateCardLayoutCommand) {
    const current = await this.repo.findByUserId(command.userId);
    
    // Conflict resolution: last-write-wins by timestamp
    if (current && command.clientVersion > Number(current.version)) {
      // Client is stale, accept anyway (last-write-wins)
    }
    
    const updatedLayout = current
      ? current.updateLayout(command.layout)
      : CardLayout.create(command.userId);

    // If new layout has same version but older timestamp, server wins
    if (current && command.clientTimestamp <= current.updatedAt.getTime()) {
      return current; // Server version is newer
    }

    return this.repo.save(updatedLayout);
  }
}
```

---

## Task 5: Controller Endpoints

**Files:**
- Create: `services/user-service/src/presentation/controllers/card-layout.controller.ts`
- Create: `services/user-service/src/presentation/dtos/update-layout.dto.ts`
- Create: `services/user-service/src/presentation/dtos/layout-response.dto.ts`
- Modify: `services/gateway/src/proxy/users-proxy.controller.ts` (add routes)

- [ ] **Step 1: Write DTOs**

```typescript
// update-layout.dto.ts
import { IsObject, IsOptional, IsNumber, IsArray, IsString } from 'class-validator';

export class UpdateLayoutDto {
  @IsObject()
  layout: {
    categories: string[];
    budgets: string[];
  };

  @IsNumber()
  clientVersion: number;

  @IsNumber()
  clientTimestamp: number;
}

// layout-response.dto.ts
export class LayoutResponseDto {
  layout: {
    categories: string[];
    budgets: string[];
  };
  version: number;
  updatedAt: string;
}
```

- [ ] **Step 2: Write controller**

```typescript
import { Controller, Get, Patch, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse, CurrentUser, UserId } from '@money-manager/shared-kernel';
import { GetCardLayoutHandler } from '../../application/handlers/get-card-layout.handler';
import { UpdateCardLayoutHandler } from '../../application/handlers/update-card-layout.handler';
import { GetCardLayoutQuery } from '../../application/queries/get-card-layout.query';
import { UpdateCardLayoutCommand } from '../../application/commands/update-card-layout.command';
import { UpdateLayoutDto, LayoutResponseDto } from '../dtos/update-layout.dto';

@Controller('layout')
export class CardLayoutController {
  constructor(
    private readonly getHandler: GetCardLayoutHandler,
    private readonly updateHandler: UpdateCardLayoutHandler,
  ) {}

  @Get()
  async get(@CurrentUser() userId: UserId) {
    const layout = await this.getHandler.execute(new GetCardLayoutQuery(userId.value));
    return ApiResponse.ok(this.toResponse(layout));
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async update(@CurrentUser() userId: UserId, @Body() dto: UpdateLayoutDto) {
    const layout = await this.updateHandler.execute(
      new UpdateCardLayoutCommand(
        userId.value,
        dto.layout,
        dto.clientVersion,
        dto.clientTimestamp,
      ),
    );
    return ApiResponse.ok(this.toResponse(layout));
  }

  @Post('beacon')
  @HttpCode(HttpStatus.ACCEPTED)
  async beacon(@CurrentUser() userId: UserId, @Body() dto: UpdateLayoutDto) {
    // Async, fire-and-forget
    setImmediate(async () => {
      try {
        await this.updateHandler.execute(
          new UpdateCardLayoutCommand(
            userId.value,
            dto.layout,
            dto.clientVersion,
            dto.clientTimestamp,
          ),
        );
      } catch (e) {
        // Log but don't fail - beacon is fire-and-forget
        console.error('Beacon sync failed:', e);
      }
    });
    return ApiResponse.ok({ received: true });
  }

  private toResponse(layout: any): LayoutResponseDto {
    return {
      layout: layout.layout,
      version: Number(layout.version),
      updatedAt: layout.updatedAt.toISOString(),
    };
  }
}
```

---

## Task 6: Gateway Proxy

**Files:**
- Modify: `services/gateway/src/proxy/users-proxy.controller.ts`

- [ ] **Step 1: Add routes to proxy**

```typescript
// Add to existing users proxy
@Patch('layout')
async updateLayout(@Body() body: any, @Req() req: any) {
  const response = await this.proxy.forward(
    req,
    'user-service',
    `/layout`,
    'patch',
    body,
  );
  return response;
}

@Get('layout')
async getLayout(@Req() req: any) {
  const response = await this.proxy.forward(
    req,
    'user-service',
    `/layout`,
    'get',
  );
  return response;
}

@Post('layout/beacon')
async beaconLayout(@Body() body: any, @Req() req: any) {
  const response = await this.proxy.forward(
    req,
    'user-service',
    `/layout/beacon`,
    'post',
    body,
  );
  return response;
}
```

---

## Task 7: Frontend API Client

**Files:**
- Create: `frontend/src/api/layout.api.ts`
- Modify: `frontend/src/api/index.ts`

- [ ] **Step 1: Write API client**

```typescript
import { api } from './client';

export interface LayoutData {
  categories: string[];
  budgets: string[];
}

export interface LayoutResponse {
  layout: LayoutData;
  version: number;
  updatedAt: string;
}

export interface UpdateLayoutPayload {
  layout: LayoutData;
  clientVersion: number;
  clientTimestamp: number;
}

export const layoutApi = {
  get: async (): Promise<LayoutResponse> => {
    const { data } = await api.get('/layout');
    return data;
  },

  update: async (payload: UpdateLayoutPayload): Promise<LayoutResponse> => {
    const { data } = await api.patch('/layout', payload);
    return data;
  },

  beacon: (payload: UpdateLayoutPayload): void => {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/layout/beacon', blob);
  },
};
```

---

## Task 8: Layout Persistence Composable

**Files:**
- Create: `frontend/src/composables/useLayoutPersistence.ts`
- Modify: `frontend/src/composables/index.ts`

- [ ] **Step 1: Write composable with three-layer persistence**

```typescript
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { layoutApi, type LayoutData } from '@/api/layout.api';

const STORAGE_KEY = 'card_layout';
const STORAGE_META_KEY = 'card_layout_meta';

interface LayoutMeta {
  version: number;
  timestamp: number;
  synced: boolean;
}

interface LayoutState {
  layout: LayoutData | null;
  meta: LayoutMeta | null;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function useLayoutPersistence(type: 'categories' | 'budgets') {
  const layout = ref<LayoutData | null>(null);
  const meta = ref<LayoutMeta | null>(null);
  const loading = ref(true);

  // Layer 1: localStorage
  function saveToLocal(data: LayoutData, m: LayoutMeta) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(m));
  }

  function loadFromLocal(): LayoutState {
    const layoutData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const metaData = JSON.parse(localStorage.getItem(STORAGE_META_KEY) || 'null');
    return { layout: layoutData, meta: metaData };
  }

  // Layer 2: Debounced API sync
  function debouncedSync(data: LayoutData, m: LayoutMeta) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => syncToServer(data, m), 1500);
  }

  async function syncToServer(data: LayoutData, m: LayoutMeta) {
    try {
      const result = await layoutApi.update({
        layout: data,
        clientVersion: m.version,
        clientTimestamp: m.timestamp,
      });
      // Update local state with server response
      const newMeta: LayoutMeta = {
        version: result.version,
        timestamp: m.timestamp,
        synced: true,
      };
      layout.value = result.layout;
      meta.value = newMeta;
      saveToLocal(result.layout, newMeta);
    } catch (err) {
      console.error('Layout sync failed:', err);
      // Leave synced: false for retry
    }
  }

  // Layer 3: sendBeacon on visibility change
  function flushIfDirty() {
    const { layout: localLayout, meta: localMeta } = loadFromLocal();
    if (!localLayout || !localMeta || localMeta.synced) return;

    const blob = new Blob([JSON.stringify({
      layout: localLayout,
      clientVersion: localMeta.version,
      clientTimestamp: localMeta.timestamp,
    })], { type: 'application/json' });
    navigator.sendBeacon('/api/layout/beacon', blob);
  }

  // Initialize on mount
  async function initialize() {
    loading.value = true;
    
    // Load from localStorage first (instant)
    const { layout: localLayout, meta: localMeta } = loadFromLocal();
    if (localLayout) {
      layout.value = localLayout;
      meta.value = localMeta;
    }

    // Fetch from server
    try {
      const serverData = await layoutApi.get();

      if (!localLayout || !localMeta) {
        // Fresh device - use server state
        const newMeta: LayoutMeta = {
          version: serverData.version,
          timestamp: new Date(serverData.updatedAt).getTime(),
          synced: true,
        };
        layout.value = serverData.layout;
        meta.value = newMeta;
        saveToLocal(serverData.layout, newMeta);
      } else if (localMeta.synced) {
        // Local is synced - check if server is newer
        if (serverData.version > localMeta.version) {
          const newMeta: LayoutMeta = {
            version: serverData.version,
            timestamp: new Date(serverData.updatedAt).getTime(),
            synced: true,
          };
          layout.value = serverData.layout;
          meta.value = newMeta;
          saveToLocal(serverData.layout, newMeta);
        }
      } else {
        // Local has unsaved changes - use timestamp for conflict resolution
        if (localMeta.timestamp > new Date(serverData.updatedAt).getTime()) {
          await syncToServer(localLayout, localMeta);
        } else {
          // Server wins
          const newMeta: LayoutMeta = {
            version: serverData.version,
            timestamp: new Date(serverData.updatedAt).getTime(),
            synced: true,
          };
          layout.value = serverData.layout;
          meta.value = newMeta;
          saveToLocal(serverData.layout, newMeta);
        }
      }
    } catch (err) {
      console.error('Failed to fetch layout:', err);
      // Fall back to localStorage if server fails
    } finally {
      loading.value = false;
    }
  }

  // Called when user drops a card
  function onDragEnd(newOrder: string[]) {
    if (!layout.value) {
      layout.value = { categories: [], budgets: [] };
    }

    const newLayout = {
      ...layout.value,
      [type]: newOrder,
    };

    const newMeta: LayoutMeta = {
      version: meta.value?.version || 0,
      timestamp: Date.now(),
      synced: false,
    };

    layout.value = newLayout;
    meta.value = newMeta;
    saveToLocal(newLayout, newMeta);
    debouncedSync(newLayout, newMeta);
  }

  // Register visibility change listener
  onMounted(() => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushIfDirty();
      }
    });
    window.addEventListener('beforeunload', flushIfDirty);
    initialize();
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', flushIfDirty);
    window.removeEventListener('beforeunload', flushIfDirty);
    if (syncTimeout) clearTimeout(syncTimeout);
  });

  return {
    layout,
    loading,
    onDragEnd,
    initialize,
  };
}
```

---

## Task 9: Update Categories & Budget Views

**Files:**
- Modify: `frontend/src/views/CategoriesView.vue`
- Modify: `frontend/src/views/BudgetView.vue`
- Create: `frontend/src/composables/useDraggableList.ts` (update)

- [ ] **Step 1: Update useDraggableList composable**

```typescript
import { ref, computed, watch } from 'vue';

export function useDraggableList<T extends { id: string }>(initialItems: T[] = [], type: 'categories' | 'budgets') {
  const items = ref<T[]>([...initialItems]);
  const isInitialized = ref(false);

  // Layout persistence composable
  const { layout, loading: layoutLoading, onDragEnd: persistDragEnd } = useLayoutPersistence(type);

  // Watch for layout changes and apply order
  watch(() => layout.value, (newLayout) => {
    if (newLayout && newLayout[type]?.length > 0) {
      const orderedIds = newLayout[type];
      const ordered = orderedIds
        .map(id => items.value.find(item => item.id === id))
        .filter((item): item is T => item !== undefined);
      
      // Only reorder if we have all items
      if (ordered.length === items.value.length) {
        items.value = ordered;
      }
    }
  }, { immediate: true });

  function sync(source: T[]) {
    if (items.value.length === 0 && source.length > 0) {
      items.value = [...source];
    }
  }

  function refresh(source: T[]) {
    items.value = [...source];
  }

  function handleDragEnd(newOrder: string[]) {
    // Update local order immediately (optimistic)
    const ordered = newOrder
      .map(id => items.value.find(item => item.id === id))
      .filter((item): item is T => item !== undefined);
    items.value = ordered;
    
    // Persist to server
    persistDragEnd(newOrder);
  }

  return {
    items,
    isInitialized,
    loading: layoutLoading,
    sync,
    refresh,
    onDragEnd: handleDragEnd,
  };
}
```

---

## Task 10: Redis Configuration

**Files:**
- Modify: `services/user-service/src/app.module.ts`
- Create: `services/user-service/src/infrastructure/redis/redis.module.ts`

- [ ] **Step 1: Add Redis module**

```typescript
// redis.module.ts
import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis(process.env.REDIS_URL || 'redis://redis:6379');
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
```

---

## Task 11: Integration Tests

**Files:**
- Create: `services/user-service/test/card-layout.integration.spec.ts`

- [ ] **Step 1: Write integration tests**

```typescript
describe('CardLayout', () => {
  it('should create default layout for new user', async () => {
    const result = await getHandler.execute(new GetCardLayoutQuery(testUserId));
    expect(result.layout.categories).toEqual([]);
    expect(result.layout.budgets).toEqual([]);
  });

  it('should update layout with conflict resolution', async () => {
    // First update
    const first = await updateHandler.execute(
      new UpdateCardLayoutCommand(testUserId, { categories: ['a', 'b'], budgets: [] }, 0, Date.now()),
    );
    expect(first.layout.categories).toEqual(['a', 'b']);

    // Second update (client is behind)
    const second = await updateHandler.execute(
      new UpdateCardLayoutCommand(testUserId, { categories: ['b', 'a'], budgets: [] }, 0, Date.now() - 1000),
    );
    // Last-write-wins, so newer timestamp wins
    expect(second.layout.categories).toEqual(['b', 'a']);
  });

  it('should handle beacon endpoint asynchronously', async () => {
    const response = await controller.beacon(testUserId, {
      layout: { categories: ['c'], budgets: [] },
      clientVersion: 1,
      clientTimestamp: Date.now(),
    });
    expect(response.received).toBe(true);
  });
});
```

---

## Task 12: E2E Tests

**Files:**
- Create: `frontend/tests/e2e/layout-persistence.spec.ts`

- [ ] **Step 1: Write E2E tests**

```typescript
describe('Card Layout Persistence', () => {
  it('should persist order after page reload', async () => {
    // Drag a category card
    await page.goto('/categories');
    const cards = page.locator('[data-testid="category-card"]');
    await cards.nth(0).dragTo(cards.nth(2));

    // Reload page
    await page.reload();
    await page.waitForURL('/categories');

    // Verify order persisted
    const firstCard = await cards.nth(0).getAttribute('data-category-id');
    expect(firstCard).not.toBe(originalFirstId);
  });

  it('should sync layout across devices', async () => {
    // Desktop: reorder
    await page.goto('/categories');
    await page.locator('[data-testid="category-card"]').nth(0).dragTo(page.locator('[data-testid="category-card"]').nth(1));

    // Mobile: should see new order
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/categories');
    const firstCard = await page.locator('[data-testid="category-card"]').nth(0).getAttribute('data-category-id');
    expect(firstCard).toBe(expectedFirstId);
  });
});
```

---

## Verification Checklist

- [ ] Migration runs successfully
- [ ] GET /layout returns default layout for new user
- [ ] PATCH /layout updates layout and increments version
- [ ] Conflict resolution uses last-write-wins
- [ ] Redis cache is populated on first read
- [ ] Cache is invalidated on update
- [ ] Beacon endpoint accepts payload and syncs asynchronously
- [ ] Frontend loads layout from localStorage instantly
- [ ] Frontend syncs to server after 1.5s debounce
- [ ] sendBeacon fires on page visibility change
- [ ] Order persists after page reload
- [ ] Order syncs across devices
- [ ] All tests pass

---

**Plan saved to:** `docs/superpowers/plans/2026-06-29-card-layout-persistence.md`
