# Design: Fresh Slop-Audit Pass

**Date:** 2026-06-27
**Topic:** Code-quality / anti-slop audit of the Money Manager monorepo
**Status:** Draft → pending user review

## Goal

Produce a fresh, comprehensive code-quality audit of the Money Manager monorepo that the user can skim and use to triage follow-up cleanup work before the 2026-07-02 take-home submission deadline.

The audit covers three review layers:

1. **High-confidence slop** — dead code, unused exports, single-implementation interfaces, pass-through wrappers, clear duplication, weak test coverage on critical paths, layer violations
2. **UI / design nits** (frontend only) — palette rationale, shadow restraint, typography size, layout rhythm, gradient overuse, emoji-as-icons, animation duplication
3. **Architectural smells** — CQRS ceremony, shared-DB coupling, missing auth flow, event-bus indirection, deploy-topology risks, observability gaps

Output: one committed markdown file at `docs/audits/2026-06-27-slop-audit.md`. No code changes.

## Approach

Spawn **two** parallel `explore` subagents, split by codebase area rather than by review layer. This gives each agent a coherent mental model (one codebase area) while still covering all three layers within their scope.

### Agent A — Backend audit

- **Subagent type:** `explore`
- **Scope:** `services/**`, `packages/**`, `render.yaml`, `docker-compose.yml`, root `*.yml`
- **Layers covered:** code-quality + architecture (backend)
- **Findings to surface:**
  - Dead exports / unused imports / commented code / TODOs / FIXMEs
  - Single-implementation interfaces, pass-through wrappers, single-use DI tokens
  - Duplicate logic across services (mappers, command shapes, exception filters)
  - Layer violations (e.g. application handlers importing from infrastructure package)
  - Missing tests on critical paths: Money value object, write handlers (update/delete), Kafka publish points, budget projection logic
  - `BudgetStatusDto` exposed from handler file but consumed by infrastructure/cache
  - `EVENT_BUS_PORT` / `CACHE_PORT` re-export indirection through infrastructure package
  - Shared Postgres across 5 services on Render (free plan) — single point of failure
  - Auth flow: `CurrentUser` decorator exists but no real auth provider
  - `worker-service/src/cli/seed.command.ts` is the seed entry point, not dead code (prior survey miscategorized it)
  - Health-check coverage gaps

### Agent B — Frontend audit

- **Subagent type:** `explore`
- **Scope:** `frontend/**` (Vue + Tailwind config + vite + index.html + package.json)
- **Layers covered:** code-quality + UI/design + frontend architecture
- **Findings to surface:**
  - Dead exports / unused components / unused routes / dead composables
  - Pinia store boilerplate duplication that survived the prior cleanup (budget.store.ts)
  - `useAsync` composable just added — confirm it was wired correctly in all stores
  - Tailwind palette: `hsl(221.2 83.2% 53.3%)` and `217.2 91.2% 59.8%` are shadcn defaults — flag if no brand rationale
  - Shadow use on every card / surface — pattern or restraint?
  - Body text size on currency / table cells — flag if < 13px
  - Uniform 3-4 column grids without rhythm (MonthlySummary, DashboardView)
  - GSAP import duplication across components despite existing `useGsapNumber` composable
  - Hardcoded emoji nav icons (`📊 💰 📋 🏷️`) instead of SVG icon library
  - Vue Router structure: lazy-loading, route guards for auth
  - Error boundary / global error handler
  - Type safety: any casts, missing return types on async functions

### Coordinator role (me, the main loop)

1. Spawn both agents in a **single message** (parallel)
2. Wait for both results
3. Merge into a single markdown report
4. De-duplicate findings that touch both areas (rare)
5. Produce a **Top 10 actionable** section at the end, ranked by impact × confidence
6. Write the file to `docs/audits/2026-06-27-slop-audit.md`
7. Commit with message `docs(audit): fresh slop audit 2026-06-27`

## Report format

The markdown file has this structure:

```markdown
# Slop Audit — 2026-06-27

## Summary
[2-3 sentence headline finding]

## Findings by category

### 1. Dead code / unused exports
[bullet list, file:line — description — action]

### 2. Duplication
[...]

### 3. Needless abstraction / wrappers
[...]

### 4. Boundary violations
[...]

### 5. Weak regression coverage
[...]

### 6. UI / design defaults
[...]

### 7. Architectural smells
[...]

## Top 10 actionable
[ranked list: #1 highest impact × confidence first]
```

Each finding line: `path/to/file.ts:42 — short description — recommended action (delete / consolidate / keep / refactor / add-test)`.

## Non-goals

- No code edits. This is a review pass, not a cleanup pass.
- No new tests, no test runs.
- No adversarial verification (would require a third pass — overkill for a portfolio review).
- No refactoring suggestions where the code is fine and the smell is debatable.

## Success criteria

The audit succeeds when:
- The file `docs/audits/2026-06-27-slop-audit.md` exists, is committed, and is readable
- Every finding has a file:line citation
- Top 10 actionable section ranks by impact × confidence, not by severity alone
- False-positive rate is acceptable: the user can read and trust 80%+ of findings as actionable without investigation

## Remaining risks

- A single agent per area may miss cross-area findings (e.g., frontend store contracts that depend on backend shape). Coordinator will catch obvious cross-references.
- The audit will surface findings that pre-date the prior cleanup pass — that's expected. The user will diff mentally against the prior report.
- `node_modules`, `dist`, `.git`, `.omc`, `pnpm-lock.yaml`, `*.md` files are excluded from the audit scope.