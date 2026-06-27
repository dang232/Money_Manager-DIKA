# Slop Audit — 2026-06-27

**Scope:** Backend (`services/`, `packages/`, `render.yaml`, `docker-compose.yml`) and Frontend (`frontend/**`) of the Money Manager monorepo.

**Method:** Two parallel `explore` subagents, one per codebase area. Findings reported as-is from each agent, deduplicated and ranked by the coordinator. No code changes — review only.

---

## Summary

The codebase is structurally sound: DDD layering holds, the shared kernel is real, and the prior cleanup pass landed correctly (publisher dead code removed, Money value object now tested, two Pinia stores refactored to `useAsync`). The remaining slop is concentrated in three areas: **(1) DI-token split-brain** between `@money-manager/infrastructure` and `@money-manager/shared-kernel` that forces application handlers to import from infrastructure; **(2) wiring gaps** — health indicators and `BudgetStatusDto` exist but are not connected to their consumers; **(3) frontend polish debt** — one dead composable, one store still on the old loading pattern, shadcn-default palette with no brand rationale.

---

## Findings by category

### 1. Dead code / unused exports

- `frontend/src/composables/useWebSocket.ts:1-53` — exported composable with 54 lines of socket.io wiring, 0 imports in codebase — **delete**
- `packages/infrastructure/src/index.ts:17` — `KafkaHealthIndicator`, `RedisHealthIndicator`, `PostgresHealthIndicator` exported but NOT wired into any service module — **wire or delete**
- `.env.example:2-5` — `GATEWAY_PORT`, `TRANSACTION_SERVICE_PORT`, `BUDGET_SERVICE_PORT`, `AI_SERVICE_PORT` defined but never referenced in code (services read `process.env.PORT` or hardcode) — **delete**
- `services/transaction-service/src/main.ts:19`, `services/budget-service/src/main.ts:12`, `services/ai-service/src/main.ts:19`, `services/worker-service/src/main.ts:17`, `services/worker-service/src/cli/seed.command.ts:17`, `services/worker-service/src/jobs/seed-data.job.ts:109` — bare `console.log` / `console.error` instead of structured logger — **refactor** to inject `LOGGER_TOKEN`

### 2. Single-use / pass-through abstractions

- `frontend/src/composables/useWebSocket.ts:1-53` — exported but never imported — **delete** (also flagged in section 1)
- `frontend/src/composables/useWebSocket.ts:46` — `connect()` called at import time as a side effect — moot once deleted

### 3. Duplicate logic

