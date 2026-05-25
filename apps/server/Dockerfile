FROM node:20-alpine AS base

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

WORKDIR /app/apps/server

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]
