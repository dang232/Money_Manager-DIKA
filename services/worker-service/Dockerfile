FROM node:20-alpine
ARG FORCE_REBUILD=worker-2024-final
RUN npm install -g pnpm@9
WORKDIR /app
COPY ../pnpm-workspace.yaml ./
COPY ../tsconfig.base.json ./
COPY ../packages packages
COPY package.json services/worker-service/
COPY tsconfig.json services/worker-service/
COPY nest-cli.json services/worker-service/
RUN pnpm install --no-frozen-lockfile
COPY src services/worker-service/src
WORKDIR /app/services/worker-service
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
CMD ["node", "dist/main.js"]
