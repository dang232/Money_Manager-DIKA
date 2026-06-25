---
type: Package
name: Infrastructure
description: Concrete adapters for messaging, cache, logging, and health checks shared by all services.
depends_on: [shared-kernel]
---
# Infrastructure

Implements the ports defined in shared-kernel with real infrastructure adapters. Services import the modules they need; none of this code lives inside a business service.

## Key Files

- `src/event-bus/kafka.adapter.ts` — KafkaAdapter implementing EventBusPort (local dev)
- `src/event-bus/redis-streams.adapter.ts` — RedisStreamsAdapter implementing EventBusPort (cloud)
- `src/event-bus/event-bus.factory.ts` — Selects adapter based on `EVENT_BUS_DRIVER` env var
- `src/cache/redis-cache.adapter.ts` — RedisCacheAdapter implementing CachePort
- `src/cache/cache.module.ts` — NestJS module wiring RedisCache
- `src/logging/winston-loki.config.ts` — Winston transport config pushing to Loki
- `src/logging/logger.module.ts` — NestJS LoggerModule for global use
- `src/health/health-indicators.ts` — Terminus health indicators for Kafka, Redis, Postgres

## Decisions

- `EventBusFactory` switches adapters at startup so service code is identical across environments; only the environment variable changes.
- Adapters are NestJS modules so they participate in the DI container and can be cleanly overridden in tests.
