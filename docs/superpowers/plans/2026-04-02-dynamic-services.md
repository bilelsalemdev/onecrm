# Dynamic Service Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded mock services with a Bun backend that stores service configs on disk, proxies external API calls with auth, and exposes CRUD endpoints — plus a frontend dialog for adding/editing/deleting services dynamically.

**Architecture:** Bun HTTP server (`server.ts`) handles REST API for service CRUD and proxies contact-fetching to external services with injected auth credentials. Service configs stored in `data/services.json`. Frontend `api.ts` switches from mock imports to `fetch('/api/...')`. A dialog component handles add/edit forms with dynamic auth fields.

**Tech Stack:** Bun.serve(), existing Vite + React + Shadcn/ui frontend, Shadcn dialog/select/label components

---

## File Structure

```
server.ts                                    — Bun HTTP server (new)
server/storage.ts                            — read/write data/services.json (new)
server/proxy.ts                              — external API proxy with auth injection (new)
server/types.ts                              — server-side types (new)
data/services.json                           — created at runtime, gitignored
src/services/types.ts                        — updated: new Service shape + form types
src/services/api.ts                          — rewritten: fetch() instead of mock
src/services/mock-data.ts                    — deleted
src/components/services/ServiceFormDialog.tsx — add/edit service dialog (new)
src/components/services/ServiceCard.tsx       — updated: edit/delete buttons
src/pages/Services.tsx                       — updated: Add Service button + dialog wiring
src/pages/Dashboard.tsx                      — updated: remove contactCount dependency
src/components/dashboard/ServiceSummaryCard.tsx — updated: remove contactCount
vite.config.ts                               — add /api proxy
package.json                                 — add dev:server script, concurrently
.gitignore                                   — add data/
```

---

### Task 1: Backend Setup — Types + Storage

**Files:**
- Create: `server/types.ts`, `server/storage.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Add `data/` to `.gitignore`**

Append to `.gitignore`:

```
# Service config data (contains credentials)
data/
```

- [ ] **Step 2: Create server types**

Create `server/types.ts`:

```typescript
export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

export interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}

export interface ServicePublic {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  authType: AuthConfig['type']
}

