# ─── Dev (used by docker-compose) ─────────────────────────────────────────────
FROM node:20-alpine AS dev
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile
COPY . .
EXPOSE 5173
CMD ["npx", "vite", "--host"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

# ─── Production (nginx) ───────────────────────────────────────────────────────
FROM nginx:stable-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
