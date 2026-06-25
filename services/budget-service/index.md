---
type: Service
name: Budget Service
description: Manages spending categories and budgets, builds projections by consuming transaction events.
depends_on: [shared-kernel, infrastructure, postgres-budget, kafka]
---
# Budget Service

Owns categories and budget limits. Listens to `transaction.created` / `transaction.updated` / `transaction.deleted` events from the transaction service and updates budget projections in real time. Exposes read endpoints for current vs budgeted spend. Runs on port 3002.

## Key Files

- `src/domain/aggregates/` — Category and Budget aggregate roots
- `src/domain/services/` — Budget projection domain service
- `src/domain/events/` — BudgetExceeded, CategoryUpdated events
- `src/application/consumers/` — Kafka consumers for transaction events
- `src/application/commands/` — CreateCategory, CreateBudget, UpdateBudget
- `src/application/queries/` — ListBudgets, GetProjection, ListCategories
- `src/presentation/controllers/` — REST controllers for categories and budgets
- `src/infrastructure/` — TypeORM entities, repository adapters

## Decisions

- Projections are derived from events rather than joining the transaction database — each service owns its own data.
- Budget projection is recalculated on each relevant event rather than stored as a snapshot, keeping the logic simple at current scale.
