FROM node:20-alpine
ARG FORCE_REBUILD=transaction-2024-final
RUN npm install -g pnpm@9
WORKDIR /app
COPY ../pnpm-workspace.yaml ./
COPY ../tsconfig.base.json ./
COPY ../packages packages
COPY package.json services/transaction-service/
COPY tsconfig.json services/transaction-service/
COPY nest-cli.json services/transaction-service/
RUN pnpm install --no-frozen-lockfile
COPY src services/transaction-service/src
WORKDIR /app/services/transaction-service
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
CMD ["node", "dist/main.js"]
