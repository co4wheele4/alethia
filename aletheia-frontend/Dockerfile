# Multi-stage build for Next.js frontend
FROM node:20-alpine as builder

WORKDIR /app

# Copy root files first
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY tools ./tools
COPY patches ./patches

# Copy both workspace packages
COPY aletheia-backend/package.json aletheia-backend/
COPY aletheia-frontend ./aletheia-frontend

# Install all dependencies (including dev)
RUN npm ci

# Build frontend
RUN npm run build --workspace=aletheia-frontend

# Production image
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package.json package-lock.json ./
COPY aletheia-frontend/package.json aletheia-frontend/

# Copy node_modules and .next from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/aletheia-frontend/node_modules ./aletheia-frontend/node_modules
COPY --from=builder /app/aletheia-frontend/.next ./aletheia-frontend/.next
COPY --from=builder /app/aletheia-frontend/public ./aletheia-frontend/public

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod", "--workspace=aletheia-frontend"]
