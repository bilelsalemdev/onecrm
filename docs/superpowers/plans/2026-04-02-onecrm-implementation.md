# OneCRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CRM frontend dashboard that aggregates contact form submissions from enterprise services (md3w, aalii, invfunds, walapoints, masejed) with mock data, ready for real API integration.

**Architecture:** Vite + React SPA with React Router for page routing, Shadcn/ui components for UI, TanStack Table for data tables, and a mock data layer behind an async API interface that can be swapped for real fetch calls later.

**Tech Stack:** Bun, Vite, React 19, TypeScript, Tailwind CSS v4, Shadcn/ui, React Router v7, TanStack Table v8

---

## File Structure

```
onecrm/
  src/
    components/
      layout/
        Sidebar.tsx          — sidebar nav with links
        TopBar.tsx           — top bar with title + breadcrumbs
        Layout.tsx           — shell combining sidebar + topbar + outlet
      dashboard/
        StatsCard.tsx        — single stat card (icon, label, value)
        ServiceSummaryCard.tsx — per-service summary (name, icon, count)
        RecentContacts.tsx   — last 10 contacts table
      services/
        ServiceCard.tsx      — clickable service card for grid
        ContactsTable.tsx    — full data table with sort/filter/pagination
    pages/
      Dashboard.tsx          — dashboard page
      Services.tsx           — services grid page
      ServiceDetail.tsx      — single service contact table page
    services/
      types.ts               — Service and Contact interfaces
      mock-data.ts           — mock services and contacts
      api.ts                 — async API functions
    lib/
      utils.ts               — cn() utility for Shadcn
    App.tsx                  — router setup
    main.tsx                 — entry point
    index.css                — Tailwind imports + globals
  components.json            — Shadcn/ui config
  tailwind.config.ts         — Tailwind config (if needed by Shadcn)
  tsconfig.json
  vite.config.ts
  package.json
  index.html
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Initialize Vite project with Bun**

```bash
cd /mnt/c/Users/bilel/Desktop/neov/onecrm
bun create vite . --template react-ts
```

Select React + TypeScript when prompted. If the directory isn't empty, accept overwrite.

- [ ] **Step 2: Install dependencies**

```bash
bun install
```

- [ ] **Step 3: Verify dev server starts**

```bash
bun run dev
```

Expected: Vite dev server starts on localhost:5173

- [ ] **Step 4: Initialize git and commit**

```bash
git init
git add -A
git commit -m "feat: initialize Vite + React + TypeScript project with Bun"
```

---

### Task 2: Tailwind CSS + Shadcn/ui Setup

**Files:**
- Modify: `package.json` (new deps), `src/index.css`, `vite.config.ts`, `tsconfig.json`
- Create: `components.json`, `src/lib/utils.ts`

- [ ] **Step 1: Install Tailwind CSS v4**

```bash
bun add tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Add Tailwind Vite plugin to `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 3: Replace `src/index.css` with Tailwind import**

```css
@import "tailwindcss";
```

- [ ] **Step 4: Add path alias to `tsconfig.json`**

Add to `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 5: Add path alias to `vite.config.ts`**

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
})
```

- [ ] **Step 6: Initialize Shadcn/ui**

```bash
bunx --bun shadcn@latest init
```

Choose: New York style, Zinc color, CSS variables: yes. This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 7: Install Shadcn components we need**

```bash
bunx --bun shadcn@latest add card table badge button input separator sheet
```

- [ ] **Step 8: Verify Tailwind works**

Replace `src/App.tsx` with:

```tsx
function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">OneCRM</h1>
    </div>
  )
}

export default App
```

Run `bun run dev` — should see blue bold heading.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS v4 and Shadcn/ui"
```

---

### Task 3: Data Layer — Types, Mock Data, API

**Files:**
- Create: `src/services/types.ts`, `src/services/mock-data.ts`, `src/services/api.ts`

- [ ] **Step 1: Create types**

Create `src/services/types.ts`:

```typescript
export interface Service {
  id: string
  name: string
  description: string
  icon: string
  contactCount: number
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

- [ ] **Step 2: Create mock data**

Create `src/services/mock-data.ts`:

```typescript
import type { Service, Contact } from './types'

