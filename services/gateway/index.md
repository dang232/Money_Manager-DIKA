---
type: Service
name: API Gateway
description: Single entry point — HTTP proxy, circuit breaker, WebSocket relay, and dashboard aggregation.
depends_on: [transaction-service, budget-service, ai-service, redis]
---
# API Gateway

The only service exposed to the browser. Proxies REST calls to downstream services, aggregates the dashboard response in a single request, relays Kafka events over WebSocket, and wraps each downstream call in a circuit breaker. Runs on port 3000.

## Key Files

- `src/proxy/transaction-proxy.controller.ts` — Forwards `/api/transactions/*` to transaction-service
- `src/proxy/budget-proxy.controller.ts` — Forwards `/api/budgets/*` and `/api/categories/*` to budget-service
- `src/proxy/ai-proxy.controller.ts` — Forwards `/api/ai/*` to ai-service
- `src/proxy/dashboard.controller.ts` — Aggregates data from multiple services for the dashboard
- `src/proxy/http-proxy.service.ts` — Shared HTTP proxy logic with circuit breaker integration
- `src/circuit-breaker/circuit-breaker.service.ts` — Per-service circuit breaker with open/half-open/closed states
- `src/websocket/ws.gateway.ts` — WebSocket gateway broadcasting real-time events to clients
- `src/websocket/event-relay.service.ts` — Consumes events from the bus and pushes to WebSocket clients

## Decisions

- Gateway aggregates the dashboard endpoint to avoid multiple round trips from the browser to individual services.
- Circuit breaker state is per downstream service so a failing budget-service does not block transaction reads.
