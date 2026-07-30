# Multi-stage build for NestJS backend
FROM node:20-alpine as builder

WORKDIR /app

# Copy root files first
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY tools ./tools
COPY patches ./patches

# Copy both workspace packages
COPY aletheia-backend ./aletheia-backend
COPY aletheia-frontend/package.json aletheia-frontend/

# Install all dependencies (including dev)
RUN npm ci

# Build backend
RUN npm run build --workspace=aletheia-backend

# Production image
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package.json package-lock.json ./
COPY aletheia-backend/package.json aletheia-backend/

# Copy node_modules (with production + key dev deps) and dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/aletheia-backend/node_modules ./aletheia-backend/node_modules
COPY --from=builder /app/aletheia-backend/dist ./aletheia-backend/dist

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod", "--workspace=aletheia-backend"]
