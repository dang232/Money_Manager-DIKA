---
type: Service
name: Worker Service
description: Background job runner for data seeding and dead-letter-queue retry.
depends_on: [shared-kernel, infrastructure, postgres-txn, postgres-budget, kafka, redis]
---
# Worker Service

Runs scheduled and on-demand jobs isolated from the request path. Has no HTTP port — it is a NestJS CLI application. Two jobs ship: seed-data (populates demo transactions and categories) and dlq-retry (re-publishes failed events from the dead letter queue).

## Key Files

- `src/jobs/seed-data.job.ts` — Seeds demo users, categories, transactions, and budgets
- `src/jobs/dlq-retry.job.ts` — Polls Redis DLQ and republishes events to Kafka/Redis Streams
- `src/cli/` — NestJS CLI bootstrap wiring jobs as commands
- `src/infrastructure/` — Direct DB access via TypeORM for seeding

## Decisions

- Isolated as a separate service so noisy or slow jobs cannot affect API latency in other services.
- DLQ retry is a polling job (not a cron) so it can be triggered manually or on a schedule without modifying the core event bus.
