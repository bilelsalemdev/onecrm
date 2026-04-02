# Monorepo Restructure + Docker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure OneCRM from a flat single-app layout into a Bun workspaces monorepo with `apps/web`, `apps/server`, `packages/shared`, and Docker support.

**Architecture:** Bun workspaces at the root link three packages: `@onecrm/shared` (types + utilities), `@onecrm/web` (Vite React frontend), `@onecrm/server` (Bun HTTP backend). Each app has its own Dockerfile. A docker-compose.yml orchestrates both with nginx serving the frontend and proxying `/api` to the server.

**Tech Stack:** Bun workspaces, Docker, nginx, existing Vite + React + Shadcn/ui + Bun.serve()

---

## File Structure (final state)

```
onecrm/
  apps/
    web/
      src/                       ← moved from root src/
      public/                    ← moved from root public/
      index.html                 ← moved from root
      vite.config.ts             ← moved + updated
      tsconfig.json              ← moved
      tsconfig.app.json          ← moved + updated
      tsconfig.node.json         ← moved
      eslint.config.js           ← moved
      components.json            ← moved + updated
      package.json               ← new
      Dockerfile                 ← new
      nginx.conf                 ← new
    server/
      src/
        index.ts                 ← was server.ts
        storage.ts               ← was server/storage.ts
        proxy.ts                 ← was server/proxy.ts
      package.json               ← new
      Dockerfile                 ← new
  packages/
    shared/
      src/
        types.ts                 ← merged from both type files
        index.ts                 ← barrel export
      package.json               ← new
      tsconfig.json              ← new
  docker-compose.yml             ← new
  package.json                   ← rewritten (workspace root)
  .gitignore                     ← updated
```

---

### Task 1: Create Workspace Root + Shared Package

**Files:**
- Create: `packages/shared/src/types.ts`, `packages/shared/src/index.ts`, `packages/shared/package.json`, `packages/shared/tsconfig.json`
- Modify: root `package.json`

- [ ] **Step 1: Create `packages/shared/package.json`**

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

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/shared/src/types.ts`**

This merges types from both `src/services/types.ts` (frontend) and `server/types.ts` (backend):

```typescript
// Auth
export type AuthType = 'none' | 'api-key' | 'basic' | 'bearer'

export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

// Service — full config (server-side, contains credentials)
export interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}

// Service — public view (returned to frontend, credentials stripped)
export interface Service {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  authType: AuthType
}

// Service — form data (sent from frontend to create/update)
export interface ServiceFormData {
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}

// Contact
export type ContactStatus = 'new' | 'contacted' | 'converted' | 'archived'

export interface Contact {
  id: string
  serviceId: string
  name: string
  email: string
  phone: string
  message: string
  date: string
  status: ContactStatus
}

// Utilities
export function stripCredentials(config: ServiceConfig): Service {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    endpoint: config.endpoint,
    authType: config.auth.type,
  }
}
```

- [ ] **Step 4: Create `packages/shared/src/index.ts`**

```typescript
export {
  type AuthType,
  type AuthConfig,
  type ServiceConfig,
  type Service,
  type ServiceFormData,
  type ContactStatus,
  type Contact,
  stripCredentials,
} from './types'
```

- [ ] **Step 5: Rewrite root `package.json`**

Replace the entire root `package.json` with:

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
  },
  "devDependencies": {
    "concurrently": "^9.2.1"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/ package.json
git commit -m "feat: create workspace root and shared types package"
```

---

### Task 2: Move Frontend to apps/web

This task moves all frontend files to `apps/web/` and creates its package.json. No import changes yet — just the file move.

**Files:**
- Create: `apps/web/package.json`
- Move: `src/` → `apps/web/src/`, `public/` → `apps/web/public/`, `index.html` → `apps/web/index.html`, `vite.config.ts` → `apps/web/vite.config.ts`, `tsconfig.json` → `apps/web/tsconfig.json`, `tsconfig.app.json` → `apps/web/tsconfig.app.json`, `tsconfig.node.json` → `apps/web/tsconfig.node.json`, `components.json` → `apps/web/components.json`, `eslint.config.js` → `apps/web/eslint.config.js`

