# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the application
# We use build-time env vars for the backend URL
ARG BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL

RUN npm run build

# Stage 2: Runtime
FROM node:22-slim AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
