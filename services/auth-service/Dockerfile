# ─── Base ─────────────────────────────────────────────────────────────────────
# Build context: repo root (.) so pnpm workspace deps resolve.
# See docker-compose.yml.
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /workspace
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
WORKDIR /workspace/services/auth-service
COPY services/auth-service/package.json ./
COPY services/auth-service/tsconfig.json ./
COPY services/auth-service/nest-cli.json ./
RUN pnpm install --no-frozen-lockfile

# ─── Dev (used by docker-compose) ─────────────────────────────────────────────
FROM base AS dev
COPY services/auth-service/src ./src
CMD ["node", "-r", "ts-node/register", "src/main.ts"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY services/auth-service/src ./src
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /workspace
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
WORKDIR /workspace/services/auth-service
COPY services/auth-service/package.json ./
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /workspace/services/auth-service/dist ./dist
CMD ["node", "dist/main"]