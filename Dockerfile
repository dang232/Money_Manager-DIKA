FROM node:20-alpine
WORKDIR /app
COPY pnpm-lock.yaml* ./
COPY frontend/package.json ./
RUN npm install -g pnpm@9 && pnpm install
COPY frontend/ ./
RUN pnpm build
