# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S duperheroes -u 1001

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=duperheroes:nodejs /app/dist ./dist
COPY --from=build --chown=duperheroes:nodejs /app/public ./public

# Create directories for uploads and database with proper permissions
RUN mkdir -p /app/uploads /app/data && \
    chown -R duperheroes:nodejs /app

# Switch to non-root user
USER duperheroes

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js

# Start the application
CMD ["node", "dist/server.js"]