export const services: Service[] = [
  {
    id: 'md3w',
    name: 'MD3W',
    description: 'Web development platform',
    icon: 'Globe',
    contactCount: 24,
  },
  {
    id: 'aalii',
    name: 'Aalii',
    description: 'Digital solutions service',
    icon: 'Sparkles',
    contactCount: 18,
  },
  {
    id: 'invfunds',
    name: 'InvFunds',
    description: 'Investment funds management',
    icon: 'TrendingUp',
    contactCount: 31,
  },
  {
    id: 'walapoints',
    name: 'WalaPoints',
    description: 'Loyalty points system',
    icon: 'Award',
    contactCount: 12,
  },
  {
    id: 'masejed',
    name: 'Masejed',
    description: 'Mosque management platform',
    icon: 'Building',
    contactCount: 9,
  },
]

const firstNames = ['Ahmed', 'Fatima', 'Omar', 'Yasmine', 'Karim', 'Nour', 'Bilel', 'Sara', 'Mehdi', 'Amina']
const lastNames = ['Benali', 'Khoury', 'Mansouri', 'Haddad', 'Zahra', 'Dridi', 'Bouazizi', 'Jaziri', 'Trabelsi', 'Sfar']
const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com']
const messages = [
  'I would like to learn more about your services.',
  'Can you provide a demo of the platform?',
  'Interested in enterprise pricing.',
  'Need help with integration.',
  'Looking for a partnership opportunity.',
  'Having issues with my account.',
  'Want to upgrade my plan.',
  'Question about API access.',
]
const statuses: Contact['status'][] = ['new', 'contacted', 'converted', 'archived']

