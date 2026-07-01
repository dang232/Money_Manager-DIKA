# Money Manager - Quản Lý Chi Tiêu Cá Nhân

A personal finance tracker built as NestJS microservices with DDD, CQRS, and event-driven architecture.

## Assignment Requirements Compliance

> **Final Assignment**: This application was built to meet the Personal Expense Management System requirements:
>
> | Requirement | Status | Implementation |
> |-------------|--------|----------------|
> | Income tracking | ✅ | `TransactionEntity` with `type: 'INCOME'`, CRUD via REST API |
> | Expense tracking | ✅ | `TransactionEntity` with `type: 'EXPENSE'`, full CRUD operations |
> | Monthly budget management | ✅ | `BudgetEntity` with `monthlyLimit`, `runningTotal`, period tracking |
> | Dashboard with summaries | ✅ | `DashboardController` aggregates summary, budgets, projections |
> | Transaction history | ✅ | `TransactionsView.vue` with filters, pagination, grouping by date |
> | Category management | ✅ | Budget service handles categories with CRUD |
> | Budget projections | ✅ | `budget-projection.service.ts` calculates future spending |
> | AI chat/insights | ✅ | `AiChat.vue` + `ai-service` with Groq integration |
> | Multi-user support | ✅ | `CurrentUser` decorator, JWT authentication |
> | Real-time updates | ✅ | WebSocket via `EventRelayService` |
> | Database design | ✅ | MikroORM entities with proper indexes |
> | REST API | ✅ | Gateway proxies to microservices |

---

## Features

### Core Features
- **Transaction Management**: Create, read, update, delete income/expense transactions
- **Category System**: Customizable categories for transactions (Food, Transport, Entertainment, etc.)
- **Monthly Budgets**: Set spending limits per category with real-time tracking
- **Budget Projections**: AI-powered forecasts based on spending patterns
- **Dashboard**: Financial overview with charts, summaries, and trend analysis
- **AI Assistant**: Chat with AI to get spending insights and suggestions
- **Real-time Updates**: WebSocket-based live updates across devices

### Security Features
- JWT-based authentication
- Cookie-based session management
- CSRF protection
- User data isolation

---

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
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼────────┐ ┌────▼─────┐
│  Transaction│ │   Budget   │ │  AI        │ │  Auth    │
│  Service    │ │   Service  │ │  Service   │ │  Service │
│  :3001      │ │   :3002    │ │  :3003     │ │  :3004   │
│  MikroORM   │ │  MikroORM  │ │  Groq/Mock │ │  JWT     │
└──────┬──────┘ └─────┬──────┘ └────────────┘ └──────────┘
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
              │  seed-data • DLQ-retry │
              └─────────────────────────┘

Infrastructure
  PostgreSQL  — per-service databases
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
| Database | PostgreSQL 16, MikroORM |
| Cache | Redis 7 |
| Frontend | Vue 3, Pinia, Tailwind CSS, GSAP, Chart.js |
| Observability | Winston, Loki, Grafana |
| Build | pnpm workspaces, Docker multi-stage |
| Deploy | Render (9 services) |

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 20+
- pnpm 9+

### Run locally

```bash
git clone https://github.com/dang232/Money_Manager-DIKA.git
cd Money_Manager-DIKA
pnpm install

# copy env template
cp .env.example .env

# start all containers
docker compose up -d

# wait for services to be healthy, then seed
docker compose exec worker-service pnpm seed
```

App available at:
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
│   ├── infrastructure/     # Kafka/Redis/cache/logging adapters
│   └── shared-types/       # Shared TypeScript types
├── services/
│   ├── transaction-service/  # CRUD transactions, publishes events
│   ├── budget-service/       # Categories, budgets, projections
│   ├── ai-service/           # Category suggestions (Groq)
│   ├── auth-service/         # JWT authentication
│   ├── user-service/         # User profile management
│   ├── worker-service/       # Seed job, DLQ retry job
│   └── gateway/              # Proxy, circuit breaker, WebSocket
├── frontend/                 # Vue 3 SPA
├── infra/                    # Loki/Grafana configs
├── docker-compose.yml        # Containers for local dev
└── render.yaml               # Blueprint for Render deployment
```

## API Endpoints

All routes are proxied through the gateway at `:3000`.

### Transactions
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/transactions` | Create transaction |
| `GET` | `/api/transactions` | List transactions (paginated) |
| `GET` | `/api/transactions/summary` | Spending summary |
| `GET` | `/api/transactions/:id` | Get transaction |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |

