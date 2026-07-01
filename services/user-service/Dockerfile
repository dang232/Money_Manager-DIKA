# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG CACHEBUST=user-v2
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/user-service/package.json services/user-service/
COPY services/user-service/tsconfig.json services/user-service/
COPY services/user-service/nest-cli.json services/user-service/
RUN pnpm install --no-frozen-lockfile
COPY services/user-service/src services/user-service/src
WORKDIR /app/services/user-service
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/user-service/package.json services/user-service/
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /app/services/user-service/dist services/user-service/dist
WORKDIR /app/services/user-service
CMD ["node", "dist/main.js"]
