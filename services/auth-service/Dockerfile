# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG CACHEBUST=auth-v2
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/auth-service/package.json services/auth-service/
COPY services/auth-service/tsconfig.json services/auth-service/
COPY services/auth-service/nest-cli.json services/auth-service/
RUN pnpm install --no-frozen-lockfile
COPY services/auth-service/src services/auth-service/src
WORKDIR /app/services/auth-service
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/auth-service/package.json services/auth-service/
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /app/services/auth-service/dist services/auth-service/dist
WORKDIR /app/services/auth-service
CMD ["node", "dist/main.js"]
