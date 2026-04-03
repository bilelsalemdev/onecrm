import { NavLink } from 'react-router'
import { LayoutDashboard, Building2, Layers } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/services', label: 'Services', icon: Building2 },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary shadow-sm">
          <Layers className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">OneCRM</h1>
          <p className="text-[11px] text-sidebar-foreground/40 font-medium">Service Hub</p>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 p-3 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/90'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <p className="text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">Internal Tool</p>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
