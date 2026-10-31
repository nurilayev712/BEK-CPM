# Base image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy root and dependencies
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source codes
COPY frontend ./frontend
COPY backend ./backend

# Build frontend production bundle
RUN cd frontend && npm run build

# Expose port
EXPOSE 5000

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Start application
CMD ["node", "--use-system-ca", "backend/src/server.js"]
