# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG FORCE_REBUILD=budget-2024-v2
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/budget-service/package.json services/budget-service/
COPY services/budget-service/tsconfig.json services/budget-service/
COPY services/budget-service/nest-cli.json services/budget-service/
RUN pnpm install --no-frozen-lockfile
COPY services/budget-service/src services/budget-service/src
WORKDIR /app/services/budget-service
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
ARG FORCE_REBUILD=budget-2024-v2
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/budget-service/dist services/budget-service/dist
WORKDIR /app/services/budget-service
CMD ["node", "dist/main.js"]
