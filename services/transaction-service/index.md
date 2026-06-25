---
type: Service
name: Transaction Service
description: Owns the transaction aggregate — create, read, update, delete transactions and publish domain events.
depends_on: [shared-kernel, infrastructure, postgres-txn, kafka]
---
# Transaction Service

The source of truth for financial transactions. Implements a full DDD vertical slice: aggregate root with business rules, CQRS command/query handlers, TypeORM persistence, and event publishing on every state change. Runs on port 3001.

## Key Files

- `src/domain/aggregates/transaction.aggregate.ts` — Transaction aggregate root with invariants
- `src/domain/events/` — TransactionCreated, TransactionUpdated, TransactionDeleted events
- `src/domain/repositories/transaction.repository.ts` — Repository port implementation
- `src/application/commands/` — CreateTransaction, UpdateTransaction, DeleteTransaction commands
- `src/application/queries/` — GetTransaction, ListTransactions, GetSummary queries
- `src/application/handlers/` — CQRS command and query handlers
- `src/presentation/controllers/` — REST controllers (DTOs, validation)
- `src/infrastructure/` — TypeORM entity, repository adapter, Kafka publisher

## Decisions

- Aggregate enforces that amount must be positive and type must be INCOME or EXPENSE before persisting — business rules are in the domain, not the handler.
- Events are published after successful persistence so downstream consumers only see committed state.
