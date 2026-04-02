# Dynamic Service Configuration — Design Spec

## Purpose

Replace the hardcoded mock service list with a dynamic system where users can add, edit, and delete services through the UI. Each service stores its external API endpoint and authentication credentials. A Bun backend proxies all external API calls so credentials never reach the browser.

## Architecture

```
Browser (Vite React SPA)
  ↕ REST API (/api/services, /api/services/:id/contacts)
Bun HTTP Server (server.ts)
  ↕ reads/writes
data/services.json (service configs + credentials on disk)
  ↕ proxies with auth
External Service APIs (md3w, aalii, invfunds, etc.)
```

## Backend: Bun HTTP Server

Single file `server.ts` at project root using `Bun.serve()`.

### Responsibilities

1. Serve the Vite-built frontend (`dist/` in production, proxy to Vite dev server in development)
2. CRUD API for service configurations
3. Proxy contact-fetching requests to external services, injecting the correct auth

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/services` | List all services (credentials stripped) |
| GET | `/api/services/:id` | Get one service (credentials stripped) |
| POST | `/api/services` | Create a new service |
| PUT | `/api/services/:id` | Update a service |
| DELETE | `/api/services/:id` | Delete a service |
| GET | `/api/services/:id/contacts` | Proxy: fetch contacts from external service |

### Credential Stripping

GET endpoints that return service data to the frontend strip sensitive auth fields. The frontend only sees: `id`, `name`, `description`, `icon`, `endpoint` (URL), `auth.type` (the type name, not the secrets). This prevents credentials from leaking to the browser.

### Storage

`data/services.json` — a JSON file on disk. Structure:

```json
{
  "services": [
    {
      "id": "md3w",
      "name": "MD3W",
      "description": "Web development platform",
      "icon": "Globe",
      "endpoint": "https://md3w.com/api/contacts",
      "auth": {
        "type": "api-key",
        "apiKey": "sk-...",
        "headerName": "X-API-Key"
      }
    }
  ]
}
```

The server reads/writes this file on each request (no caching needed for an internal tool with low traffic). The file is created with an empty `{"services": []}` if it doesn't exist on startup.

`data/` is added to `.gitignore` to avoid committing credentials.

## Data Models

### ServiceConfig (full, server-side only)

```typescript
interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}

type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }
```

### Service (public, returned to frontend)

```typescript
interface Service {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  authType: 'none' | 'api-key' | 'basic' | 'bearer'
}
```

### ServiceFormData (sent from frontend to create/update)

```typescript
interface ServiceFormData {
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}
```

### Contact (unchanged from current spec)

```typescript
interface Contact {
  id: string
  serviceId: string
  name: string
  email: string
  phone: string
  message: string
  date: string
  status: 'new' | 'contacted' | 'converted' | 'archived'
}
```

## Contact Proxy Logic

When the frontend requests `GET /api/services/:id/contacts`, the backend:

1. Reads the service config from `data/services.json`
2. Builds a `fetch()` request to `service.endpoint`
3. Applies auth based on `service.auth.type`:
   - `none`: no auth headers
   - `api-key`: sets header `[headerName]: [apiKey]`
   - `basic`: sets `Authorization: Basic base64(username:password)`
   - `bearer`: sets `Authorization: Bearer [token]`
4. Calls the external API
5. Returns the response JSON to the frontend
6. If the external call fails, returns a structured error with status code and message

The backend does not transform the external response. It assumes each external service returns a JSON array of contacts matching the `Contact` interface. If a service returns a different shape, a response mapping layer can be added later per-service.

## Frontend Changes

### Updated API Layer

`src/services/api.ts` switches from mock data to `fetch('/api/...')` calls:
- `getServices()` → `GET /api/services`
- `getService(id)` → `GET /api/services/:id`
- `getContacts(serviceId)` → `GET /api/services/:id/contacts`
- `getAllContacts()` → fetches contacts from all services in parallel
- New: `createService(data)` → `POST /api/services`
- New: `updateService(id, data)` → `PUT /api/services/:id`
- New: `deleteService(id)` → `DELETE /api/services/:id`

### Add Service Dialog

A dialog/modal triggered by an "Add Service" button on the Services page containing:
- **Name** — text input
- **Description** — text input
- **Icon** — dropdown/select with available icon names (Globe, Sparkles, TrendingUp, Award, Building, and more)
- **Endpoint URL** — text input
- **Auth Type** — select dropdown: None, API Key, Basic Auth, Bearer Token
- **Dynamic auth fields** — shown/hidden based on auth type:
  - API Key: `API Key` (password input) + `Header Name` (text, default "X-API-Key")
  - Basic: `Username` (text) + `Password` (password input)
  - Bearer: `Token` (password input)
  - None: no extra fields

### Edit/Delete on Service Cards

- Each service card gets an "Edit" button (opens same dialog, pre-filled) and a "Delete" button (with confirmation)
- Edit form shows auth type but not the actual secret values (placeholders like "••••••" to indicate a value exists). If the user doesn't change a secret field, the backend keeps the existing value.

### Services Page Update

- "Add Service" button added to the top of the services page
- Service cards show edit/delete actions

### Mock Data Removal

`src/services/mock-data.ts` is deleted. The data layer is fully backed by the backend. For first-run experience, `data/services.json` starts empty — the user adds services through the UI.

## File Structure (new/modified files)

```
server.ts                          — Bun HTTP server (new)
data/services.json                 — service configs on disk (created at runtime)
src/services/types.ts              — updated with new types
src/services/api.ts                — rewritten to use fetch()
src/services/mock-data.ts          — deleted
src/components/services/
  ServiceFormDialog.tsx             — add/edit service dialog (new)
  ServiceCard.tsx                   — updated with edit/delete buttons
src/pages/Services.tsx             — updated with "Add Service" button
src/pages/Dashboard.tsx            — updated (getAllContacts now calls backend)
.gitignore                         — add data/ directory
package.json                       — add dev/start scripts for backend
```

## Dev Setup

- `bun run dev` — starts Vite dev server (frontend) + Bun backend concurrently
- `bun run build` — builds frontend, then backend serves `dist/`
- `bun run start` — runs backend in production mode serving built frontend

The backend in dev mode proxies unknown requests to Vite's dev server, or alternatively, Vite proxies `/api` to the backend. We use Vite's `proxy` config to forward `/api/*` to the Bun server running on a different port.
