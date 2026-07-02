FROM node:20-alpine
ARG FORCE_REBUILD=ai-2024-final
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages packages
COPY services/ai-service/package.json services/ai-service/
COPY services/ai-service/tsconfig.json services/ai-service/
COPY services/ai-service/nest-cli.json services/ai-service/
RUN pnpm install --no-frozen-lockfile
COPY services/ai-service/src services/ai-service/src
WORKDIR /app/services/ai-service
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
WORKDIR /app/services/ai-service
CMD ["node", "dist/services/ai-service/src/main.js"]
