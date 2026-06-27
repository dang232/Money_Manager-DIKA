# Slop-Audit Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a fresh, comprehensive code-quality audit of the Money Manager monorepo at `docs/audits/2026-06-27-slop-audit.md`, committed.

**Architecture:** Two parallel `explore` subagents, each scanning a different codebase area (backend, frontend). The coordinator merges results, de-duplicates, ranks, writes, and commits the report.

**Tech Stack:** `Agent` tool (parallel subagents of type `explore`), markdown, git.

**Spec:** `docs/superpowers/specs/2026-06-27-slop-audit-design.md`

---

## File Structure

- **Create:** `docs/audits/2026-06-27-slop-audit.md` — the final audit report (one file, no code changes anywhere else)

---

### Task 1: Pre-flight — confirm working tree and report path

**Files:**
- Touch: none (read-only check)

- [ ] **Step 1: Verify clean working tree (uncommitted changes from prior cleanup pass expected)**

Run: `git status --short`

Expected: shows the cleanup-pass leftovers — modified `frontend/src/stores/{category,transaction}.store.ts`, modified `services/transaction-service/src/app.module.ts`, deleted `services/transaction-service/src/infrastructure/messaging/transaction-event.publisher.ts`, untracked `frontend/src/composables/use-async.ts`, untracked `services/budget-service/src/value-objects/money.spec.ts`.

If anything unexpected is in the tree, STOP and surface to the user before continuing — don't run the audit on top of unverified state.

- [ ] **Step 2: Verify report target path does not yet exist**

Run: `test -f docs/audits/2026-06-27-slop-audit.md && echo EXISTS || echo OK`

Expected: `OK` (file does not yet exist). If `EXISTS`, STOP — the report would overwrite an existing audit.

- [ ] **Step 3: Verify spec is in place**

Run: `test -f docs/superpowers/specs/2026-06-27-slop-audit-design.md && echo OK`

Expected: `OK`.

- [ ] **Step 4: Confirm scope to user before launching agents**

Briefly tell the user: "Audit ready to launch. Two parallel explore agents will run (~5-10 min). No code changes — review-only. Proceeding."

---

### Task 2: Spawn Agent A — Backend audit

**Files:**
- Read-only: `services/**`, `packages/**`, `render.yaml`, `docker-compose.yml`, root `*.yml`

- [ ] **Step 1: Launch backend audit agent in background**

Use the `Agent` tool with:
- `subagent_type: "explore"`
- `description: "Backend slop audit"`
- `prompt:` (use the prompt below verbatim)

Prompt for Agent A:

```
You are auditing the BACKEND of a NestJS microservices monorepo at C:\Users\dangq\OneDrive\Documents\GitHub\Money_Manager-DIKA for code-quality / anti-slop issues. You do NOT edit files — read-only review.

Project layout:
- services/transaction-service, budget-service, ai-service, worker-service, gateway
- packages/shared-kernel (domain primitives + ports)
- packages/infrastructure (Kafka/Redis/cache/logging adapters)
- render.yaml (cloud deploy, 7 deployables)
- docker-compose.yml (local 12 containers)
- root *.yml, .env.example

Audit these categories. For each finding, output a line: `file:line — short description — action (delete | consolidate | keep | refactor | add-test)`.

1. **Dead code / unused exports** — exported symbols with zero imports, unused imports, commented-out code blocks > 5 lines, TODO/FIXME/XXX markers, empty no-op methods, unused private fields, env vars in .env.example not referenced in code.

2. **Single-use / pass-through abstractions** — interfaces with one implementation and no test double, single-use DI tokens, services that only call another service, barrel files that re-export one thing, generic BaseX with one subclass.

3. **Duplicate logic** — same mapper shape across services, same DTO defined multiple places, same error-handler pattern repeated, same command-shape pattern (public readonly props) repeated.

4. **Layer violations / boundary leaks** — domain importing infrastructure, application handler importing from infrastructure package instead of shared-kernel port, gateway importing from infrastructure package, frontend store calling another store directly. Cross-check the shared-kernel package — note any port re-exported through @money-manager/infrastructure (e.g. EVENT_BUS_PORT, CACHE_PORT) and whether application handlers correctly use the shared-kernel port.

5. **Weak regression coverage on critical paths** — Money value object (number/add/subtract/equals/currency), Budget aggregate (addSpending/removeSpending/isExceeded), Transaction aggregate (create/reconstitute invariants), Kafka publish points in handlers, repository write paths, budget projection logic. Note: comprehensive e2e coverage already exists for transaction CRUD via test/transactions.e2e-spec.ts — credit where due, don't duplicate.

6. **Architectural smells** — single Postgres shared across 5 services in render.yaml (single point of failure on free plan), CQRS ceremony where simple CRUD would do, event-bus re-export indirection, missing or unclear auth flow (CurrentUser decorator exists but where does userId come from?), health-check coverage gaps, observability gaps (which services emit structured logs?), secrets management (DATABASE_URL/REDIS_URL hardcoded vs env).

7. **Specific known items to verify, not assume:**
   - `services/worker-service/src/cli/seed.command.ts` is the seed ENTRY POINT (referenced by `pnpm seed` in package.json) — NOT dead code. Do not flag as dead.
   - `services/transaction-service/src/infrastructure/messaging/transaction-event.publisher.ts` was already DELETED in the prior cleanup pass — do not re-flag.
   - `frontend/src/composables/use-async.ts` and `services/budget-service/src/value-objects/money.spec.ts` were added in the prior cleanup pass — verify they wire correctly, don't flag as dead.
   - `services/budget-service/src/infrastructure/cache/budget-cache.service.ts` is a real read-through cache wrapper with typed methods — keep, but check `BudgetStatusDto` is exported from where it should be (presentation/dtos/ preferred over application/handlers/).

Output format: a structured markdown report with these exact section headers, each containing only the lines for that category (omit empty categories):

```
## Backend Audit

