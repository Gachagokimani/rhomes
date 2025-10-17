FROM node:18-alpine AS  deps
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml* ./
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate
# Install nodemon globally for development convenience
COPY  . ./ ./
# Install dependencies using pnpm
RUN pnpm install 
RUN pnpm approve-builds

EXPOSE 3000

# Use node directly to run server.js
CMD ["pnpm", "dev"]