- [ ] **Step 1: Create apps/web directory and move files**

```bash
mkdir -p apps/web
mv src apps/web/
mv public apps/web/
mv index.html apps/web/
mv vite.config.ts apps/web/
mv tsconfig.json apps/web/
mv tsconfig.app.json apps/web/
mv tsconfig.node.json apps/web/
mv components.json apps/web/
mv eslint.config.js apps/web/
```

- [ ] **Step 2: Create `apps/web/package.json`**

```json
{
  "name": "@onecrm/web",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@onecrm/shared": "workspace:*",
    "@base-ui/react": "^1.3.0",
    "@fontsource-variable/geist": "^5.2.8",
    "@tailwindcss/vite": "^4.2.2",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.7.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "^7.13.2",
    "shadcn": "^4.1.2",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.2",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/node": "^24.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.57.0",
    "vite": "^8.0.1"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: move frontend to apps/web"
```

---

### Task 3: Move Backend to apps/server

**Files:**
- Create: `apps/server/package.json`
- Move: `server.ts` → `apps/server/src/index.ts`, `server/storage.ts` → `apps/server/src/storage.ts`, `server/proxy.ts` → `apps/server/src/proxy.ts`
- Delete: `server/types.ts` (types now in shared), `server/` directory

- [ ] **Step 1: Create apps/server directory and move files**

```bash
mkdir -p apps/server/src
mv server.ts apps/server/src/index.ts
mv server/storage.ts apps/server/src/storage.ts
mv server/proxy.ts apps/server/src/proxy.ts
rm server/types.ts
rmdir server
```

- [ ] **Step 2: Create `apps/server/package.json`**

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

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: move backend to apps/server"
```

---

### Task 4: Update Server Imports

**Files:**
- Modify: `apps/server/src/index.ts`, `apps/server/src/storage.ts`, `apps/server/src/proxy.ts`

- [ ] **Step 1: Update `apps/server/src/index.ts`**

Replace the import section at the top:

Old:
```typescript
import { readServices, writeServices } from './server/storage'
import { stripCredentials } from './server/types'
import type { ServiceConfig, AuthConfig } from './server/types'
import { proxyContacts } from './server/proxy'
```

New:
```typescript
import { readServices, writeServices } from './storage'
import { stripCredentials } from '@onecrm/shared'
import type { ServiceConfig, AuthConfig } from '@onecrm/shared'
import { proxyContacts } from './proxy'
```

The rest of the file stays identical.

- [ ] **Step 2: Update `apps/server/src/storage.ts`**

Replace the import:

Old:
```typescript
import type { ServiceConfig } from './types'
```

New:
```typescript
import type { ServiceConfig } from '@onecrm/shared'
```

The rest stays identical.

- [ ] **Step 3: Update `apps/server/src/proxy.ts`**

Replace the import:

Old:
```typescript
import type { ServiceConfig } from './types'
```

New:
```typescript
import type { ServiceConfig } from '@onecrm/shared'
```

The rest stays identical.

- [ ] **Step 4: Commit**

```bash
git add apps/server/
git commit -m "feat: update server imports to use @onecrm/shared"
```

---

### Task 5: Update Frontend Imports

**Files:**
- Delete: `apps/web/src/services/types.ts`
- Modify: `apps/web/src/services/api.ts` and every component that imports from `@/services/types`

All files that currently import from `@/services/types` must be changed to import from `@onecrm/shared`.

- [ ] **Step 1: Delete the old frontend types file**

```bash
rm apps/web/src/services/types.ts
```

- [ ] **Step 2: Update `apps/web/src/services/api.ts`**

Change the import:

Old:
```typescript
import type { Service, Contact, ServiceFormData } from './types'
```

New:
```typescript
import type { Service, Contact, ServiceFormData } from '@onecrm/shared'
```

- [ ] **Step 3: Update all component imports**

Every file that has `import type { ... } from '@/services/types'` must be changed to `import type { ... } from '@onecrm/shared'`.

Files to update (change only the import line, nothing else):

**`apps/web/src/components/services/ServiceFormDialog.tsx`:**
Old: `import type { Service, ServiceFormData, AuthConfig, AuthType } from '@/services/types'`
New: `import type { Service, ServiceFormData, AuthConfig, AuthType } from '@onecrm/shared'`

**`apps/web/src/components/services/ServiceCard.tsx`:**
Old: `import type { Service } from '@/services/types'`
New: `import type { Service } from '@onecrm/shared'`

**`apps/web/src/components/services/ContactsTable.tsx`:**
Old: `import type { Contact } from '@/services/types'`
New: `import type { Contact } from '@onecrm/shared'`

**`apps/web/src/components/dashboard/ServiceSummaryCard.tsx`:**
Old: `import type { Service } from '@/services/types'`
New: `import type { Service } from '@onecrm/shared'`

**`apps/web/src/components/dashboard/RecentContacts.tsx`:**
Old: `import type { Contact } from '@/services/types'`
New: `import type { Contact } from '@onecrm/shared'`

**`apps/web/src/pages/Dashboard.tsx`:**
Old: `import type { Service, Contact } from '@/services/types'`
New: `import type { Service, Contact } from '@onecrm/shared'`

**`apps/web/src/pages/Services.tsx`:**
Old: `import type { Service, ServiceFormData } from '@/services/types'`
New: `import type { Service, ServiceFormData } from '@onecrm/shared'`

**`apps/web/src/pages/ServiceDetail.tsx`:**
Old: `import type { Service, Contact } from '@/services/types'`
New: `import type { Service, Contact } from '@onecrm/shared'`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: update frontend imports to use @onecrm/shared"
```