### 1. Dead code / unused exports
[lines]

### 2. Single-use / pass-through abstractions
[lines]

### 3. Duplicate logic
[lines]

### 4. Layer violations / boundary leaks
[lines]

### 5. Weak regression coverage
[lines]

### 6. Architectural smells
[lines]

### Notes for coordinator
[anything cross-area, anything you want to flag for the frontend agent to check or avoid duplicating]
```

End with a one-paragraph "highest-impact" summary listing the top 5 things a follow-up cleanup pass should hit first.

Scope: skip node_modules, dist, .git, .omc, pnpm-lock.yaml, *.md (except .env.example), *.test.ts, *.spec.ts (those are tests, not code to audit).
```

- [ ] **Step 2: Capture agent output**

Save the agent's full final reply as the backend findings payload.

---

### Task 3: Spawn Agent B — Frontend audit

**Files:**
- Read-only: `frontend/**` (Vue 3 SPA + Tailwind config + vite + index.html + package.json)

- [ ] **Step 1: Launch frontend audit agent in background (in parallel with Task 2)**

Send Task 2's `Agent` call and this one in the SAME tool-use message so they run concurrently.

Use the `Agent` tool with:
- `subagent_type: "explore"`
- `description: "Frontend slop audit"`
- `prompt:` (use the prompt below verbatim)

Prompt for Agent B:

```
You are auditing the FRONTEND of a Vue 3 SPA at C:\Users\dangq\OneDrive\Documents\GitHub\Money_Manager-DIKA\frontend for code-quality / anti-slop issues. You do NOT edit files — read-only review.

Project layout (all under frontend/):
- src/views/ — Dashboard, Transactions, Budget, Categories, Onboarding
- src/stores/ — Pinia stores (transaction, budget, category, dashboard, ui)
- src/components/ — including layout/AppSidebar, MonthlySummary, AnimatedNumber, BudgetHealthList, TransactionForm
- src/composables/ — including useGsapNumber and a NEW use-async.ts added in a prior cleanup pass
- src/api/ — http-client.ts, transaction/budget/category/dashboard API modules
- src/router/
- src/lib/
- tailwind.config.ts
- vite.config.ts
- index.html
- package.json

Audit these categories. For each finding, output a line: `file:line — short description — action (delete | consolidate | keep | refactor | add-test)`.

1. **Dead code / unused exports** — unused components, unused routes, dead composables, unused imports, unused exports from stores. Specifically check: is every component in src/components/ actually used somewhere? Is every view in src/views/ registered in the router? Is every composable in src/composables/ imported?

2. **Duplicate logic** — Pinia store boilerplate that survived the prior cleanup (transaction.store.ts and category.store.ts were refactored to use use-async; budget.store.ts was NOT — verify and flag if so). GSAP imports duplicated across components despite the existing useGsapNumber composable. Repeated fetch-with-loading patterns.

3. **Single-use / pass-through abstractions** — components used in one place, composables imported but never used, store helpers that just forward to api/.

4. **Type-safety holes** — `: any` casts, missing return types on async functions, missing type definitions on store state. Run `grep -rn "as any\|: any" frontend/src --include="*.ts" --include="*.vue"` and report counts and hot spots.

5. **UI / design defaults** (review these against the brand-rationale test — flag only if no rationale exists):
   - Tailwind palette: check tailwind.config.ts and src/assets/styles/globals.css. Are primary colors custom or shadcn defaults (hsl 221.2 83.2%, hsl 217.2 91.2%)? If defaults, is there a brand doc / design system / CLAUDE.md / README explaining why?
   - Shadow use on every card / surface — pattern or restraint? Check BudgetView, CategoriesView, TransactionForm for `shadow-lg`, `shadow-xl`, etc.
   - Body text size on currency / table cells — anything below 13px?
   - Uniform 3-4 column grids without rhythm — MonthlySummary, DashboardView. Does the layout benefit from rhythm or emphasis?
   - Gradient overuse — search for `bg-gradient-`, `from-`, `to-` in components
   - Hardcoded emoji as nav icons in AppSidebar (`📊 💰 📋 🏷️`) — if no icon library exists, flag as a polish opportunity
   - Animation duplication — GSAP imported directly in AnimatedNumber.vue, BudgetHealthList.vue, MonthlySummary.vue when useGsapNumber.ts exists

6. **Frontend architecture** — Vue Router: lazy-loading routes? route guards for auth (does any guard check user before allowing dashboard)? Error boundary / global error handler in App.vue or main.ts? Loading states consistent across stores after the use-async refactor? i18n / l10n? dark mode?

7. **Specific known items to verify, not assume:**
   - `use-async.ts` was added in the prior cleanup pass — verify it is actually imported by the refactored stores (transaction, category) and not just sitting unused. Verify budget.store.ts still uses the old pattern (and flag whether refactoring it is worth doing).
   - Money value object tests were added to budget-service — not a frontend concern, ignore.
   - TransactionEventPublisher was deleted — not a frontend concern, ignore.
   - Do NOT re-flag items already cleaned up unless you find evidence they weren't actually fixed.

Output format: a structured markdown report with these exact section headers, each containing only the lines for that category (omit empty categories):

```
## Frontend Audit

