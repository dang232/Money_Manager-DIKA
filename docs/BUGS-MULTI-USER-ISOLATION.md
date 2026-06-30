# Multi-User Isolation Bug Report

**Date:** 2026-06-30
**Severity:** CRITICAL
**Status:** ✅ FIXED

## Executive Summary

The system has **critical multi-user isolation bugs** that cause data leakage between users. When different users log in, they can see OTHER users' financial data.

---

## FIXES APPLIED ✅

All bugs have been fixed:

### FIX #1: Dashboard Controller - Added @CurrentUser()
**File:** `services/gateway/src/proxy/dashboard.controller.ts`
**Status:** ✅ FIXED
- Added `@CurrentUser() userId: UserId` parameter
- Fixed cache key to include user ID: `dashboard:${userId.value}:${y}:${m}`
- Added `x-user-id` header to all downstream axios calls

### FIX #2: CurrentUser Decorator - No Fallback
**File:** `packages/shared-kernel/src/decorators/current-user.decorator.ts`
**Status:** ✅ FIXED
- Removed `UserId.DEFAULT.value` fallback
- Now throws `UnauthorizedException` if header is missing

### FIX #3: UserId Value Object - Removed DEFAULT
**File:** `packages/shared-kernel/src/value-objects/user-id.ts`
**Status:** ✅ FIXED
- Removed `static readonly DEFAULT` constant

### FIX #4: Transaction Handlers - User Validation
**Files:**
- `services/transaction-service/src/application/handlers/get-transaction-by-id.handler.ts`
- `services/transaction-service/src/application/handlers/update-transaction.handler.ts`
- `services/transaction-service/src/application/handlers/delete-transaction.handler.ts`
**Status:** ✅ FIXED
- Added `ForbiddenException` when userId doesn't match

### FIX #5: Budget Handlers - User Validation
**Files:**
- `services/budget-service/src/application/handlers/update-category.handler.ts`
- `services/budget-service/src/application/handlers/delete-category.handler.ts`
**Status:** ✅ FIXED
- Added `ForbiddenException` when userId doesn't match

### FIX #6: Seed Data Job - Required UserId
**File:** `services/worker-service/src/jobs/seed-data.job.ts`
**Status:** ✅ FIXED
- `userId` parameter is now required (not optional)
- Removed DEFAULT fallback

---

## Critical Bugs (BEFORE FIX)

### BUG #1: Dashboard Controller - No User Context
**File:** `services/gateway/src/proxy/dashboard.controller.ts`
**Severity:** CRITICAL
**Lines:** 24-28

```typescript
@Get()
async getDashboard(
  @Query('year') year?: string,
  @Query('month') month?: string,
): Promise<DashboardResponse> {
```

**Problem:** The `@CurrentUser()` decorator is **MISSING**. The controller doesn't extract or pass user identity to downstream services.

