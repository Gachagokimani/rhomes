FROM node:20-alpine AS deps
COPY . /app
# Install pnpm via corepack
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate
WORKDIR /app
# Copy lockfiles and package descriptors to leverage Docker cache
COPY package.json  pnpm-lock.yaml* ./ 

# Install dependencies (pnpm if available, otherwise npm)

# Copy the rest of the project
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