### 1. Dead code / unused exports
[lines]

### 2. Duplicate logic
[lines]

### 3. Single-use / pass-through abstractions
[lines]

### 4. Type-safety holes
[lines]

### 5. UI / design defaults
[lines]

### 6. Frontend architecture
[lines]

### Notes for coordinator
[anything cross-area, anything you want to flag for the backend agent to check or avoid duplicating]
```

End with a one-paragraph "highest-impact" summary listing the top 5 things a follow-up cleanup pass should hit first.

Scope: skip node_modules, dist, .git, .omc, pnpm-lock.yaml, *.md.
```

- [ ] **Step 2: Capture agent output**

Save the agent's full final reply as the frontend findings payload.

---

### Task 4: Validate both agent outputs

**Files:**
- Read-only: agent outputs

- [ ] **Step 1: Check backend report has all expected sections**

Verify the backend agent returned lines under every section header listed in its prompt. Empty sections are allowed (omit from final), but if entire output is missing or lacks the structure, retry the agent once with a "you didn't return the expected structure — please redo" prompt.

- [ ] **Step 2: Check frontend report has all expected sections**

Same check for the frontend agent.

- [ ] **Step 3: Sanity-check for low-signal findings**

For each finding, ask: is this actionable (delete / consolidate / refactor / add-test) or is it subjective style preference? Findings like "consider renaming X" without clear benefit → drop. Findings like "this dead export" with a concrete file:line → keep.

If > 30% of findings look weak, retry the agent once with a "be stricter — only report HIGH-confidence findings" instruction. Do not retry a third time.

---

### Task 5: Cross-area de-duplication

**Files:**
- Read-only: agent outputs

- [ ] **Step 1: Identify cross-area duplicates**

Look at the "Notes for coordinator" sections from both agents. If either agent flagged something cross-area, or if the same logical finding appears in both reports (e.g., a DTO shape that's flagged on backend AND a store type that's flagged on frontend for the same root cause), keep the finding with more context and drop the other. Add a `// merged with [section]` note.

- [ ] **Step 2: Resolve any conflicts**

If the two agents disagree about a file (e.g., backend says "keep X", frontend says "refactor X"), default to the more conservative action (keep / add-test over delete / refactor) and note both perspectives in the merged finding.

---

### Task 6: Compose the final report

**Files:**
- Create: `docs/audits/2026-06-27-slop-audit.md`

- [ ] **Step 1: Write the report file**

Use the `Write` tool to create `docs/audits/2026-06-27-slop-audit.md` with this structure:

