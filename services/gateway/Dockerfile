FROM node:20-alpine
ARG FORCE_REBUILD=gateway-2024-nodepath
RUN npm install -g pnpm@9
WORKDIR /app
COPY ../pnpm-workspace.yaml ./
COPY ../tsconfig.base.json ./
COPY ../packages packages
COPY package.json services/gateway/
COPY tsconfig.json services/gateway/
COPY nest-cli.json services/gateway/
RUN pnpm install --no-frozen-lockfile
COPY src services/gateway/src
WORKDIR /app/services/gateway
RUN pnpm build
ENV NODE_PATH=/app/node_modules:/app/packages/infrastructure/node_modules:/app/packages/shared-kernel/node_modules
CMD ["node", "dist/main.js"]
