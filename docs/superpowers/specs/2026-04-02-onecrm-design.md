# OneCRM — Design Spec

## Purpose

A centralized CRM dashboard that aggregates contact form submissions from all enterprise services (md3w, aalii, invfunds, walapoints, masejed) into one unified interface. Frontend-only for now; real API integration later.

## Tech Stack

- **Runtime**: Bun
- **Build**: Vite
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn/ui
- **Routing**: React Router v7
- **Tables**: TanStack Table v8
- **Data**: Mock data layer, swappable for real APIs

## Pages

### 1. Dashboard (`/`)

Overview page with:
- Summary cards: total contacts across all services, contacts today, pending contacts
- Per-service card row: each service shows its name, logo, and contact count
- Recent submissions table: last 10 contacts across all services

### 2. Services (`/services`)

Grid of service cards, each showing:
- Service name and logo/icon
- Description
- Total contact form submissions count
- Click navigates to service detail

### 3. Service Detail (`/services/:serviceId`)

Full data table for one service's contact form submissions:
- **Columns**: Name, Email, Phone, Message, Date, Status
- **Features**: sorting, filtering by column, text search, pagination (20 per page)
- **Status values**: new, contacted, converted, archived

## Data Models

### Service

```typescript
interface Service {
  id: string
  name: string
  description: string
  icon: string // icon name or path
  contactCount: number
}
```

### Contact

```typescript
interface Contact {
  id: string
  serviceId: string
  name: string
  email: string
  phone: string
  message: string
  date: string // ISO date
  status: 'new' | 'contacted' | 'converted' | 'archived'
}
```

## Services List

| ID           | Name        | Description                        |
|--------------|-------------|------------------------------------|
| md3w         | MD3W        | Web development platform           |
| aalii        | Aalii       | Digital solutions service          |
| invfunds     | InvFunds    | Investment funds management        |
| walapoints   | WalaPoints  | Loyalty points system              |
| masejed      | Masejed     | Mosque management platform         |

## Data Layer

`src/services/api.ts` exports:
- `getServices(): Promise<Service[]>`
- `getService(id: string): Promise<Service>`
- `getContacts(serviceId: string): Promise<Contact[]>`
- `getAllContacts(): Promise<Contact[]>`

Currently backed by mock data in `src/services/mock-data.ts`. Each function returns a Promise to match future API behavior. Swapping to real APIs means replacing the implementation without changing the interface.

## Layout

- **Sidebar**: fixed left, contains navigation links (Dashboard, Services)
- **Top bar**: app title "OneCRM", breadcrumbs
- **Main content**: right of sidebar, scrollable
- **Responsive**: sidebar collapses to hamburger menu on mobile

## File Structure

```
src/
  components/
    layout/
      Sidebar.tsx
      TopBar.tsx
      Layout.tsx
    dashboard/
      StatsCard.tsx
      RecentContacts.tsx
      ServiceSummaryCard.tsx
    services/
      ServiceCard.tsx
      ContactsTable.tsx
  pages/
    Dashboard.tsx
    Services.tsx
    ServiceDetail.tsx
  services/
    api.ts
    mock-data.ts
    types.ts
  App.tsx
  main.tsx
```