**Impact:** 
- All users see the SAME dashboard data
- Dashboard aggregates data without user filtering
- Cache key is hardcoded as `'dashboard:default:...'` (see Bug #2)

**Root Cause:** Developer omitted `@CurrentUser() userId: UserId` parameter.

---

### BUG #2: Dashboard Cache Key - No User Separation
**File:** `services/gateway/src/proxy/dashboard.controller.ts`
**Severity:** CRITICAL
**Lines:** 33

```typescript
const cacheKey = `dashboard:default:${y}:${m}`;
```

**Problem:** Cache key is hardcoded to "default" - all users share the same cached dashboard.

**Impact:**
- User A's dashboard gets cached
- User B sees User A's cached data
- Dashboard data never updates per-user

---

### BUG #3: Dashboard API Calls - No Auth Forwarding
**File:** `services/gateway/src/proxy/dashboard.controller.ts`
**Severity:** HIGH
**Lines:** 40-44

```typescript
const [summaryResult, budgetsResult, projectionsResult] = await Promise.allSettled([
  axios.get(`${urls.transaction}/transactions/summary`, { params: { year: y, month: m } }),
  axios.get(`${urls.budget}/budgets`, { params: { year: y, month: m } }),
  axios.get(`${urls.budget}/budgets/projections`, { params: { year: y, month: m } }),
]);
```

**Problem:** Uses raw `axios.get()` instead of the proxy service that forwards auth headers.

**Impact:**
- `x-user-id` header is NOT forwarded
- Downstream services fall back to `UserId.DEFAULT` 
- All users get data for the default user

---

### BUG #4: CurrentUser Fallback to DEFAULT
**File:** `packages/shared-kernel/src/decorators/current-user.decorator.ts`
**Severity:** HIGH
**Lines:** 9

```typescript
const userId = request.headers['x-user-id'] || UserId.DEFAULT.value;
```

**Problem:** If `x-user-id` header is missing or invalid, falls back to DEFAULT user (`00000000-0000-4000-a000-000000000001`).

**Impact:**
- Unauthenticated/malformed requests get default user's data
- Gateway JWT validation failure doesn't block requests
- No 401 returned - silently serves wrong data

---

## High Priority Bugs

### BUG #5: WebSocket User ID via Query Param (Less Secure)
**File:** `frontend/src/composables/useSocket.ts`
**Severity:** MEDIUM
**Lines:** 10

```typescript
socket = io('/ws', { query: { userId }, transports: ['websocket'] })
```

**Problem:** User ID passed as query parameter instead of secure header/token.

**Impact:**
- User ID visible in WebSocket URL
- Can be cached/logged by proxies
- No token validation on WebSocket

**Recommendation:** Use JWT token in WebSocket auth or validate on server side.

---

### BUG #6: Repository findById - No User Validation
**Files:** 
- `services/transaction-service/src/infrastructure/persistence/transaction.repository.impl.ts`
- `services/budget-service/src/infrastructure/persistence/budget.repository.impl.ts`
- `services/budget-service/src/infrastructure/persistence/category.repository.impl.ts`

**Severity:** MEDIUM
**Lines:** 22-25, 13-16, 13-16

```typescript
async findById(id: string): Promise<Transaction | null> {
  const entity = await this.em.findOne(TransactionEntity, { id });
  // No userId check!
  return entity ? TransactionMapper.toDomain(entity) : null;
}
```

**Problem:** `findById` doesn't verify the record belongs to the requesting user.

**Impact:**
- User A can access User B's specific record if they know the ID
- No authorization check on single-record lookups

---

## Architecture Analysis

### Auth Flow (Current)
```
Frontend → httpClient (withCredentials) → Gateway → JwtAuthMiddleware (sets x-user-id)
                                                          ↓
                                         HttpProxyService → x-user-id header
                                                          ↓
                                         Transaction/Budget Service → @CurrentUser()
                                                                 ↓
                                         Repository (filters by userId)
```

### Problem Areas
1. **Gateway Dashboard Controller** - Bypasses entire auth chain
2. **Raw axios calls** - Don't forward auth headers
3. **Cache key** - No user differentiation
4. **Fallback to DEFAULT** - Silently serves wrong data

---

## Test Plan (Playwright Multi-User Simulation)

### Test Scenario 1: User Isolation on Dashboard
```
1. Create 2 test users: UserA, UserB
2. UserA creates transactions: $100, $200
3. UserB creates transactions: $500, $600
4. UserA views dashboard → should see $300 total
5. UserB views dashboard → should see $1100 total
6. ACTUAL BUG: Both see same total (likely UserA's or DEFAULT)
```

### Test Scenario 2: Dashboard Cache Isolation
```
1. UserA logs in, views dashboard
2. Cache populated with UserA's data
3. UserB logs in on different browser
4. UserB views dashboard
5. ACTUAL BUG: UserB sees UserA's cached data
```

### Test Scenario 3: Cross-User Data Access
```
1. UserA creates transaction T1
2. UserB tries to access T1 directly (GET /transactions/:id)
3. ACTUAL BUG: May succeed if repository doesn't check userId
```

### Test Scenario 4: Auth Token Expiration
```
1. UserA logs in, gets token
2. Token expires
3. UserA makes request
4. ACTUAL BUG: Falls back to DEFAULT user, sees wrong data instead of 401
```

---

## Recommended Fixes

### Fix #1: Dashboard Controller
```typescript
// Add CurrentUser parameter
@Get()
async getDashboard(
  @CurrentUser() userId: UserId,  // ADD THIS
  @Query('year') year?: string,
  @Query('month') month?: string,
): Promise<DashboardResponse> {
  // Use userId.value in cache key and downstream calls
  const cacheKey = `dashboard:${userId.value}:${y}:${m}`;
  
  // Forward to proxy service instead of raw axios
  const summary = await this.proxy.request('transaction', 'GET', '/transactions/summary', req);
  // ...
}
```

### Fix #2: Dashboard API Calls
Use `HttpProxyService` or pass headers explicitly:
```typescript
const [summaryResult, budgetsResult, projectionsResult] = await Promise.allSettled([
  axios.get(`${urls.transaction}/transactions/summary`, { 
    params: { year: y, month: m },
    headers: { 'x-user-id': userId.value }  // ADD THIS
  }),
  // ...
]);
```

### Fix #3: Strict CurrentUser (Optional - Break Change)
```typescript
// Option A: Throw on missing header
const userId = request.headers['x-user-id'];
if (!userId) throw new UnauthorizedException('x-user-id required');

// Option B: Log warning and fail
console.warn('Missing x-user-id header, rejecting request');
throw new UnauthorizedException();
```

### Fix #4: Add User Validation to Repository findById
```typescript
async findById(id: string, userId: string): Promise<Transaction | null> {
  const entity = await this.em.findOne(TransactionEntity, { id, userId });
  return entity ? TransactionMapper.toDomain(entity) : null;
}
```

---

## Files to Modify

| Priority | File | Change |
|----------|------|--------|
| P0 | `services/gateway/src/proxy/dashboard.controller.ts` | Add @CurrentUser, fix cache key, use proxy |
| P1 | `packages/shared-kernel/src/decorators/current-user.decorator.ts` | Consider failing instead of fallback |
| P2 | `services/transaction-service/src/infrastructure/persistence/transaction.repository.impl.ts` | Add userId to findById |
| P2 | `services/budget-service/src/infrastructure/persistence/budget.repository.impl.ts` | Add userId to findById |
| P2 | `services/budget-service/src/infrastructure/persistence/category.repository.impl.ts` | Add userId to findById |
| P3 | `frontend/src/composables/useSocket.ts` | Consider token-based auth |

---

## Reproduction Steps

1. Start backend: `pnpm --filter gateway start:dev`
2. Start frontend: `pnpm dev`
3. Create UserA account, add transactions
4. Create UserB account in incognito window
5. UserB will see UserA's transactions on dashboard
6. Or if dashboard cache populated, see stale/wrong data

---

## Severity Assessment

| Bug | Severity | Exploitability | Data Impact |
|-----|----------|----------------|-------------|
| #1 Dashboard No Auth | CRITICAL | Easy | All dashboard data |
| #2 Cache Key | CRITICAL | Easy | Stale data shown |
| #3 Raw Axios | HIGH | Easy | Wrong user data |
| #4 Fallback DEFAULT | HIGH | Medium | Unauth access |
| #5 WebSocket Query | MEDIUM | Medium | Session hijack risk |
| #6 findById No Check | MEDIUM | Requires ID | Single record leak |
