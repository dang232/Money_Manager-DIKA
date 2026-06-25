# Change Log

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Initial microservices architecture: gateway, transaction-service, budget-service, ai-service, worker-service
- Shared kernel package with domain value objects (Money, UserId, BudgetPeriod) and port interfaces
- Infrastructure package with Kafka, Redis Streams, and Redis cache adapters
- EventBusFactory for environment-driven adapter selection (Kafka local, Redis Streams cloud)
- Docker Compose local development environment with 12 containers
- Render cloud deployment configuration (render.yaml, 7 deployables)
- PostgreSQL per-service databases with TypeORM migrations
- DDD aggregates with CQRS command/query handlers in transaction and budget services
- Event-driven budget projection via transaction domain events
- AI category suggestion service with Groq LLM and deterministic mock provider
- Worker service with seed-data job and DLQ retry job
- Circuit breaker in gateway with per-service open/half-open/closed state
- Dashboard aggregation endpoint combining data from multiple services
- Real-time WebSocket event relay from Kafka to browser clients
- Vue 3 SPA with Pinia stores, Tailwind CSS, GSAP animations
- Onboarding flow for first-run setup
- Grafana + Loki observability stack with Winston transport
- Health check endpoints using NestJS Terminus
- pnpm workspaces monorepo with shared tsconfig.base.json
