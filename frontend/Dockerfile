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
RUN mkdir -p /etc/nginx/templates && rm -f /etc/nginx/conf.d/*.conf && \
    echo 'server { listen ${PORT}; root /usr/share/nginx/html; index index.html; location /api { proxy_pass http://${GATEWAY_PRIVATE_DOMAIN}:${GATEWAY_PORT}; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; } location /socket.io { proxy_pass http://${GATEWAY_PRIVATE_DOMAIN}:${GATEWAY_PORT}; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host $host; } location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/templates/default.conf.template
