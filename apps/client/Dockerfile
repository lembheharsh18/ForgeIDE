FROM node:20-alpine AS base

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/client ./apps/client

WORKDIR /app/apps/client

EXPOSE 3000

CMD ["npm", "run", "dev"]
