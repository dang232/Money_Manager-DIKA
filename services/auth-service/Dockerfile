FROM node:20-alpine
ARG FORCE_REBUILD=auth-2024-final
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages packages
COPY services/auth-service/package.json services/auth-service/
COPY services/auth-service/tsconfig.json services/auth-service/
COPY services/auth-service/nest-cli.json services/auth-service/
RUN pnpm install --no-frozen-lockfile
COPY services/auth-service/src services/auth-service/src
WORKDIR /app/services/auth-service
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
WORKDIR /app/services/auth-service
CMD ["node", "dist/main.js"]
