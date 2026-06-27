# Money Manager

A personal finance tracker built as NestJS microservices with DDD, CQRS, and event-driven architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                        │
│                     Vue 3 SPA  :5173                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP + WebSocket
┌───────────────────────────▼─────────────────────────────────────┐
│                      API Gateway  :3000                          │
│        proxy • circuit-breaker • WebSocket relay                │
└──────┬──────────────┬──────────────┬───────────────┬────────────┘
       │              │              │               │
  HTTP proxy     HTTP proxy     HTTP proxy      dashboard
       │              │              │           aggregation
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼────────┐
│  Transaction│ │   Budget   │ │  AI        │
│  Service    │ │   Service  │ │  Service   │
│  :3001      │ │   :3002    │ │  :3003     │
│  TypeORM    │ │  TypeORM   │ │  Groq/Mock │
│  postgres   │ │  postgres  │ │            │
│  :5432      │ │  :5433     │ └────────────┘
└──────┬──────┘ └─────┬──────┘
       │              │
       └──────┬───────┘
              │ Kafka (local) / Redis Streams (cloud)
┌─────────────▼───────────────────────────────────────────────────┐
│                       Event Bus                                  │
│    topics: transaction.created  budget.updated  ai.suggestion   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ consume
              ┌────────────▼────────────┐
              │     Worker Service      │
              │  seed-data • DLQ-retry  │
              └─────────────────────────┘

Infrastructure
  Redis :6379     — cache + Redis Streams (cloud env)
  Loki  :3100     — log aggregation
  Grafana :3200   — dashboards
```

## Tech Stack

| Layer | Technology |
|---|---|
| Services | NestJS 10, TypeScript 5 |
| Domain | DDD aggregates, CQRS, Ports & Adapters |
| Messaging | Apache Kafka 3.7 (local), Redis Streams (cloud) |
| Database | PostgreSQL 16 per service, TypeORM |
| Cache | Redis 7 |
| Frontend | Vue 3, Pinia, Tailwind CSS, GSAP |
| Observability | Winston, Loki, Grafana |
| Build | pnpm workspaces, Docker multi-stage |
| Deploy | Render (7 deployables) |

## Design Notes

- **Frontend palette:** Primary color (`hsl(221.2 83.2% / 217.2 91.2%)`) is the shadcn default, kept intentionally for the MVP. Swap to a custom palette in `frontend/src/assets/styles/globals.css` if brand alignment becomes a requirement.

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 20+
- pnpm 9+

### Run locally

```bash
git clone <repo>
cd money-manager
pnpm install

# copy env template
cp .env.example .env

# start all 12 containers
docker compose up -d

# wait for services to be healthy, then seed
docker compose exec worker-service pnpm seed
```

App is available at:
- Frontend: http://localhost:5173
- Gateway API: http://localhost:3000
- Grafana: http://localhost:3200

## Development Commands

| Command | What it does |
|---|---|
| `docker compose up -d` | Start all containers |
| `docker compose down` | Stop all containers |
| `docker compose logs -f <service>` | Tail service logs |
| `pnpm install` | Install all workspace dependencies |
| `pnpm -r build` | Build all packages/services |
| `pnpm -r test` | Run all tests |
| `pnpm --filter transaction-service dev` | Run one service in dev mode |
| `docker compose exec worker-service pnpm seed` | Seed demo data |

## Project Structure

```
money-manager/
├── packages/
│   ├── shared-kernel/      # Domain primitives, ports (interfaces)
│   └── infrastructure/     # Kafka/Redis/cache/logging adapters
├── services/
│   ├── transaction-service/  # CRUD transactions, publishes events
│   ├── budget-service/       # Categories, budgets, projections
│   ├── ai-service/           # Category suggestions (Groq)
│   ├── worker-service/       # Seed job, DLQ retry job
│   └── gateway/              # Proxy, circuit breaker, WebSocket
├── frontend/                 # Vue 3 SPA
├── infra/                    # Loki/Grafana configs
├── docker-compose.yml        # 12 containers local dev
└── render.yaml               # 7 deployables cloud
```

## API Endpoints

All routes are proxied through the gateway at `:3000`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/transactions` | Create transaction |
| `GET` | `/api/transactions` | List transactions (paginated) |
| `GET` | `/api/transactions/summary` | Spending summary |
| `GET` | `/api/transactions/:id` | Get transaction |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |
| `GET` | `/api/budgets` | List budgets |
| `POST` | `/api/budgets` | Create budget |
| `GET` | `/api/budgets/projection` | Budget projection |
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories` | Create category |
| `POST` | `/api/ai/suggest` | AI category suggestion |
| `GET` | `/api/dashboard` | Aggregated dashboard data |
| `WS` | `/ws` | Real-time event relay |

## Design Decisions

- **Shared kernel as npm package** — value objects (Money, UserId, BudgetPeriod) and port interfaces live in `packages/shared-kernel` so all services share the same domain language without coupling implementations.
- **EventBusPort abstraction** — Kafka locally, Redis Streams on Render. Same interface, swapped at startup via `EventBusFactory`. No service code changes between environments.
- **Per-service PostgreSQL** — each service owns its schema. No cross-service joins; budget projections are built from events.
- **Circuit breaker in gateway** — downstream failures degrade gracefully rather than cascading.
- **Worker service for side effects** — seed data and DLQ retry are isolated from the core services, preventing noisy jobs from affecting latency.

## Deployment

Deployed on [Render](https://render.com) via `render.yaml`.

Services deployed: gateway, transaction-service, budget-service, ai-service, worker-service, postgres-txn, postgres-budget.

Redis and messaging use Render's managed Redis with Redis Streams in cloud mode.

```bash
# manual deploy trigger (Render auto-deploys on push to main)
git push origin main
```
