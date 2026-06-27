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
WORKDIR /workspace/services/gateway
COPY services/gateway/package.json ./
COPY services/gateway/tsconfig.json ./
COPY services/gateway/nest-cli.json ./
RUN pnpm install --no-frozen-lockfile

# ─── Dev (used by docker-compose) ─────────────────────────────────────────────
FROM base AS dev
COPY services/gateway/src ./src
CMD ["node", "-r", "ts-node/register", "src/main.ts"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY services/gateway/src ./src
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /workspace
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
WORKDIR /workspace/services/gateway
COPY services/gateway/package.json ./
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /workspace/services/gateway/dist ./dist
CMD ["node", "dist/main"]
