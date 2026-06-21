# ── Stage 1: Builder ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all package.json and package-lock.json files
COPY package.json package-lock.json* ./
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the client application
RUN npm run build -w apps/client

# ── Stage 2: Production ──────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/client/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/client/public ./public
COPY --from=builder /app/apps/client/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
