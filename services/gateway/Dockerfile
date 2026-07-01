# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG CACHEBUST=gateway-v2
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/gateway/package.json services/gateway/
COPY services/gateway/tsconfig.json services/gateway/
COPY services/gateway/nest-cli.json services/gateway/
RUN pnpm install --no-frozen-lockfile
COPY services/gateway/src services/gateway/src
WORKDIR /app/services/gateway
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/gateway/package.json services/gateway/
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /app/services/gateway/dist services/gateway/dist
WORKDIR /app/services/gateway
CMD ["node", "dist/main.js"]
