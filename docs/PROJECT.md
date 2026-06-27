# Money Manager DIKA — Project Documentation

## Overview

A microservices money-manager app built with NestJS, MikroORM, PostgreSQL, Kafka, Redis, and a Vue 3 frontend. Follows Domain-Driven Design with a layered architecture per service.

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────────────┐
│  Frontend   │────▶│  Gateway (port 3000)                                     │
│  Vue 3      │     │  - CORS, ValidationPipe, CircuitBreaker                  │
│  port 5173  │     │  - Proxy controllers forward /api/* to downstream        │
└─────────────┘     │  - mTLS client cert for user-service hop                 │
                    └──────┬──────┬──────┬──────┬──────┬───────────────────────┘
                           │      │      │      │      │
              ┌────────────┘      │      │      │      └────────────┐
              ▼                   ▼      ▼      ▼                   ▼
    ┌──────────────┐  ┌────────────┐  ┌──────┐  ┌────────────┐  ┌──────────────┐
    │ transaction  │  │  budget    │  │  ai  │  │   auth     │  │    user      │
    │ port 3001   │  │  port 3002 │  │ 3003 │  │  port 3004 │  │  port 3005   │
    │ postgres-txn│  │ postgres-  │  │ Groq │  │ postgres-  │  │ postgres-user│
    │             │  │ budget     │  │      │  │ auth       │  │ HTTPS+mTLS   │
    └──────┬──────┘  └──────┬─────┘  └──────┘  └────────────┘  └──────────────┘
           │                │
           └────Kafka───────┘  (transaction.events → budget updates running total)
                │
    ┌───────────┘
    ▼
┌──────────────┐
│   worker     │  (seed data, DLQ retry)
│   no port    │
└──────────────┘
```

---

## Monorepo Structure

```
Money_Manager-DIKA/
├── packages/
│   ├── shared-kernel/          @money-manager/shared-kernel
│   │   └── src/
│   │       ├── value-objects/   (Money, UserId, BudgetPeriod, TransactionType)
│   │       ├── interfaces/      (EventBusPort, CachePort, RepositoryPort)
│   │       ├── exceptions/      (DomainException, NotFoundException, error-codes.ts)
│   │       ├── di/tokens.ts     (EVENT_BUS_PORT, CACHE_PORT, LOGGER_TOKEN)
│   │       ├── decorators/      (CurrentUser — reads x-user-id header)
│   │       ├── filters/         (ApiExceptionFilter)
│   │       ├── response/        (ApiResponse envelope)
│   │       └── utils/           (generateUuid, generateCorrelationId)
│   └── infrastructure/         @money-manager/infrastructure
│       └── src/
│           ├── event-bus/       (KafkaAdapter, RedisStreamsAdapter, EventBusModule)
│           ├── cache/           (RedisCacheAdapter, CacheModule)
│           ├── logging/         (Winston+Loki, LoggerModule)
│           ├── health/          (Kafka/Redis/Postgres health indicators)
│           └── persistence/     (BaseEntity, DatabaseModule)
├── services/
│   ├── transaction-service/    (port 3001, postgres-txn)
│   ├── budget-service/         (port 3002, postgres-budget)
│   ├── ai-service/             (port 3003, Groq/mock)
│   ├── worker-service/         (no port, seed + DLQ)
│   ├── gateway/                (port 3000, proxy + websocket + circuit breaker)
│   ├── auth-service/           (port 3004, postgres-auth)
│   └── user-service/           (port 3005, postgres-user, HTTPS+mTLS)
├── frontend/                   (Vue 3 + Vite)
├── tests/                      @money-manager/e2e-tests
│   ├── integration/            (transaction-flow, budget-flow, cross-service-events, user-profile)
│   ├── e2e/                    (gateway-proxy, gateway-health, dashboard, ai-degraded, full-flow-with-auth)
│   └── helpers/                (http.ts, reset-db.ts, wait.ts)
├── scripts/
│   ├── gen-certs.sh            (mTLS cert generation)
│   └── gen-certs.cmd           (Windows shim)
├── infra/
│   ├── certs/                  (.gitkeep, generated *.pem/*.key/*.crt)
│   ├── loki-config.yml
│   └── grafana/provisioning/
├── docker-compose.yml
├── .env / .env.example
├── .github/workflows/ci.yml
├── render.yaml                 (Render.com deployment)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Service Pattern (DDD Layered)

Every service follows this exact structure:

```
services/<name>/
├── Dockerfile              (multi-stage: base → dev → build → prod)
├── package.json            (@money-manager/<name>)
├── tsconfig.json           (extends ../../tsconfig.base.json, paths for shared-kernel + infra)
├── nest-cli.json
├── index.md                (service manifest with depends_on)
└── src/
    ├── main.ts             (NestFactory.create, ValidationPipe, ApiExceptionFilter)
    ├── app.module.ts       (MikroOrmModule.forRoot, wires all layers)
    ├── domain/
    │   ├── aggregates/     (MyAggregate.ts + .spec.ts — create() / reconstitute() / validate)
    │   ├── value-objects/  (immutable, validated on construction)
    │   ├── events/         (implements DomainEvent, uses createEventMeta())
    │   ├── repositories/   (port interface + DI token string)
    │   └── services/       (domain logic that doesn't fit in an aggregate)
    ├── application/
    │   ├── commands/       (plain classes, constructor args)
    │   ├── queries/        (plain classes)
    │   ├── handlers/       (@Injectable, @Inject repo/eventbus, execute(cmd))
    │   └── consumers/      (OnModuleInit, eventBus.subscribe)
    ├── infrastructure/
    │   ├── persistence/    (Entity, Mapper, RepositoryImpl using MikroORM EntityManager)
    │   ├── cache/          (service-specific cache wrappers)
    │   └── jwt/ or password/ (auth-specific infra)
    └── presentation/
        ├── controllers/    (@Controller, uses handlers, returns ApiResponse.ok())
        └── dtos/           (class-validator decorated input/output shapes)
```

### Key Conventions
- **Aggregate**: private constructor, `static create()` for new, `static reconstitute()` from DB
- **Repository port**: `export const TOKEN = 'TOKEN_NAME'` + `export interface XRepository extends RepositoryPort<X>`
- **Handler**: `@Injectable()`, takes repo/eventbus via `@Inject(TOKEN)`, has `execute(command)` method
- **Controller**: injects handlers directly (no CQRS bus), wraps response in `ApiResponse.ok()`
- **Mapper**: static `toDomain(entity)` + `toEntity(domain)` — no inheritance, no DI
- **Entity**: extends `BaseEntity` from infrastructure (has `id`, `createdAt`, `updatedAt`, `deletedAt`)
- **Tests**: co-located `.spec.ts` in same folder, jest mocks for repos/eventbus

---

## Services Detail

### auth-service (port 3004)
- **Owns**: User identity (email, passwordHash), JWT access tokens, opaque refresh tokens
- **Aggregates**: `User` (email, passwordHash, displayName), `RefreshToken` (sha-256 hashed, revocable)
- **Value Objects**: `Email` (lowercased, validated), `PasswordHash` (bcrypt format guard)
- **Ports**: `USER_REPOSITORY`, `REFRESH_TOKEN_REPOSITORY`, `PASSWORD_HASHER`, `TOKEN_SERVICE`
- **Handlers**: RegisterHandler, LoginHandler, RefreshTokenHandler, LogoutHandler, GetMeHandler
- **Infrastructure**: BcryptPasswordHasher (cost 10), JwtTokenService (HS256, 15min TTL), TokenIssuer (shared issuance logic)
- **Endpoints**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **Security**: timing-safe login (dummy bcrypt on missing user), refresh token rotation (old token revoked on use)
- **DB**: `postgres-auth:5434` → `auth_db` (tables: `users`, `refresh_tokens`)

### user-service (port 3005, HTTPS + mTLS)
- **Owns**: User profile and settings (separate from identity)
- **Aggregate**: `UserProfile` (id=userId, displayName, avatarUrl, locale, timezone, defaultCurrency, budgetAnchorDay, notificationPrefs)
- **Value Objects**: `Locale` (BCP-47), `Timezone` (IANA via Intl.supportedValuesOf + UTC), `Currency` (ISO-4217 allowlist), `NotificationPrefs` (JSON shape)
- **Handlers**: GetMyProfileHandler (auto-creates on first hit), GetPublicProfileHandler, UpdateProfileHandler, UpdatePreferencesHandler
- **Endpoints**: `GET /users/me`, `PUT /users/me`, `PUT /users/me/preferences`, `GET /users/:id` (public fields only)
- **mTLS**: main.ts reads `MTLS_ENABLED` env, boots HTTPS with `requestCert: true, rejectUnauthorized: true`
- **DB**: `postgres-user:5435` → `user_db` (table: `user_profiles`)

### transaction-service (port 3001)
- **Owns**: Financial transactions (CRUD)
- **Aggregate**: `Transaction` (userId, amount, currency, type, categoryId, description, date)
- **Publishes**: `transaction.created`, `transaction.updated`, `transaction.deleted` to Kafka topic `transaction.events`
- **DB**: `postgres-txn:5432` → `txn_db` (table: `transactions`)

### budget-service (port 3002)
- **Owns**: Categories and budget limits, running totals
- **Aggregates**: `Category` (name, type, icon, color), `Budget` (monthlyLimit, runningTotal, period)
- **Consumes**: `transaction.created/deleted` events → updates running totals
- **Publishes**: `budget.exceeded` when spending crosses the limit
- **Domain service**: `BudgetProjectionService` (velocity, days-until-exceeded)
- **DB**: `postgres-budget:5433` → `budget_db` (tables: `categories`, `budgets`)

### ai-service (port 3003)
- **Owns**: AI-powered category suggestions
- **Provider**: Groq (production) or MockAI (when GROQ_API_KEY is default)
- **Consumes**: `transaction.created` → suggests category
- **Endpoint**: `POST /ai/suggest`

### worker-service (no port)
- **Owns**: Background jobs — seed data, DLQ retry
- **Uses**: Both `postgres-txn` and `postgres-budget` EntityManagers

### gateway (port 3000)
- **Role**: API gateway, proxy, circuit breaker, websocket relay
- **Proxy controllers**: TransactionProxy, BudgetProxy, CategoryProxy, AiProxy, AuthProxy, UsersProxy
- **mTLS**: Loads client cert on boot for `user` service calls via `https.Agent`
- **Circuit breaker**: opossum-based, per-service, 4xx passthrough (only 5xx opens breaker)
- **WebSocket**: Event relay service subscribes to Kafka and pushes to connected clients
- **Middleware**: CorrelationId (generates/forwards `x-correlation-id`)
- **Config**: `app.config.ts` has SERVICE_URLS, CIRCUIT_BREAKER, RATE_LIMIT, REDIS, MTLS blocks

---

## mTLS Setup

Only the `gateway → user-service` hop is mTLS-gated. Other services use plain HTTP + `x-user-id` header.

### Cert hierarchy
```
infra/certs/
├── ca.key + ca.pem             (4096-bit RSA CA, 10-year validity)
├── user-service.key + .crt     (server cert, SAN: user-service, localhost, 127.0.0.1)
└── gateway.key + .crt          (client cert, extendedKeyUsage: clientAuth)
```

### How it works
1. `scripts/gen-certs.sh` generates all certs (idempotent, run once per dev)
2. docker-compose mounts `./infra/certs:/etc/mtls:ro` into both containers
3. user-service boots HTTPS with `requestCert: true` — TLS handshake rejects unsigned clients
4. gateway loads client cert into `https.Agent`, attaches to axios calls for service name `user`

### Env vars
- user-service: `MTLS_ENABLED`, `MTLS_CERT_PATH`, `MTLS_KEY_PATH`, `MTLS_CA_PATH`, `MTLS_REQUEST_CLIENT_CERT`, `MTLS_REJECT_UNAUTHORIZED`
- gateway: `MTLS_CA_PATH`, `MTLS_CLIENT_CERT_PATH`, `MTLS_CLIENT_KEY_PATH`, `MTLS_USER_ENABLED`

---

## Error Handling

### Centralized Error Catalog
`packages/shared-kernel/src/exceptions/error-codes.ts` — single file with all 15 error codes:

```ts
export const USER_EMAIL_TAKEN: ErrorDef = { code: 'USER_EMAIL_TAKEN', message: '...' };
// ... 14 more
export const Errors = { USER_EMAIL_TAKEN, ... } as const;
```

### Usage
```ts
import { DomainException, USER_EMAIL_TAKEN } from '@money-manager/shared-kernel';
throw DomainException.fromError(USER_EMAIL_TAKEN);
```

### Exception hierarchy
- `DomainException` → 400 (via ApiExceptionFilter)
- `NotFoundException` → 404
- `HttpException` → original status
- Unknown → 500

### Response envelope
All responses use `ApiResponse.ok(data)` / `ApiResponse.error(code, message)` / `ApiResponse.paginated(data, pagination)`.

---

## Docker Compose Services

| Service | Container | Port | DB | Depends On |
|---------|-----------|------|-----|------------|
| postgres-txn | postgres-txn | 5432 | txn_db | - |
| postgres-budget | postgres-budget | 5433 | budget_db | - |
| postgres-auth | postgres-auth | 5434 | auth_db | - |
| postgres-user | postgres-user | 5435 | user_db | - |
| kafka | kafka | 9092 | - | - |
| redis | redis | 6379 | - | - |
| loki | loki | 3100 | - | - |
| grafana | grafana | 3200 | - | loki |
| transaction-service | transaction-service | 3001 | txn_db | postgres-txn, kafka, redis |
| budget-service | budget-service | 3002 | budget_db | postgres-budget, kafka, redis |
| ai-service | ai-service | 3003 | - | kafka |
| auth-service | auth-service | 3004 | auth_db | postgres-auth |
| user-service | user-service | 3005 | user_db | postgres-user |
| worker-service | worker-service | - | txn+budget | kafka, redis, postgres-txn, postgres-budget |
| gateway | gateway | 3000 | - | all services + infra |
| frontend | frontend | 5173 | - | gateway |

---

## Environment Variables (.env)

```
# Ports
GATEWAY_PORT=3000, TRANSACTION_SERVICE_PORT=3001, BUDGET_SERVICE_PORT=3002
AI_SERVICE_PORT=3003, AUTH_SERVICE_PORT=3004, USER_SERVICE_PORT=3005

# Postgres (shared creds)
POSTGRES_USER=postgres, POSTGRES_PASSWORD=postgres

# Per-service DB config
DB_HOST=postgres-txn, DB_PORT=5432, DB_NAME=txn_db
BUDGET_DB_HOST=postgres-budget, BUDGET_DB_NAME=budget_db
AUTH_DB_HOST=postgres-auth, AUTH_DB_NAME=auth_db
USER_DB_HOST=postgres-user, USER_DB_NAME=user_db

# Redis
REDIS_HOST=redis, REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=kafka:9092

# Service URLs (internal network)
TRANSACTION_SERVICE_URL=http://transaction-service:3001
BUDGET_SERVICE_URL=http://budget-service:3002
AI_SERVICE_URL=http://ai-service:3003
AUTH_SERVICE_URL=http://auth-service:3004
USER_SERVICE_URL=https://user-service:3005

# App
NODE_ENV=development
JWT_SECRET=change_me_in_production_must_be_at_least_16_chars
JWT_ACCESS_TTL_SECONDS=900
GROQ_API_KEY=your_groq_api_key_here
LOKI_URL=http://loki:3100
FRONTEND_URL=http://localhost:5173
```

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)
- **lint**: `pnpm lint`
- **build**: `pnpm build` (all services + frontend)
- **test**: `pnpm -r --filter '!@money-manager/e2e-tests' test` (unit tests only, no docker needed)
- **docker-build**: `docker compose build` (runs after lint+build+test pass)

### Render.com (`render.yaml`)
- Gateway, transaction, budget, ai as web services (free tier)
- Worker as worker service
- Frontend as static site
- Uses `redis-streams` adapter in production (env: `EVENT_BUS_ADAPTER=redis-streams`)
- Shared mm-postgres and mm-redis

---

## Testing Strategy

### Unit tests (per-service, no infra needed)
- Co-located `.spec.ts` files
- Mock repos/eventbus/hasher with `jest.fn()`
- Run: `pnpm -r --filter '!@money-manager/e2e-tests' test`

### Integration tests (need docker compose up)
- `tests/integration/transaction-flow.int-spec.ts` — CRUD through gateway
- `tests/integration/budget-flow.int-spec.ts` — category + budget through gateway
- `tests/integration/cross-service-events.int-spec.ts` — Kafka event flow
- `tests/integration/user-profile.int-spec.ts` — profile CRUD via mTLS path

### E2E tests (need docker compose up)
- `tests/e2e/gateway-proxy.e2e-spec.ts` — gateway forwarding
- `tests/e2e/gateway-health.e2e-spec.ts` — health aggregation
- `tests/e2e/dashboard.e2e-spec.ts` — dashboard aggregation
- `tests/e2e/ai-degraded.e2e-spec.ts` — AI service behavior
- `tests/e2e/full-flow-with-auth.e2e-spec.ts` — complete happy path + negative auth

### Test helpers
- `tests/helpers/http.ts` — axios client to `localhost:3000`, `userHeaders()` helper
- `tests/helpers/reset-db.ts` — `docker exec` psql TRUNCATE for each DB
- `tests/helpers/wait.ts` — poll-until-predicate with timeout

---

## Key Decisions & Patterns

1. **Event-driven budget updates**: Transaction service publishes; budget service consumes. No shared DB.
2. **Refresh token security**: Only sha-256 hash stored; rotation revokes old token.
3. **mTLS scope**: Only gateway→user-service. Other hops use plain HTTP + trusted x-user-id header.
4. **CurrentUser decorator**: Reads `x-user-id` header, falls back to `UserId.DEFAULT`. No JWT validation in downstream services — gateway is the trust boundary.
5. **Error catalog**: Single `error-codes.ts` file, `DomainException.fromError()` factory.
6. **Auto-create profile**: `GET /users/me` creates a default profile if none exists. Race-safe via `id = userId` as PK.
7. **Profile vs Identity split**: auth-service owns email/password/tokens. user-service owns preferences/settings.
8. **Event bus factory**: ENV-driven (`EVENT_BUS_ADAPTER`): Kafka for local dev, redis-streams for Render.

---

## Branches & PRs

| Branch | PR | Status | Description |
|--------|-----|--------|-------------|
| `feat/auth-user-service-mtls` | #13 | Green CI | auth-service + user-service + mTLS + integration/e2e tests |
| `refactor/error-catalog` | #14 | Pending | Centralized error codes + DomainException.fromError() |

---

## Commands

```bash
# Install deps
pnpm install

# Run all unit tests
pnpm -r --filter '!@money-manager/e2e-tests' test

# Type-check a service
cd services/<name> && npx tsc --noEmit

# Generate mTLS certs
bash scripts/gen-certs.sh

# Start full stack
docker compose up --build

# Run integration/e2e (requires stack running)
cd tests && npx jest --runInBand

# Build all
pnpm build
```

---

## What's Next (not yet built)

- JWT validation middleware in gateway (currently just forwards x-user-id)
- Password reset / email verification flows
- OAuth / Keycloak integration
- mTLS for other service hops (currently only user-service)
- Rate limiting middleware on auth endpoints
- Kafka events from user-service (profile.updated)
- Avatar upload (S3/blob storage)
- Frontend auth integration (login/register forms, token storage)
