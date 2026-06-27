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
WORKDIR /workspace/services/worker-service
COPY services/worker-service/package.json ./
COPY services/worker-service/tsconfig.json ./
COPY services/worker-service/nest-cli.json ./
RUN pnpm install --no-frozen-lockfile

# ─── Dev (used by docker-compose) ─────────────────────────────────────────────
FROM base AS dev
COPY services/worker-service/src ./src
CMD ["node", "-r", "ts-node/register", "src/main.ts"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY services/worker-service/src ./src
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /workspace
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
WORKDIR /workspace/services/worker-service
COPY services/worker-service/package.json ./
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /workspace/services/worker-service/dist ./dist
CMD ["node", "dist/main"]