function generateContacts(): Contact[] {
  const contacts: Contact[] = []
  let id = 1

  for (const service of services) {
    for (let i = 0; i < service.contactCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const daysAgo = Math.floor(Math.random() * 90)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      contacts.push({
        id: String(id++),
        serviceId: service.id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        phone: `+213 ${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
        message: messages[Math.floor(Math.random() * messages.length)],
        date: date.toISOString().split('T')[0],
        status: statuses[Math.floor(Math.random() * statuses.length)],
      })
    }
  }

  return contacts.sort((a, b) => b.date.localeCompare(a.date))
}

export const contacts: Contact[] = generateContacts()
```

- [ ] **Step 3: Create API layer**

Create `src/services/api.ts`:

```typescript
import type { Service, Contact } from './types'
import { services, contacts } from './mock-data'

export async function getServices(): Promise<Service[]> {
  return services
}

export async function getService(id: string): Promise<Service | undefined> {
  return services.find((s) => s.id === id)
}

export async function getContacts(serviceId: string): Promise<Contact[]> {
  return contacts.filter((c) => c.serviceId === serviceId)
}

export async function getAllContacts(): Promise<Contact[]> {
  return contacts
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/
git commit -m "feat: add data types, mock data, and API layer"
```

---

### Task 4: Layout Components

**Files:**
- Create: `src/components/layout/Sidebar.tsx`, `src/components/layout/TopBar.tsx`, `src/components/layout/Layout.tsx`

- [ ] **Step 1: Install React Router and Lucide icons**

```bash
bun add react-router lucide-react
```

- [ ] **Step 2: Create Sidebar**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import { NavLink } from 'react-router'
import { LayoutDashboard, Building2 } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/services', label: 'Services', icon: Building2 },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40 p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold tracking-tight">OneCRM</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create TopBar**

Create `src/components/layout/TopBar.tsx`:

```tsx
import { useLocation, Link } from 'react-router'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function TopBar() {
  const location = useLocation()

  const breadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: 'Dashboard', to: '/' }]

    const crumbs = [{ label: 'Home', to: '/' }]
    let path = ''
    for (const part of parts) {
      path += `/${part}`
      crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1), to: path })
    }
    return crumbs
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs().map((crumb, i, arr) => (
          <span key={crumb.to} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {i === arr.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
```

- [ ] **Step 4: Create Layout shell**

Create `src/components/layout/Layout.tsx`:

```tsx
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add layout components (sidebar, topbar, shell)"
```

---

### Task 5: Dashboard Page

**Files:**
- Create: `src/components/dashboard/StatsCard.tsx`, `src/components/dashboard/ServiceSummaryCard.tsx`, `src/components/dashboard/RecentContacts.tsx`, `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create StatsCard**

Create `src/components/dashboard/StatsCard.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
}

export function StatsCard({ title, value, icon: Icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create ServiceSummaryCard**

Create `src/components/dashboard/ServiceSummaryCard.tsx`:

```tsx
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import type { Service } from '@/services/types'
import { Globe, Sparkles, TrendingUp, Award, Building } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Sparkles,
  TrendingUp,
  Award,
  Building,
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
          <div className="text-right">
            <p className="text-lg font-bold">{service.contactCount}</p>
            <p className="text-xs text-muted-foreground">contacts</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 3: Create RecentContacts**

Create `src/components/dashboard/RecentContacts.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Contact } from '@/services/types'

const statusVariant: Record<Contact['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  contacted: 'secondary',
  converted: 'outline',
  archived: 'destructive',
}

export function RecentContacts({ contacts }: { contacts: Contact[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.slice(0, 10).map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.serviceId}</TableCell>
            <TableCell>{contact.date}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[contact.status]}>
                {contact.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 4: Create Dashboard page**

Create `src/pages/Dashboard.tsx`:

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

  useEffect(() => {
    getServices().then(setServices)
    getAllContacts().then(setContacts)
  }, [])

  const totalContacts = contacts.length
  const todayContacts = contacts.filter(
    (c) => c.date === new Date().toISOString().split('T')[0]
  ).length
  const newContacts = contacts.filter((c) => c.status === 'new').length

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Contacts" value={totalContacts} icon={Users} />
        <StatsCard title="Today" value={todayContacts} icon={CalendarDays} />
        <StatsCard title="New (Pending)" value={newContacts} icon={Clock} />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Services</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceSummaryCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentContacts contacts={contacts} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ src/pages/Dashboard.tsx
git commit -m "feat: add dashboard page with stats, service cards, and recent contacts"
```

---

### Task 6: Services Page

**Files:**
- Create: `src/components/services/ServiceCard.tsx`, `src/pages/Services.tsx`

- [ ] **Step 1: Create ServiceCard**

Create `src/components/services/ServiceCard.tsx`:

```tsx
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Service } from '@/services/types'
import { Globe, Sparkles, TrendingUp, Award, Building } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Sparkles,
  TrendingUp,
  Award,
  Building,
}

export function ServiceCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{service.contactCount} contacts</Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Create Services page**

Create `src/pages/Services.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { ServiceCard } from '@/components/services/ServiceCard'
import { getServices } from '@/services/api'
import type { Service } from '@/services/types'

export function Services() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    getServices().then(setServices)
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Services</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/services/ServiceCard.tsx src/pages/Services.tsx
git commit -m "feat: add services listing page with service cards"
```

---

### Task 7: Service Detail Page with ContactsTable

**Files:**
- Create: `src/components/services/ContactsTable.tsx`, `src/pages/ServiceDetail.tsx`

- [ ] **Step 1: Install TanStack Table**

```bash
bun add @tanstack/react-table
```

- [ ] **Step 2: Create ContactsTable**

Create `src/components/services/ContactsTable.tsx`:

```tsx
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown } from 'lucide-react'
import type { Contact } from '@/services/types'

const statusVariant: Record<Contact['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  contacted: 'secondary',
  converted: 'outline',
  archived: 'destructive',
}

const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-[200px]">{row.getValue('message')}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Contact['status']
      return <Badge variant={statusVariant[status]}>{status}</Badge>
    },
  },
]

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: contacts,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search contacts..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} contact(s)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ServiceDetail page**

Create `src/pages/ServiceDetail.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { getService, getContacts } from '@/services/api'
import { ContactsTable } from '@/components/services/ContactsTable'
import type { Service, Contact } from '@/services/types'
import { Globe, Sparkles, TrendingUp, Award, Building } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Sparkles,
  TrendingUp,
  Award,
  Building,
}

export function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [service, setService] = useState<Service | undefined>()
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    if (!serviceId) return
    getService(serviceId).then(setService)
    getContacts(serviceId).then(setContacts)
  }, [serviceId])

  if (!service) {
    return <div className="p-8 text-center text-muted-foreground">Service not found</div>
  }

  const Icon = iconMap[service.icon] ?? Globe

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{service.name}</h2>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/services/ContactsTable.tsx src/pages/ServiceDetail.tsx
git commit -m "feat: add service detail page with sortable, filterable contacts table"
```

---

### Task 8: Router Setup and Final Wiring

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Wire up React Router in `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Services } from '@/pages/Services'
import { ServiceDetail } from '@/pages/ServiceDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:serviceId" element={<ServiceDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: Ensure `src/main.tsx` is clean**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Clean up default Vite files**

Delete any leftover Vite boilerplate files:
- `src/App.css` (if exists)
- `src/assets/` (if not needed)

- [ ] **Step 4: Run dev server and verify all pages**

```bash
bun run dev
```

Verify:
- `/` — Dashboard with stats, service cards, recent contacts
- `/services` — Grid of 5 service cards
- `/services/md3w` — Contact table with search, sort, pagination
- Sidebar navigation works
- Mobile hamburger menu works

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up routing and finalize OneCRM app"
```
