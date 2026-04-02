FROM oven/bun:1 AS build
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install dependencies
RUN bun install

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
