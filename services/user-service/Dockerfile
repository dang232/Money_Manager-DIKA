FROM node:20-alpine
ARG FORCE_REBUILD=user-2024-final
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages packages
COPY services/user-service/package.json services/user-service/
COPY services/user-service/tsconfig.json services/user-service/
COPY services/user-service/nest-cli.json services/user-service/
RUN pnpm install --no-frozen-lockfile
COPY services/user-service/src services/user-service/src
WORKDIR /app/services/user-service
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
WORKDIR /app/services/user-service
CMD ["node", "dist/services/user-service/src/main.js"]
