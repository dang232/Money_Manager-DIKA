# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG CACHEBUST=worker-v4
RUN echo "Cache bust v4 at $(date)" && npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/worker-service/package.json services/worker-service/
COPY services/worker-service/tsconfig.json services/worker-service/
COPY services/worker-service/nest-cli.json services/worker-service/
RUN pnpm install --no-frozen-lockfile
COPY services/worker-service/src services/worker-service/src
WORKDIR /app/services/worker-service
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/worker-service/package.json services/worker-service/
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /app/services/worker-service/dist services/worker-service/dist
WORKDIR /app/services/worker-service
CMD ["node", "dist/main.js"]