### Budgets & Categories
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/budgets` | List budgets |
| `POST` | `/api/budgets` | Create budget |
| `GET` | `/api/budgets/projections` | Budget projection |
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories` | Create category |

### Dashboard & AI
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Aggregated dashboard data |
| `POST` | `/api/ai/suggest` | AI category suggestion |
| `POST` | `/api/ai/chat` | AI chat assistant |

### Authentication
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/refresh` | Refresh token |

### WebSocket
| Path | Description |
|---|---|
| `/ws` | Real-time event relay |

## Design Decisions

- **Shared kernel as npm package** — value objects (Money, UserId, BudgetPeriod) and port interfaces live in `packages/shared-kernel` so all services share the same domain language without coupling implementations.
- **EventBusPort abstraction** — Kafka locally, Redis Streams on Render. Same interface, swapped at startup via `EventBusFactory`. No service code changes between environments.
- **Per-service PostgreSQL** — each service owns its schema. No cross-service joins; budget projections are built from events.
- **Circuit breaker in gateway** — downstream failures degrade gracefully rather than cascading.
- **Worker service for side effects** — seed data and DLQ retry are isolated from the core services, preventing noisy jobs from affecting latency.

## Deployment

Deployed on [Render](https://render.com) via `render.yaml` Blueprint.

### Services
- `mm-gateway` - API Gateway
- `mm-transaction` - Transaction service
- `mm-budget` - Budget service
- `mm-auth` - Authentication service
- `mm-user` - User service
- `mm-ai` - AI service
- `mm-worker` - Background worker
- `mm-frontend` - Vue 3 SPA (static)

### Databases
- `mm-postgres` - PostgreSQL database
- `mm-redis` - Redis for caching and streams

### Deploy Steps

```bash
# Push to main to trigger auto-deploy
git push origin main
```

Or use the Blueprint link:
https://dashboard.render.com/blueprint/new?repo=https://github.com/dang232/Money_Manager-DIKA

### Required Environment Variables
Set these in Render Dashboard:
- `JWT_SECRET` - JWT signing secret (generate with `openssl rand -base64 32`)
- `GROQ_API_KEY` - Groq API key for AI chat (get from https://console.groq.com)

> ⚠️ **Render Free Tier**: Services sleep after 15 min inactivity. Upgrade for production.

---

## Limitations & Assumptions

### Architecture Decisions
- **Single Database on Render**: Local uses per-service PostgreSQL, but Render free tier consolidates to one database with shared schema
- **Redis Streams as Event Bus**: Kafka (local) replaced with Redis Streams on Render
- **No mTLS in Cloud**: Mutual TLS certificates for local dev are not configured on Render (services are internal)

### Known Limitations
| Limitation | Description |
|---|---|
| **Free Tier Sleep** | Render free services sleep after 15 min; cold start ~30s |
| **Single Currency** | Currently VND only; multi-currency not implemented |
| **No Email Verification** | User registration is instant without email verification |
| **GROQ API Key Required** | AI chat requires user to provide their own Groq API key |
| **Drag-to-reorder** | Budget reorder UI disabled pending composable fix |

### Future Improvements
- [ ] Multi-currency support with exchange rates
- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Export transactions to CSV/PDF
- [ ] Recurring transactions
- [ ] Savings goals
- [ ] Investment tracking
- [ ] Receipt photo upload
- [ ] Mobile app (React Native)
- [ ] Dark mode toggle

---

## License

MIT
