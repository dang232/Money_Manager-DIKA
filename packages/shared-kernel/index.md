---
type: Package
name: Shared Kernel
description: Cross-cutting domain primitives and port interfaces shared across all services.
depends_on: []
---
# Shared Kernel

Contains the ubiquitous language of the domain: value objects, port interfaces, and utilities. No NestJS or framework code — pure TypeScript. All services depend on this package; it depends on nothing inside the monorepo.

## Key Files

- `src/value-objects/money.ts` — Money value object with currency and arithmetic guards
- `src/value-objects/user-id.ts` — UserId branded type
- `src/value-objects/budget-period.ts` — BudgetPeriod (month/year) value object
- `src/value-objects/transaction-type.ts` — INCOME / EXPENSE enum
- `src/interfaces/event-bus.port.ts` — EventBusPort: publish/subscribe contract
- `src/interfaces/cache.port.ts` — CachePort: get/set/del contract
- `src/interfaces/repository.port.ts` — Generic RepositoryPort
- `src/exceptions/domain.exception.ts` — Base domain exception
- `src/exceptions/not-found.exception.ts` — NotFoundDomainException
- `src/utils/uuid.ts` — UUID v4 generator
- `src/utils/correlation-id.ts` — Correlation ID helper

## Decisions

- Compiled to JS and referenced as a workspace package (`@mm/shared-kernel`) so TypeScript consumers get types and JS consumers get runtime code without a separate build step per consumer.
- No framework imports — keeps the kernel portable and independently testable.