```markdown
# Slop Audit — 2026-06-27

**Scope:** Backend (services/ + packages/ + render.yaml + docker-compose.yml) and Frontend (frontend/**) of the Money Manager monorepo.

**Method:** Two parallel `explore` subagents, one per codebase area. Findings below are reported as-is from each agent, deduplicated and ranked by the coordinator.

## Summary

[2-3 sentences: the single most important finding, the second-most, and the overall trend. Example: "Backend is solid — domain layer is clean, no boundary violations on critical paths. Frontend shows typical Pinia/Vue sprawl: store boilerplate duplication, emoji icons instead of SVG, shadcn-default palette without brand rationale. Highest-value follow-up: introduce a SVG icon set and consolidate the remaining Pinia store boilerplate."]

## Findings by category

### 1. Dead code / unused exports
[merged lines from both agents' section 1, sorted by file path]

### 2. Duplicate logic
[merged section 2]

### 3. Single-use / pass-through abstractions
[merged section 3]

### 4. Layer violations / boundary leaks (backend)
[backend section 4 only — frontend doesn't have this concept]

### 5. Type-safety holes (frontend)
[frontend section 4 only]

### 6. Weak regression coverage
[merged section 5]

### 7. UI / design defaults (frontend)
[frontend section 5 only]

### 8. Architectural smells (backend)
[backend section 6 only]

### 9. Frontend architecture
[frontend section 6 only]

## Top 10 actionable

Ranked by impact × confidence (highest first):

1. [highest-impact, most-confident finding — full file:line and one-line action]
2. ...
3. ...
[continue through #10]

## Items already addressed in prior cleanup pass

(For the user's reference — these were flagged by an earlier survey and have been resolved.)

- Deleted: `services/transaction-service/src/infrastructure/messaging/transaction-event.publisher.ts` (unused DI provider)
- Extracted: `frontend/src/composables/use-async.ts` (replaces 2 stores' loading boilerplate)
- Refactored: `frontend/src/stores/transaction.store.ts` and `frontend/src/stores/category.store.ts` to use `useAsync`
- Added: `services/budget-service/src/value-objects/money.spec.ts` (12 unit tests for Money)
- Confirmed live (not dead): `services/worker-service/src/cli/seed.command.ts` is the seed entry point, referenced by `pnpm seed` in `services/worker-service/package.json`

## Next steps

[One short paragraph recommending what to do with the report. Default suggestion: skim Top 10, decide which to act on before the 2026-07-02 deadline, defer the rest to post-submission.]
```

- [ ] **Step 2: Verify file written**

Run: `test -f docs/audits/2026-06-27-slop-audit.md && wc -l docs/audits/2026-06-27-slop-audit.md`

Expected: file exists, line count is reasonable (typically 100-400 lines).

- [ ] **Step 3: Read back the first 30 lines to sanity-check structure**

Use `Read` with `offset: 1, limit: 30`. Confirm the Summary section is filled in (not placeholder), the categories are present, and Top 10 is non-empty.

---

### Task 7: Self-review the report

**Files:**
- Read-only: `docs/audits/2026-06-27-slop-audit.md`

- [ ] **Step 1: Placeholder scan**

Run: `grep -n "TBD\|TODO\|FIXME\|placeholder\|\[\.\.\.\]" docs/audits/2026-06-27-slop-audit.md`

Expected: no matches. If matches, replace the placeholder with the actual content.

- [ ] **Step 2: Citation completeness**

Run: `grep -c "^###" docs/audits/2026-06-27-slop-audit.md`

Expected: at least 9 section headers (matching the structure in Task 6).

- [ ] **Step 3: Top 10 count**

Run: `grep -cE "^[0-9]+\. " docs/audits/2026-06-27-slop-audit.md`

Expected: exactly 10. If more or fewer, fix the Top 10 section to be exactly 10 items.

- [ ] **Step 4: Citation check**

For each Top 10 item, confirm it has a `file:line` citation. If any item lacks one, either add the citation or replace the item.

---

### Task 8: Commit the report

**Files:**
- Stage: `docs/audits/2026-06-27-slop-audit.md`

- [ ] **Step 1: Stage the report**

Run: `git add docs/audits/2026-06-27-slop-audit.md`

- [ ] **Step 2: Commit with the agreed message**

Run: `git commit -m "docs(audit): fresh slop audit 2026-06-27

Two-agent audit (backend + frontend). Report-only; no code changes.
Top 10 actionable section ranked by impact x confidence.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"`

Expected: 1 file changed, 100-400 insertions, 0 deletions.

- [ ] **Step 3: Verify commit landed**

Run: `git log --oneline -3`

Expected: the audit commit appears as the most recent commit.

---

### Task 9: Report back to user

**Files:**
- None

- [ ] **Step 1: Send concise summary**

Tell the user:
- "Audit complete. Report at `docs/audits/2026-06-27-slop-audit.md`, committed."
- Top 3 most impactful findings (one line each)
- Total finding count and Top 10 size
- "No code was changed. Review the report and tell me which items (if any) you want to act on before the 2026-07-02 deadline."