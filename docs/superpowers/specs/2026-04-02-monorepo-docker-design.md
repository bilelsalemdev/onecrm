# Monorepo Restructure + Docker — Design Spec

## Purpose

Restructure the OneCRM project from a flat single-app layout into a Bun workspaces monorepo with separate apps for frontend and backend, a shared types package, and Docker support for both services.

## Architecture

```
onecrm/
  apps/
    web/                         ← React frontend
      src/
        components/              ← all existing components
        pages/                   ← all existing pages
        services/
          api.ts                 ← frontend API client (fetch calls)
        lib/
          utils.ts
        App.tsx
        main.tsx
        index.css
      public/
      index.html
      vite.config.ts
      tsconfig.json
      tsconfig.app.json
      tsconfig.node.json
      components.json
      package.json
      Dockerfile
    server/                      ← Bun backend
      src/
        index.ts                 ← HTTP server (was server.ts)
        storage.ts               ← read/write data/services.json
        proxy.ts                 ← external API proxy
      package.json
      Dockerfile
  packages/
    shared/                      ← shared types
      src/
        types.ts                 ← Service, Contact, AuthConfig, etc.
        index.ts                 ← barrel export
      package.json
      tsconfig.json
  docker-compose.yml
  package.json                   ← root workspace config
  .gitignore
```

## Root package.json

Bun workspaces configuration. No dependencies — just workspace definitions and convenience scripts.

```json
{
  "name": "onecrm",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently \"bun run dev:server\" \"bun run dev:web\"",
    "dev:web": "bun --filter @onecrm/web dev",
    "dev:server": "bun --filter @onecrm/server dev",
    "build": "bun --filter @onecrm/web build",
    "start": "bun --filter @onecrm/server start"
  }
}
```

## packages/shared

Shared TypeScript types used by both apps. Published as `@onecrm/shared` within the workspace.

### package.json

```json
{
  "name": "@onecrm/shared",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

### Types

All shared types move here:
- `AuthType`, `AuthConfig` — auth configuration discriminated union
- `ServicePublic` — credential-stripped service (returned to frontend)
- `ServiceConfig` — full service config with credentials (server-only, but type is shared)
- `ServiceFormData` — form submission shape
- `Contact`, `ContactStatus` — contact data
- `stripCredentials()` — utility function

Both `apps/web` and `apps/server` import from `@onecrm/shared`.

## apps/web

The React frontend. Same code as current `src/`, just moved.

### package.json

```json
{
  "name": "@onecrm/web",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@onecrm/shared": "workspace:*",
    ...existing frontend deps
  }
}
```

### Changes from current code

- `src/services/types.ts` — deleted, imports come from `@onecrm/shared`
- `src/services/api.ts` — imports types from `@onecrm/shared`
- All components — import types from `@onecrm/shared` instead of `@/services/types`
- `vite.config.ts` — keeps `/api` proxy to `http://localhost:3001`

### Dockerfile

Multi-stage build:
1. Stage 1 (build): Install deps, build with Vite
2. Stage 2 (serve): Nginx serving `dist/` with proxy pass for `/api` to server container

## apps/server

The Bun HTTP server.

### package.json

```json
{
  "name": "@onecrm/server",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts"
  },
  "dependencies": {
    "@onecrm/shared": "workspace:*"
  }
}
```

### Changes from current code

- `server.ts` → `apps/server/src/index.ts`
- `server/storage.ts` → `apps/server/src/storage.ts`
- `server/proxy.ts` → `apps/server/src/proxy.ts`
- `server/types.ts` — deleted, shared types come from `@onecrm/shared`
- Server-only types (if any) stay in the server app
- `data/` directory is at `apps/server/data/` (gitignored)

### Dockerfile

Multi-stage build:
1. Stage 1: Install deps
2. Stage 2: Copy source + run with Bun

Exposes port 3001. Mounts `data/` as a volume for persistence.

## docker-compose.yml

```yaml
services:
  server:
    build: ./apps/server
    ports:
      - "3001:3001"
    volumes:
      - server-data:/app/data

  web:
    build: ./apps/web
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  server-data:
```

The nginx config in the web container proxies `/api/*` requests to `http://server:3001`.

## Migration Strategy

1. Create new directory structure
2. Move files to their new locations
3. Create workspace package.json files
4. Update all import paths (types now from `@onecrm/shared`)
5. Create Dockerfiles
6. Create docker-compose.yml
7. Delete old top-level files (server.ts, server/, src/)
8. Verify `bun install` at root resolves workspaces
9. Verify `bun run dev` works
10. Verify `docker compose up --build` works
