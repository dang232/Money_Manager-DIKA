# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG CACHEBUST=transaction-v2
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/transaction-service/package.json services/transaction-service/
COPY services/transaction-service/tsconfig.json services/transaction-service/
COPY services/transaction-service/nest-cli.json services/transaction-service/
RUN pnpm install --no-frozen-lockfile
COPY services/transaction-service/src services/transaction-service/src
WORKDIR /app/services/transaction-service
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/transaction-service/package.json services/transaction-service/
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /app/services/transaction-service/dist services/transaction-service/dist
WORKDIR /app/services/transaction-service
CMD ["node", "dist/main.js"]
