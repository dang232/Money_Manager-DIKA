---
type: Package
name: Frontend
description: Vue 3 SPA with Pinia state management, Tailwind CSS, and real-time WebSocket updates.
depends_on: [gateway]
---
# Frontend

Single-page application for the money manager. Communicates exclusively with the API gateway. Uses Pinia stores for state, Vue Router for navigation, Tailwind for styling, and GSAP for animations. Connects to the gateway WebSocket for live updates. Runs on port 5173 (Vite dev server).

## Key Files

- `src/views/DashboardView.vue` — Overview with spending summary and recent transactions
- `src/views/TransactionsView.vue` — Transaction list with create/edit/delete
- `src/views/BudgetView.vue` — Budget vs actual spend by category
- `src/views/CategoriesView.vue` — Category management
- `src/views/OnboardingView.vue` — First-run setup flow
- `src/stores/transaction.store.ts` — Pinia store for transaction state
- `src/stores/budget.store.ts` — Pinia store for budget and projection state
- `src/stores/dashboard.store.ts` — Aggregated dashboard data store
- `src/api/` — Axios-based API client modules per domain

## Decisions

- All API calls go through the gateway, never directly to individual services, keeping the frontend decoupled from the service topology.
- WebSocket connection is managed centrally in the UI store and events are dispatched into the relevant Pinia stores to keep views reactive.
