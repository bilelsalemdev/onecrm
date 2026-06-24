import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { Gauge, Boxes } from 'lucide-react'
import { getServices } from '@/services/api'
import type { Service } from '@onecrm/shared'

const navItems = [
  { to: '/', label: 'Overview', icon: Gauge, end: true },
  { to: '/services', label: 'Services', icon: Boxes, end: true },
]

/** Three jacks converging into one node — many lines, one desk. */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 5 L13 12 M3 12 H13 M3 19 L13 12" />
      <circle cx="16" cy="12" r="3.1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="3" cy="19" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Sidebar() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    getServices().then(setServices).catch(() => setServices([]))
  }, [])

  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Nameplate */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BrandMark className="h-5 w-5" />
        </div>
        <div className="leading-none">
          <h1 className="font-heading text-[15px] font-bold tracking-tight">OneCRM</h1>
          <p className="eyebrow mt-1.5">Review desk</p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="px-3 pt-4">
        <p className="eyebrow px-2 pb-2">Desk</p>
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-md pl-3.5 pr-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Patch panel — connected services */}
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-5">
        <div className="flex items-center justify-between px-2 pb-2">
          <p className="eyebrow">Services</p>
          <span className="readout text-[11px] text-muted-foreground">{String(services.length).padStart(2, '0')}</span>
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {services.length === 0 ? (
            <p className="readout text-[11px] text-muted-foreground/60 px-2 py-2 leading-relaxed">
              No lines connected
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {services.map((service) => (
                <NavLink
                  key={service.id}
                  to={`/services/${service.id}`}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 ${
                      isActive
                        ? 'bg-sidebar-accent text-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                    }`
                  }
                >
                  {/* brand-color jack */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: service.color ?? 'var(--muted-foreground)' }}
                  />
                  <span className="truncate flex-1">{service.name}</span>
                  {/* connected lamp */}
                  <span className="text-lamp-green opacity-70 group-hover:opacity-100">
                    <span className="lamp lamp-sm" />
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System readout */}
      <div className="px-4 py-3.5 border-t border-sidebar-border">
        <div className="flex items-center gap-2 readout text-[11px] text-muted-foreground">
          <span className="text-lamp-green"><span className="lamp lamp-sm animate-lamp" /></span>
          <span className="text-foreground/70">ONLINE</span>
          <span className="ml-auto text-muted-foreground/60">v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}
