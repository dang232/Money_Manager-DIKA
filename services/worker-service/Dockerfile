FROM node:20-alpine
ARG FORCE_REBUILD=worker-2024-final
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages packages
COPY services/worker-service/package.json services/worker-service/
COPY services/worker-service/tsconfig.json services/worker-service/
COPY services/worker-service/nest-cli.json services/worker-service/
RUN pnpm install --no-frozen-lockfile
COPY services/worker-service/src services/worker-service/src
WORKDIR /app/services/worker-service
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
WORKDIR /app/services/worker-service
CMD ["node", "dist/main.js"]