---

### Task 6: Install Workspace Dependencies + Verify Build

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Update .gitignore**

Ensure `.gitignore` has these entries (add if missing):

```
node_modules
dist
data/
```

- [ ] **Step 2: Remove old node_modules and reinstall at workspace root**

```bash
rm -rf node_modules bun.lock
bun install
```

This should resolve all workspace links (`@onecrm/shared` → `packages/shared`, etc.)

- [ ] **Step 3: Verify build**

```bash
cd apps/web && bun run build && cd ../..
```

Expected: TypeScript compiles with 0 errors, Vite builds successfully.

- [ ] **Step 4: Verify server starts**

```bash
cd apps/server && bun run dev &
sleep 2
curl http://localhost:3001/api/services
kill %1
cd ../..
```

Expected: returns `[]`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up bun workspaces and verify builds"
```

---

### Task 7: Docker — Server Dockerfile

**Files:**
- Create: `apps/server/Dockerfile`

- [ ] **Step 1: Create `apps/server/Dockerfile`**

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["bun", "src/index.ts"]
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/Dockerfile
git commit -m "feat: add server Dockerfile"
```

---

### Task 8: Docker — Web Dockerfile + nginx

**Files:**
- Create: `apps/web/Dockerfile`, `apps/web/nginx.conf`

- [ ] **Step 1: Create `apps/web/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://server:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Create `apps/web/Dockerfile`**

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/Dockerfile apps/web/nginx.conf
git commit -m "feat: add web Dockerfile with nginx"
```

---

### Task 9: Docker Compose + Cleanup

**Files:**
- Create: `docker-compose.yml`
- Delete: old root-level files that are no longer needed

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - server-data:/app/apps/server/data
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  server-data:
```

- [ ] **Step 2: Clean up old root-level files that were moved**

Delete files that no longer belong at the root:

```bash
rm -f README.md
```

(All other files like `src/`, `server/`, `server.ts`, `index.html`, `vite.config.ts`, `tsconfig.*`, `components.json`, `eslint.config.js`, `public/` should already be moved/deleted from Tasks 2-3. Verify nothing stale remains.)

```bash
ls -la
```

Root should only contain: `apps/`, `packages/`, `docs/`, `package.json`, `bun.lock`, `node_modules/`, `.git/`, `.gitignore`, `.claude/`, `docker-compose.yml`

- [ ] **Step 3: Verify `bun run dev` works**

```bash
bun run dev
```

Expected: both server (port 3001) and web (port 5173) start. Frontend proxies `/api` to server.

- [ ] **Step 4: Verify Docker build**

```bash
docker compose build
```

Expected: both images build successfully.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add docker-compose and clean up root"
```
