# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
ARG CACHEBUST=ai-v2
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/ai-service/package.json services/ai-service/
COPY services/ai-service/tsconfig.json services/ai-service/
COPY services/ai-service/nest-cli.json services/ai-service/
RUN pnpm install --no-frozen-lockfile
COPY services/ai-service/src services/ai-service/src
WORKDIR /app/services/ai-service
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-kernel packages/shared-kernel
COPY packages/infrastructure packages/infrastructure
COPY services/ai-service/package.json services/ai-service/
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=build /app/services/ai-service/dist services/ai-service/dist
WORKDIR /app/services/ai-service
CMD ["node", "dist/main.js"]
