ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG NEXT_PUBLIC_APP_URL

# Build stage for initial build 
FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG NEXT_PUBLIC_APP_URL
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies 
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

# Copy source files, run the build step, and remove dev-only deps
COPY . .
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT}
ENV NEXT_PUBLIC_APPWRITE_PROJECT=${NEXT_PUBLIC_APPWRITE_PROJECT}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm run build && npm prune --production


# Runtime stage for running app
FROM node:20-alpine AS runtime
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG NEXT_PUBLIC_APP_URL
WORKDIR /app
ENV NODE_ENV=production

# Expose the same NEXT_PUBLIC_* to the runtime (ARG -> ENV)
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT}
ENV NEXT_PUBLIC_APPWRITE_PROJECT=${NEXT_PUBLIC_APPWRITE_PROJECT}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# copy runtime artifacts from builder (NOT from host file system, make sure .dockerignore exists)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm","run","start"]
