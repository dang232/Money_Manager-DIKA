---
type: Service
name: Auth Service
description: Owns user accounts, issues and rotates access/refresh tokens, authenticates API requests.
depends_on: [shared-kernel, infrastructure, postgres-auth]
---
# Auth Service

Owns the user identity. Handles registration, login, refresh-token rotation, and
logout. Issues short-lived JWT access tokens and long-lived opaque refresh
tokens; refresh tokens are persisted (hashed) so logout can revoke them.
Runs on port 3004.

## Key Files

- `src/domain/aggregates/` — User, RefreshToken aggregates
- `src/domain/value-objects/` — Email, PasswordHash
- `src/domain/repositories/` — UserRepository, RefreshTokenRepository ports
- `src/application/handlers/` — Register, Login, RefreshToken, Logout, GetMe
- `src/infrastructure/jwt/` — JwtService (sign / verify access tokens)
- `src/infrastructure/password/` — BcryptPasswordHasher (hash / verify)
- `src/infrastructure/persistence/` — MikroORM entities, mappers, repository impls
- `src/presentation/controllers/` — AuthController, HealthController

## Decisions

- Refresh tokens are random opaque strings; only their sha-256 hash is stored,
  so a DB leak can't be replayed to mint access tokens.
- Access tokens carry `sub` (UserId) and `email`; downstream services trust the
  `x-user-id` header that the gateway forwards after validating the bearer.
- Single-user v1 keeps password hashing cost low (bcrypt cost 10). Raise when
  CPU budget allows.