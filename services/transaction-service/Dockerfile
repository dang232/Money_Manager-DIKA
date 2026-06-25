# ─── Base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ─── Dev (used by docker-compose) ─────────────────────────────────────────────
FROM base AS dev
COPY . .
CMD ["pnpm", "start:dev"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY . .
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main"]