- `frontend/src/stores/budget.store.ts:8,13-23,26-34,36-45` — still uses manual `loading = ref(false)` / try/finally pattern while sibling stores (transaction, category) refactored to `useAsync` — **refactor** (align with `use-async` pattern)
- `frontend/src/components/MonthlySummary.vue:3,18` and `frontend/src/components/BudgetHealthList.vue:3,22` — `gsap` imported directly for entrance / bar animations despite existing `useGsapNumber.ts` composable — **refactor** to use the composable or a sibling
- `services/budget-service/src/infrastructure/persistence/budget.mapper.ts` + `services/transaction-service/src/infrastructure/persistence/transaction.mapper.ts` + `services/budget-service/src/infrastructure/persistence/category.mapper.ts` — identical `toDomain` / `toEntity` static method pattern across all three — **consolidate** into shared `EntityMapper` base in `shared-kernel` (low priority: only ~30 lines saved)
- `services/budget-service/src/presentation/dtos/budget.dto.ts:28-36` — `BudgetStatusResponseDto` has identical shape to `BudgetStatusDto` in `get-budget-status.handler.ts:7-15` — **consolidate** (move handler's DTO to `presentation/dtos/`, fix layering)
- `services/budget-service/src/presentation/dtos/budget.dto.ts:38-44` — `BudgetProjectionResponseDto` duplicates `BudgetProjectionDto` in `get-budget-projections.handler.ts:8-14` — **consolidate**
- *Intentional CQRS ceremony* — all command / query / event classes follow the same `public readonly` constructor pattern. Acceptable, not duplication.

### 4. Layer violations / boundary leaks (backend)

- `services/budget-service/src/application/handlers/get-budget-status.handler.ts:7` — `BudgetStatusDto` exported from application layer but consumed by `services/budget-service/src/infrastructure/cache/budget-cache.service.ts:5` — **refactor** (move to `presentation/dtos/budget.dto.ts`)
- `services/gateway/src/websocket/event-relay.service.ts:4` — imports `EVENT_BUS_PORT` from `@money-manager/infrastructure` — **refactor** to import from `@money-manager/shared-kernel` (port interface lives there)
- `services/gateway/src/proxy/dashboard.controller.ts:6` — imports `CACHE_PORT` from `@money-manager/infrastructure` — **refactor** to import from `@money-manager/shared-kernel`
- `services/budget-service/src/infrastructure/cache/budget-cache.service.ts:4` — imports `CACHE_PORT` from `@money-manager/infrastructure` — **refactor** to import from `@money-manager/shared-kernel`
- **Port-token split-brain (root cause):** `EVENT_BUS_PORT` and `CACHE_PORT` are DI tokens defined in `@money-manager/infrastructure` but the *interfaces* (`EventBusPort`, `CachePort`) live in `@money-manager/shared-kernel`. Application handlers `@Inject(EVENT_BUS_PORT)` while typing against the shared-kernel interface. Fix: move tokens adjacent to their interfaces in `shared-kernel`; infrastructure re-exports them. **refactor**

### 5. Type-safety holes (frontend)

- `frontend/src/composables/use-async.ts:13` — `catch (e: any)` — **refactor** to `unknown` with narrowing
- `frontend/src/views/TransactionsView.vue:35` — `function openEdit(tx: any)` — **refactor** to accept `Transaction`
- `frontend/src/views/CategoriesView.vue:20` — `function openEdit(cat: any)` — **refactor** to accept `Category`
- `frontend/src/composables/useWebSocket.ts:37` — `handler: (...args: any[])` — moot once file deleted

Total: 4 `any` occurrences across 4 files.

### 6. Weak regression coverage (backend)

- `services/transaction-service/src/domain/aggregates/transaction.aggregate.ts:80-93` — `Transaction.reconstitute` path not covered by `transaction.aggregate.spec.ts` (only `Transaction.create` is tested) — **add-test**
- `services/transaction-service/src/application/handlers/create-transaction.handler.ts:27` — Kafka publish call not verified by spec — **add-test** (assert `eventBus.publish` was called with the correct topic/payload)
- `services/transaction-service/src/application/handlers/update-transaction.handler.ts:33` — Kafka publish not covered by any test — **add-test**
- `services/transaction-service/src/application/handlers/delete-transaction.handler.ts:26` — Kafka publish not covered — **add-test**
- `services/budget-service/src/application/handlers/update-running-total.handler.ts:28-35` — `BudgetExceededEvent` publish not covered — **add-test**
- `services/budget-service/src/domain/services/budget-projection.service.ts:30-36` — `daysElapsedInPeriod` private, boundary cases not explicit (month start/end, leap year) — **add-test**
- `services/budget-service/src/infrastructure/persistence/budget.repository.impl.ts` and `category.repository.impl.ts` — MikroORM `save` paths not covered by unit tests — **add-test**

*Credit given:* `services/transaction-service/test/transactions.e2e-spec.ts` and `services/budget-service/test/budget-flow.e2e-spec.ts` cover CRUD happy paths.

### 7. UI / design defaults (frontend)

- `frontend/src/assets/styles/globals.css:11,31` — primary color uses shadcn default `221.2 83.2%` (light) / `217.2 91.2%` (dark) with no brand doc explaining the choice — **polish**: either customize or document the rationale in the README
- `frontend/src/components/layout/AppLayout.vue:26-29` — hardcoded emoji icons (`📊 💰 📋 🏷️`) instead of an SVG icon library — **polish** (lucide-vue-next adds ~30kb for a meaningful UX upgrade)
- `frontend/src/components/TransactionForm.vue:46`, `frontend/src/views/CategoriesView.vue:117`, `frontend/src/views/BudgetView.vue:98` — `shadow-lg` repeated on every dialog card — **consolidate** into a `.card-dialog` Tailwind component class
- Body text size — `text-xs` (12px) used for muted labels/dates, within acceptable range — **keep**
- `MonthlySummary.vue` 3-column grid — consistent and rhythmic for its purpose — **keep**
- No gradients found in components — **pass**
- Dark mode (`darkMode: 'class'` + `dark:` variants) — **pass**
- Routes are lazy-loaded — **pass**

### 8. Architectural smells (backend)

- `render.yaml:126-130` — single `mm-postgres` free-tier database shared across all 5 services (transaction, budget, ai, worker, gateway) — single point of failure; on Render free plan, exceeding 1 GB or 97 connection-hours/month kills the DB and all services — **refactor**: split into per-service databases OR upgrade to Starter plan
- `render.yaml:18-21` — gateway uses `DATABASE_URL` but the gateway doesn't have a database (it only proxies) — **remove or document**
- `services/transaction-service/src/main.ts`, `services/budget-service/src/main.ts`, `services/ai-service/src/main.ts`, `services/worker-service/src/main.ts` — no `/health` endpoint exposed; infrastructure provides `KafkaHealthIndicator` / `RedisHealthIndicator` / `PostgresHealthIndicator` but no service wires them — **refactor**: add Terminus `HealthModule` to all four backend services
- `services/transaction-service/src/app.module.ts:20-25` and `services/budget-service/src/app.module.ts:31-39` — DB env vars inconsistent with `render.yaml`: services read `DB_HOST/PORT/NAME/USERNAME/PASSWORD`, render passes `DATABASE_URL` — **refactor**: pick one strategy and align (MikroORM supports `dbName: () => connectionString`)
- `packages/shared-kernel/src/decorators/current-user.decorator.ts:9` — `CurrentUser` falls back to `UserId.DEFAULT.value` when no `x-user-id` header is present; JWT_SECRET exists in `.env.example` but no JWT validation is implemented (`grep` finds no `passport-jwt` / `jsonwebtoken` usage) — **note**: known placeholder; defer real auth to Keycloak / SSO integration
- `services/transaction-service/src/main.ts:19` and the three sibling services — bare `console.log` for boot messages instead of structured logger (see also section 1) — **refactor**
- Cross-area wire-contract risk (from coordinator): `frontend/src/api/budget.api.ts` defines `BudgetStatus` with fields `categoryName`, `budgetAmount`, `spentAmount`, `percentage`, while the backend `BudgetStatusDto` exposes `budgetId`, `categoryId`, `monthlyLimit`, `runningTotal`, `usagePercentage`. **verify**: open the actual `/api/budgets` response and confirm the frontend `BudgetStatus` type matches — this is a likely runtime mismatch.

### 9. Frontend architecture

- `frontend/src/main.ts:1-12` — no global error handler / `app.config.errorHandler`; silent `catch {}` in `dashboard.store.ts:20-21` swallows errors — **add** global error handler at minimum
- `frontend/src/router/index.ts:38-42` — auth guard via `localStorage.mm-onboarded` — adequate for onboarding, but no JWT/session guard for protected routes — **note** (acceptable for MVP, defer until real auth lands)
- No i18n — `formatDate` / `formatVND` hardcoded to `vi-VN` — **note** for future scope
- Routes lazy-loaded — **pass**

---

## Top 10 actionable

Ranked by impact × confidence (highest first).

1. **Move DI tokens into `shared-kernel`** — `EVENT_BUS_PORT`, `CACHE_PORT`, `LOGGER_TOKEN` next to their interfaces; have `@money-manager/infrastructure` re-export. Fixes the root cause for 4 of the layer-violation findings in section 4. *(backend, refactor, ~15 min)*
2. **Wire Terminus health checks into all four backend services** — `transaction`, `budget`, `ai`, `worker` — and remove the unused `DATABASE_URL` from the gateway. Required for Render free plan to not crash-loop services after 90s. *(backend, refactor, ~1 h)*
3. **Delete `frontend/src/composables/useWebSocket.ts`** — 54 lines, 0 imports, dead on arrival. *(frontend, delete, 1 min)*
4. **Move `BudgetStatusDto` out of `application/handlers/` into `presentation/dtos/budget.dto.ts` and consolidate with `BudgetStatusResponseDto`** — fixes one layer violation and one duplication in a single move. *(backend, refactor, ~30 min)*
5. **Refactor `frontend/src/stores/budget.store.ts` to use `useAsync`** — finishes what the prior cleanup pass started; the API across all three data stores will be uniform. *(frontend, refactor, ~15 min)*
6. **Verify and fix the `BudgetStatus` wire-contract mismatch** — open `/api/budgets` in a live request and confirm frontend type matches backend response. If they differ, update whichever side is canonical. *(cross-area, verify+fix, ~30 min)*
7. **Add handler-level tests for Kafka publish paths** — `create-transaction`, `update-transaction`, `delete-transaction`, `update-running-total`. Mock `eventBus.publish` and assert topic + payload. *(backend, add-test, ~1 h)*
8. **Consolidate the three mapper classes into a shared `EntityMapper` base** in `packages/shared-kernel` — modest payoff but cleans up the persistence layer. *(backend, refactor, ~30 min)*
9. **Type the 4 remaining `any` casts** — `use-async.ts` catch, `TransactionsView.openEdit`, `CategoriesView.openEdit`, and the file deleted in #3. *(frontend, refactor, ~10 min)*
10. **Document the primary-color choice in the README** — either customize the palette or note that shadcn defaults are intentional. *(docs, 1 line)*

---

## Items already addressed in prior cleanup pass

For reference — these were flagged by the earlier survey and have been resolved.

- **Deleted:** `services/transaction-service/src/infrastructure/messaging/transaction-event.publisher.ts` (unused DI provider)
- **Extracted:** `frontend/src/composables/use-async.ts` (replaces 2 stores' loading boilerplate)
- **Refactored:** `frontend/src/stores/transaction.store.ts` and `category.store.ts` to use `useAsync`
- **Added:** `services/budget-service/src/value-objects/money.spec.ts` (12 unit tests for Money)
- **Confirmed live (not dead):** `services/worker-service/src/cli/seed.command.ts` is the seed entry point, referenced by `pnpm seed` in `services/worker-service/package.json`

---

## Next steps

Skim the Top 10 list above and pick what to act on before the 2026-07-02 submission deadline. The **two highest-leverage items** are #1 (DI-token split-brain — fixes four findings) and #2 (health checks — required for Render free plan to not crash-loop). #3 and #5 are quick wins worth doing today. Items #6–#10 can be deferred to a post-submission cleanup pass without affecting the take-home review.

Items deliberately deferred to post-deadline:

- Per-service Postgres split (architecturally important but free-plan constraint; document the trade-off in the README instead)
- Real auth flow (out of scope for this MVP)
- i18n / l10n (deferred)
- Mapper consolidation (#8) — modest payoff, easy to slip