# Multi-stage Dockerfile for Samir's Sprint Planning
# Stage 1: Build the React client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm install --only=production

# Copy client source code
COPY client/ ./

# Install all dependencies for build (including dev dependencies)
RUN npm install

# Build the React app for production
RUN npm run build

# Stage 2: Setup the server and serve the built client
FROM node:18-alpine AS production

WORKDIR /app

# Copy server package files
COPY package*.json ./

# Install server dependencies
RUN npm install --only=production

# Copy server source code
COPY server/ ./server/

# Copy the built React app from the previous stage
COPY --from=client-builder /app/client/build ./client/build

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S samirapp -u 1001

# Change ownership of the app directory to the non-root user
RUN chown -R samirapp:nodejs /app
USER samirapp

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/sessions/health', (res) => { process.exit(res.statusCode === 404 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "server/index.js"] 