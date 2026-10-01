# Build stage
FROM node:20 AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN pnpm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy dist from builder
COPY --from=builder /app/dist ./dist

# Port
EXPOSE 3000

# Start
CMD ["serve", "-s", "dist", "-l", "3000"]
