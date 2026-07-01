# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY frontend/package.json ./frontend/
COPY frontend/pnpm-lock.yaml* ./frontend/
WORKDIR /app/frontend
RUN pnpm install --no-frozen-lockfile
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html ./
COPY frontend/*.json ./
COPY frontend/*.ts ./
COPY frontend/*.config.* ./
COPY frontend/components.json ./
RUN pnpm build

# ─── Production (nginx) ───────────────────────────────────────────────────────
FROM nginx:stable-alpine AS prod
COPY --from=build /app/frontend/dist /usr/share/nginx/html
RUN rm -f /etc/nginx/conf.d/*.conf && \
    echo 'server { listen 5173; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