export function stripCredentials(config: ServiceConfig): ServicePublic {
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

- [ ] **Step 3: Create storage module**

Create `server/storage.ts`:

```typescript
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import type { ServiceConfig } from './types'

const DATA_DIR = './data'
const DATA_FILE = `${DATA_DIR}/services.json`

interface StorageData {
  services: ServiceConfig[]
}

async function ensureDataFile(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
  if (!existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, JSON.stringify({ services: [] }, null, 2))
  }
}

export async function readServices(): Promise<ServiceConfig[]> {
  await ensureDataFile()
  const raw = await readFile(DATA_FILE, 'utf-8')
  const data: StorageData = JSON.parse(raw)
  return data.services
}

export async function writeServices(services: ServiceConfig[]): Promise<void> {
  await ensureDataFile()
  const data: StorageData = { services }
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}
```

- [ ] **Step 4: Commit**

```bash
git add server/types.ts server/storage.ts .gitignore
git commit -m "feat: add backend types and storage layer for service configs"
```

---

### Task 2: Backend — HTTP Server with CRUD

**Files:**
- Create: `server.ts`
- Modify: `package.json`, `vite.config.ts`

- [ ] **Step 1: Create the Bun HTTP server**

Create `server.ts`:

```typescript
import { readServices, writeServices } from './server/storage'
import { stripCredentials } from './server/types'
import type { ServiceConfig, AuthConfig } from './server/types'
import { proxyContacts } from './server/proxy'

const PORT = 3001

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // CORS for dev
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    const corsHeaders = { 'Access-Control-Allow-Origin': '*' }

    try {
      // GET /api/services
      if (path === '/api/services' && method === 'GET') {
        const services = await readServices()
        return json(services.map(stripCredentials))
      }

      // POST /api/services
      if (path === '/api/services' && method === 'POST') {
        const body = await req.json() as Omit<ServiceConfig, 'id'>
        const services = await readServices()
        const id = generateId(body.name)

        if (services.some((s) => s.id === id)) {
          return json({ error: `Service with id "${id}" already exists` }, 409)
        }

        const newService: ServiceConfig = { id, ...body }
        services.push(newService)
        await writeServices(services)
        return json(stripCredentials(newService), 201)
      }

      // Routes with :id
      const serviceMatch = path.match(/^\/api\/services\/([^/]+)$/)
      const contactsMatch = path.match(/^\/api\/services\/([^/]+)\/contacts$/)

      // GET /api/services/:id/contacts
      if (contactsMatch && method === 'GET') {
        const id = contactsMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)

        const contacts = await proxyContacts(service)
        return json(contacts)
      }

      // GET /api/services/:id
      if (serviceMatch && method === 'GET') {
        const id = serviceMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)
        return json(stripCredentials(service))
      }

      // PUT /api/services/:id
      if (serviceMatch && method === 'PUT') {
        const id = serviceMatch[1]
        const body = await req.json() as Partial<Omit<ServiceConfig, 'id'>>
        const services = await readServices()
        const index = services.findIndex((s) => s.id === id)
        if (index === -1) return json({ error: 'Service not found' }, 404)

        // Merge auth: if auth fields are empty strings, keep existing values
        const existing = services[index]
        let mergedAuth: AuthConfig = existing.auth
        if (body.auth) {
          if (body.auth.type !== existing.auth.type) {
            // Auth type changed — use new auth entirely
            mergedAuth = body.auth
          } else {
            // Same type — merge, keeping existing secrets if new ones are empty
            mergedAuth = { ...existing.auth }
            for (const [key, value] of Object.entries(body.auth)) {
              if (key !== 'type' && value !== '') {
                (mergedAuth as Record<string, string>)[key] = value as string
              }
            }
          }
        }

        services[index] = {
          ...existing,
          ...body,
          id, // id cannot change
          auth: mergedAuth,
        }
        await writeServices(services)
        return json(stripCredentials(services[index]))
      }

      // DELETE /api/services/:id
      if (serviceMatch && method === 'DELETE') {
        const id = serviceMatch[1]
        const services = await readServices()
        const index = services.findIndex((s) => s.id === id)
        if (index === -1) return json({ error: 'Service not found' }, 404)
        services.splice(index, 1)
        await writeServices(services)
        return json({ ok: true })
      }

      return json({ error: 'Not found' }, 404)
    } catch (err) {
      console.error(err)
      return json({ error: 'Internal server error' }, 500)
    }
  },
})

console.log(`OneCRM API server running on http://localhost:${PORT}`)
```

- [ ] **Step 2: Create proxy module**

Create `server/proxy.ts`:

```typescript
import type { ServiceConfig } from './types'

export async function proxyContacts(service: ServiceConfig): Promise<unknown> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  switch (service.auth.type) {
    case 'api-key':
      headers[service.auth.headerName] = service.auth.apiKey
      break
    case 'basic': {
      const encoded = btoa(`${service.auth.username}:${service.auth.password}`)
      headers['Authorization'] = `Basic ${encoded}`
      break
    }
    case 'bearer':
      headers['Authorization'] = `Bearer ${service.auth.token}`
      break
    case 'none':
      break
  }

  const response = await fetch(service.endpoint, { headers })

  if (!response.ok) {
    throw new Error(`External API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
```

- [ ] **Step 3: Add Vite proxy config**

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 4: Update package.json scripts**

Add `concurrently` as a dev dependency and update scripts. The `name` field should also be updated from `onecrm-scaffold` to `onecrm`.

Update `package.json` `name` and `scripts` section:

```json
{
  "name": "onecrm",
  "scripts": {
    "dev": "concurrently \"bun run dev:server\" \"bun run dev:client\"",
    "dev:client": "vite",
    "dev:server": "bun --watch server.ts",
    "build": "tsc -b && vite build",
    "start": "bun server.ts",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Then install concurrently:

```bash
bun add -d concurrently
```

- [ ] **Step 5: Verify backend starts**

```bash
bun run dev:server
```

Expected: `OneCRM API server running on http://localhost:3001`

Test with:
```bash
curl http://localhost:3001/api/services
```

Expected: `[]`

- [ ] **Step 6: Commit**

```bash
git add server.ts server/proxy.ts vite.config.ts package.json bun.lock
git commit -m "feat: add Bun HTTP server with CRUD and proxy endpoints"
```

---

### Task 3: Update Frontend Types

**Files:**
- Modify: `src/services/types.ts`

- [ ] **Step 1: Rewrite types**

Replace `src/services/types.ts` with:

```typescript
export type AuthType = 'none' | 'api-key' | 'basic' | 'bearer'

export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

export interface Service {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  authType: AuthType
}

export interface ServiceFormData {
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}

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
```

- [ ] **Step 2: Commit**

```bash
git add src/services/types.ts
git commit -m "feat: update frontend types for dynamic services"
```

---

### Task 4: Rewrite Frontend API Layer

**Files:**
- Rewrite: `src/services/api.ts`
- Delete: `src/services/mock-data.ts`

- [ ] **Step 1: Rewrite api.ts**

Replace `src/services/api.ts` with:

```typescript
import type { Service, Contact, ServiceFormData } from './types'

const API = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getServices(): Promise<Service[]> {
  return request<Service[]>('/services')
}

export async function getService(id: string): Promise<Service | undefined> {
  try {
    return await request<Service>(`/services/${id}`)
  } catch {
    return undefined
  }
}

export async function getContacts(serviceId: string): Promise<Contact[]> {
  try {
    return await request<Contact[]>(`/services/${serviceId}/contacts`)
  } catch {
    return []
  }
}

export async function getAllContacts(): Promise<Contact[]> {
  const services = await getServices()
  const results = await Promise.allSettled(
    services.map((s) => getContacts(s.id))
  )
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}

export async function createService(data: ServiceFormData): Promise<Service> {
  return request<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateService(id: string, data: ServiceFormData): Promise<Service> {
  return request<Service>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteService(id: string): Promise<void> {
  await request<unknown>(`/services/${id}`, { method: 'DELETE' })
}
```

- [ ] **Step 2: Delete mock-data.ts**

```bash
rm src/services/mock-data.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts && git rm src/services/mock-data.ts
git commit -m "feat: rewrite API layer to use backend, remove mock data"
```

---

### Task 5: Install Shadcn Dialog + Select + Label

**Files:**
- New Shadcn UI components installed

- [ ] **Step 1: Install dialog, select, and label components**

```bash
bunx --bun shadcn@latest add dialog select label --overwrite
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Shadcn dialog, select, and label components"
```

---

### Task 6: Service Form Dialog

**Files:**
- Create: `src/components/services/ServiceFormDialog.tsx`

- [ ] **Step 1: Create the dialog component**

Create `src/components/services/ServiceFormDialog.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Service, ServiceFormData, AuthConfig, AuthType } from '@/services/types'

const ICONS = ['Globe', 'Sparkles', 'TrendingUp', 'Award', 'Building', 'Store', 'Landmark', 'Heart', 'Zap', 'Shield']
const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'api-key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
]

function emptyAuth(type: AuthType): AuthConfig {
  switch (type) {
    case 'none': return { type: 'none' }
    case 'api-key': return { type: 'api-key', apiKey: '', headerName: 'X-API-Key' }
    case 'basic': return { type: 'basic', username: '', password: '' }
    case 'bearer': return { type: 'bearer', token: '' }
  }
}

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ServiceFormData) => Promise<void>
  editingService?: Service
}

export function ServiceFormDialog({ open, onOpenChange, onSubmit, editingService }: ServiceFormDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('Globe')
  const [endpoint, setEndpoint] = useState('')
  const [authType, setAuthType] = useState<AuthType>('none')
  const [apiKey, setApiKey] = useState('')
  const [headerName, setHeaderName] = useState('X-API-Key')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingService) {
      setName(editingService.name)
      setDescription(editingService.description)
      setIcon(editingService.icon)
      setEndpoint(editingService.endpoint)
      setAuthType(editingService.authType)
      // Clear secret fields — backend keeps existing values if empty
      setApiKey('')
      setHeaderName('X-API-Key')
      setUsername('')
      setPassword('')
      setToken('')
    } else {
      setName('')
      setDescription('')
      setIcon('Globe')
      setEndpoint('')
      setAuthType('none')
      setApiKey('')
      setHeaderName('X-API-Key')
      setUsername('')
      setPassword('')
      setToken('')
    }
  }, [editingService, open])

  function buildAuth(): AuthConfig {
    switch (authType) {
      case 'none': return { type: 'none' }
      case 'api-key': return { type: 'api-key', apiKey, headerName }
      case 'basic': return { type: 'basic', username, password }
      case 'bearer': return { type: 'bearer', token }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ name, description, icon, endpoint, auth: buildAuth() })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription>
            {editingService
              ? 'Update the service configuration. Leave credential fields empty to keep existing values.'
              : 'Configure a new external service to pull contacts from.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">API Endpoint URL</Label>
            <Input id="endpoint" type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://example.com/api/contacts" required />
          </div>

          <div className="space-y-2">
            <Label>Authentication</Label>
            <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {authType === 'api-key' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={editingService ? '••••••••' : ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headerName">Header Name</Label>
                <Input id="headerName" value={headerName} onChange={(e) => setHeaderName(e.target.value)} />
              </div>
            </div>
          )}

          {authType === 'basic' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={editingService ? '••••••••' : ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editingService ? '••••••••' : ''} />
              </div>
            </div>
          )}

          {authType === 'bearer' && (
            <div className="space-y-2">
              <Label htmlFor="token">Bearer Token</Label>
              <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={editingService ? '••••••••' : ''} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingService ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/services/ServiceFormDialog.tsx
git commit -m "feat: add service form dialog with dynamic auth fields"
```

---

### Task 7: Update ServiceCard with Edit/Delete

**Files:**
- Modify: `src/components/services/ServiceCard.tsx`

- [ ] **Step 1: Rewrite ServiceCard**

Replace `src/components/services/ServiceCard.tsx` with:

```tsx
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Service } from '@/services/types'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield, Pencil, Trash2 } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/50">
      <CardHeader className="flex flex-row items-center gap-4">
        <Link to={`/services/${service.id}`} className="flex items-center gap-4 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        </Link>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.preventDefault(); onEdit(service) }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.preventDefault(); onDelete(service) }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{service.authType}</Badge>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/services/ServiceCard.tsx
git commit -m "feat: add edit/delete buttons to service cards"
```

---

### Task 8: Update Services Page

**Files:**
- Modify: `src/pages/Services.tsx`

- [ ] **Step 1: Rewrite Services page**

Replace `src/pages/Services.tsx` with:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog'
import { getServices, createService, updateService, deleteService } from '@/services/api'
import type { Service, ServiceFormData } from '@/services/types'

export function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | undefined>()

  const loadServices = useCallback(() => {
    getServices().then(setServices)
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  async function handleSubmit(data: ServiceFormData) {
    if (editingService) {
      await updateService(editingService.id, data)
    } else {
      await createService(data)
    }
    loadServices()
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setDialogOpen(true)
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return
    await deleteService(service.id)
    loadServices()
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setEditingService(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Services</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No services configured yet. Click "Add Service" to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        editingService={editingService}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Services.tsx
git commit -m "feat: wire up Add Service button, edit, and delete on services page"
```

---

### Task 9: Update Dashboard and ServiceSummaryCard

**Files:**
- Modify: `src/pages/Dashboard.tsx`, `src/components/dashboard/ServiceSummaryCard.tsx`

The `Service` type no longer has `contactCount`, so these components need updating.

- [ ] **Step 1: Update ServiceSummaryCard**

Read the current `ServiceSummaryCard.tsx` and replace the `contactCount` display with the `authType` or just remove the count. Replace `src/components/dashboard/ServiceSummaryCard.tsx` with:

```tsx
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import type { Service } from '@/services/types'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

export function ServiceSummaryCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{service.name}</p>
            <p className="text-xs text-muted-foreground">{service.description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Update Dashboard**

Replace `src/pages/Dashboard.tsx` with:

```tsx
import { useEffect, useState } from 'react'
import { Users, CalendarDays, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ServiceSummaryCard } from '@/components/dashboard/ServiceSummaryCard'
import { RecentContacts } from '@/components/dashboard/RecentContacts'
import { getServices, getAllContacts } from '@/services/api'
import type { Service, Contact } from '@/services/types'

export function Dashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [s, c] = await Promise.all([getServices(), getAllContacts()])
        setServices(s)
        setContacts(c)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalContacts = contacts.length
  const todayContacts = contacts.filter(
    (c) => c.date === new Date().toISOString().split('T')[0]
  ).length
  const newContacts = contacts.filter((c) => c.status === 'new').length

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Contacts" value={totalContacts} icon={Users} />
        <StatsCard title="Today" value={todayContacts} icon={CalendarDays} />
        <StatsCard title="New (Pending)" value={newContacts} icon={Clock} />
      </div>

      {services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Services</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceSummaryCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentContacts contacts={contacts} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
bun run build
```

Expected: build passes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/ServiceSummaryCard.tsx
git commit -m "feat: update dashboard and summary card for dynamic services"
```
