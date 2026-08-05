# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package dependencies and install
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and build production bundle
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend Server
FROM node:20-alpine AS runner
WORKDIR /app/backend

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Copy backend package dependencies and install production modules
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source code
COPY backend/ ./

# Copy static built frontend files from Stage 1 into backend public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
