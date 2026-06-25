---
type: Service
name: AI Service
description: Suggests transaction categories using Groq LLM, with a mock provider for local/offline use.
depends_on: [shared-kernel, infrastructure, kafka]
---
# AI Service

Accepts a transaction description and returns a suggested category. Uses Groq's API in production and a deterministic mock in development/test. Also consumes events and can emit `ai.suggestion` events for async flows. Runs on port 3003.

## Key Files

- `src/application/commands/` — SuggestCategory command
- `src/application/handlers/` — SuggestCategoryHandler orchestrating provider selection
- `src/application/consumers/` — Kafka consumer for async suggestion requests
- `src/infrastructure/providers/` — GroqProvider and MockProvider implementing the same interface
- `src/presentation/` — REST controller for synchronous suggestion requests

## Decisions

- Provider is selected via `AI_PROVIDER` env var (`groq` | `mock`) so the service runs without an API key in local dev.
- Mock provider uses keyword matching on the description so tests are deterministic and fast.
