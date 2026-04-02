FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Install dependencies
RUN bun install

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["bun", "src/index.ts"]
